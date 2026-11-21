// What we sell, in one place: the landing (src/pages/index.astro) renders it and the website chat assistant
// (functions/api/chat.ts) reads it for its instructions, so a price change here updates both.
import { waLink } from './consts';

// The text each WhatsApp button pre-fills, one per topic. Our WhatsApp bot will read the first message to know what the
// person came for, so these are a contract with it: keep them exact (change them here and tell whoever runs that bot).
// The chat assistant (functions/api/chat.ts) tags each answer with one of these topics and its WhatsApp button follows.
export const WA_MSG = {
  clinica: 'Hola, quiero la instalación gratis del chatbot de WhatsApp para mi clínica.',
  clinica_demo: 'Hola, probé el chatbot en la página y lo quiero para mi clínica.',
  basico: 'Hola, quiero el paquete Básico del chatbot de WhatsApp para mi clínica, con la instalación gratis.',
  estandar: 'Hola, quiero el paquete Estándar del chatbot de WhatsApp para mi clínica, con la instalación gratis.',
  premium: 'Hola, quiero el paquete Premium del chatbot de WhatsApp para mi clínica, con la instalación gratis.',
  chatbot: 'Hola, quiero un chatbot de WhatsApp para mi negocio.',
  automatizacion: 'Hola, quiero automatizar procesos de mi negocio.',
  mvp: 'Hola, tengo un proyecto a medias (o una idea) y quiero terminarlo.',
  web: 'Hola, quiero una web para mi negocio.',
  general: 'Hola, vengo de la página de Mansfield y quiero más información.',
} as const;
export type Tema = keyof typeof WA_MSG;
export const waPlan = (name: string) => waLink(WA_MSG[name === 'Básico' ? 'basico' : name === 'Premium' ? 'premium' : 'estandar']);

// Three packages; Estándar is the one we push ("Recomendado", not "más elegido": there are no customers yet to back that up).
// First 5 clinics: free install in any package and 30 days before the first payment (a Premium request starts on Estándar until
// Premium is ready; that's handled in private). After those 5: same trial, and the install can be split into the monthly fees.
// Upgrade: right away, prorated, install already paid is credited. Downgrade: from the next charge, no penalty. Cancel any time.
export type Plan = { name: string; month: string; install: string; base?: string; items: string[]; pick?: boolean };
export const plans: Plan[] = [
  { name: 'Básico', month: '$2,500', install: '$3,000', items: ['Responde 24/7 en segundos', 'Toma nombre y tratamiento', 'Agenda en tu agenda o en Google Calendar', 'Te pasa al paciente cuando hace falta (a ti o a la clínica)', 'Resumen semanal de pacientes interesados'] },
  { name: 'Estándar', month: '$5,000', install: '$5,000', base: 'Básico', pick: true, items: ['Recordatorio 24 h antes, con confirmar o reprogramar', 'Seguimiento a quien no agendó', 'Reporte mensual'] },
  { name: 'Premium', month: '$10,000', install: '$7,500', base: 'Estándar', items: ['Seguimiento de presupuestos de tratamientos grandes', 'Reactivación de pacientes inactivos', 'Solicitud de reseña en Google', 'Instagram y Messenger', 'Varios doctores o sucursales', 'Reporte semanal con ingreso estimado'] },
];
export const features = [
  ['Contesta precios', 'Responde al momento con los servicios de tu clínica y sus precios.'],
  ['Agenda citas', 'Pregunta día y hora, confirma la cita con el paciente y la deja en la agenda que ya usas, o en Google Calendar.'],
  ['Atiende fuera de horario', 'Noches, fines de semana y días festivos. El paciente que escribe a las 11 p. m. ya no se va con otra clínica.'],
  ['Te pasa lo importante', 'Urgencias, dudas sobre un tratamiento o quejas: te pasa la conversación para que la atiendas tú o tu equipo.'],
];
export const faq = [
  ['¿El chatbot da consejos médicos o diagnósticos?', 'No. Solo da información de tu clínica: precios, horarios, ubicación y citas. Si un paciente pregunta por síntomas, dolor, medicamentos o qué tratamiento necesita, el chatbot no contesta eso: le dice que lo valorará el doctor y te pasa la conversación.'],
  ['¿Funciona con el WhatsApp de mi clínica?', 'Sí. Se conecta a tu número de WhatsApp Business, así tus pacientes te siguen escribiendo al mismo número de siempre.'],
  ['¿Qué pasa con las urgencias o si no sabe la respuesta?', 'Te pasa la conversación para que tu equipo conteste. Ningún paciente se queda sin respuesta.'],
  ['¿Qué incluye la instalación gratis?', `Configuramos el chatbot con tus tratamientos, precios, horarios y ubicación, lo conectamos a tu WhatsApp y lo probamos contigo. Normalmente cuesta de $3,000 a $7,500 según el paquete; para las primeras 5 clínicas es gratis, en el paquete que elijan.`],
  ['¿Cuándo empiezo a pagar?', `Pruebas el chatbot 30 días sin pagar nada. Si no te gusta, lo dejas ahí. Si te quedas, pagas la mensualidad de tu paquete a partir del día 30.`],
  ['¿Hay contrato o plazo forzoso?', 'No. Si un día ya no lo quieres, lo cancelas.'],
  ['¿Puedo cambiar de paquete?', 'Sí. Si subes, el cambio es inmediato: pagas solo la diferencia proporcional y lo que ya pagaste de instalación se abona. Si bajas, aplica desde tu siguiente cobro, sin penalización.'],
  ['¿Y si ya se llenaron los 5 lugares?', `Igual tienes el primer mes de prueba: si no te gusta, no pagas ni instalación ni mensualidad. Si te quedas, pagas la instalación de tu paquete y, si prefieres, la repartimos en tus mensualidades.`],
  ['¿Puedo cambiar precios u horarios después?', 'Sí. Nos escribes y lo actualizamos.'],
  ['¿Necesito saber de tecnología?', 'No. Nosotros lo configuramos todo; tú solo nos dices cómo funciona tu clínica.'],
];
// [title, text, WhatsApp link, examples page (optional)]
export const services: [string, string, string, string?][] = [
  ['Chatbots', 'Asistentes de WhatsApp para cualquier negocio: restaurantes, inmobiliarias, tiendas.', waLink(WA_MSG.chatbot)],
  ['Automatizaciones', 'Lo que hoy haces a mano, hecho solo: facturas, recordatorios, cotizaciones, reportes.', waLink(WA_MSG.automatizacion)],
  ['MVPs', '¿Tienes una idea que quieres probar o una app que se quedó a medias? La terminamos.', waLink(WA_MSG.mvp)],
  ['Webs', 'Webs a la medida, rápidas en el celular y con WhatsApp a un toque.', waLink(WA_MSG.web), '/webs'],
];
