// POST /api/clinica — the live demo of the clinics' WhatsApp bot on the landing (ChatWidget bot="clinica").
// It forwards each visitor message to the bot's own simulator, POST /prueba in ../chatbot-clinicas (no WhatsApp involved),
// as a patient of the demo clinic. The bot's code is not touched or copied: this is just a client of that endpoint,
// and the bot keeps the conversation on its side (per patient number).
//
// Needs: CLINIC_BOT_URL (where chatbot-clinicas runs: https://app.getmansfield.com, or a local
// `npm run dev` one like http://localhost:8787) and CLINIC_ADMIN_KEY (the bot's ADMIN_KEY). The key never reaches the browser.
// In production: `npx wrangler pages secret put CLINIC_ADMIN_KEY --project-name mansfield-site` (and CLINIC_BOT_URL).

// Demo clinic in the bot's production database: same data as Norte Dental, no real WhatsApp (chatbot-clinicas/clinicas/demo-web.json).
const CLINICA = 'demo-web';
const ALLOWED_HOSTS = /^(getmansfield\.com|www\.getmansfield\.com|[a-z0-9-]+\.mansfield-site\.pages\.dev|localhost|127\.0\.0\.1)$/;
// Web visitors get fake numbers in their own range, so the web can only ever reach demo conversations.
const TEL = /^52199\d{8}$/;

type Env = { CLINIC_BOT_URL?: string; CLINIC_ADMIN_KEY?: string };
type Body = { tel?: string; texto?: string; toca?: { titulo?: string; descripcion?: string }; reiniciar?: boolean };
type Opcion = { titulo: string; descripcion: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin) {
    try { if (!ALLOWED_HOSTS.test(new URL(origin).hostname)) return json({ error: 'forbidden' }, 403); } catch { return json({ error: 'forbidden' }, 403); }
  }
  if (!env.CLINIC_BOT_URL || !env.CLINIC_ADMIN_KEY) return json({ error: 'not_configured' }, 503);

  let b: Body;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!b.tel || !TEL.test(b.tel)) return json({ error: 'bad_request' }, 400);

  let payload: Record<string, unknown>;
  if (b.reiniciar) payload = { reiniciar: true, borrar_citas: true };
  else if (b.toca?.titulo) payload = { toca: { titulo: String(b.toca.titulo).slice(0, 100), descripcion: String(b.toca.descripcion ?? '').slice(0, 200) } };
  else if (b.texto?.trim()) payload = { texto: b.texto.trim().slice(0, 1000) };
  else return json({ error: 'bad_request' }, 400);

  const r = await fetch(new URL('/prueba', env.CLINIC_BOT_URL), {
    method: 'POST',
    headers: { authorization: `Bearer ${env.CLINIC_ADMIN_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ clinica_id: CLINICA, tel: b.tel, nombre: 'Visitante web', ...payload }),
  }).catch(() => null);
  if (!r || !r.ok) {
    console.error('clinic bot error', r?.status, r && (await r.text()).slice(0, 500));
    return json({ error: 'upstream' }, 502);
  }
  if (b.reiniciar) return json({ ok: true });

  const d = (await r.json()) as { respuestas?: string[]; opciones?: Opcion[]; avisos?: string[]; pausado?: boolean };
  // The simulator appends the buttons to the message as text ("  [1] ..."); the widget draws real buttons instead.
  const respuestas = (d.respuestas ?? []).map((t) => t.split('\n  [1] ')[0]).filter((t) => t.trim());
  // Notices are what the clinic's staff would get on their WhatsApp. "[a avisos generales] ..." → just the text.
  const avisos = (d.avisos ?? []).map((a) => a.replace(/^\[[^\]]*\]\s*/, '').replace(/\nChat: wa\.me\/\d+/, ''));
  return json({ respuestas, opciones: d.opciones ?? [], avisos, pausado: !!d.pausado });
}
