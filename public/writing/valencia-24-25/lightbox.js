(() => {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;
  let src = '';
  const box = document.createElement('div');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Notes, full size');
  box.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(10,10,9,.92);display:none;overflow:hidden;touch-action:none;cursor:grab';
  box.innerHTML = '<img alt="Notes, full size" draggable="false" style="position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;user-select:none;will-change:transform">' +
    '<div style="position:absolute;top:12px;right:12px;display:flex;gap:8px">' +
    ['−:out:Zoom out', '+:in:Zoom in', '⤢:fit:Fit', '✕:close:Close'].map(b => { const [t, a, l] = b.split(':'); return `<button data-a="${a}" aria-label="${l}" style="width:40px;height:40px;border-radius:999px;border:0;background:rgba(28,25,23,.85);color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.25);font-size:18px;cursor:pointer">${t}</button>`; }).join('') + '</div>';
  document.body.appendChild(box);
  const img = box.querySelector('img');
  let s = 1, x = 0, y = 0, fit = 1, loaded = false;
  const apply = () => { img.style.transform = `translate(${x}px,${y}px) scale(${s})`; };
  const doFit = () => { const W = innerWidth, H = innerHeight, w = img.naturalWidth, h = img.naturalHeight; fit = Math.min((W - 24) / w, (H - 80) / h); s = fit; x = (W - w * s) / 2; y = 64 + (H - 64 - h * s) / 2; apply(); };
  const zoomAt = (k, cx, cy) => { const ns = Math.min(Math.max(s * k, fit * 0.8), 4); x = cx - (cx - x) * (ns / s); y = cy - (cy - y) * (ns / s); s = ns; apply(); };
  const open = (e) => { e.preventDefault(); const t = e.currentTarget; const next = t.getAttribute('data-lightbox'); const alt = t.getAttribute('data-alt'); if (alt) { img.alt = alt; box.setAttribute('aria-label', alt); } box.style.display = 'block'; document.body.style.overflow = 'hidden'; if (next !== src) { src = next; loaded = false; } if (!loaded) { img.onload = doFit; img.src = src; loaded = true; if (img.complete && img.naturalWidth) doFit(); } else doFit(); };
  const close = () => { box.style.display = 'none'; document.body.style.overflow = ''; };
  triggers.forEach(t => t.addEventListener('click', open));
  addEventListener('keydown', e => { if (box.style.display === 'block') { if (e.key === 'Escape') close(); if (e.key === '+' || e.key === '=') zoomAt(1.4, innerWidth / 2, innerHeight / 2); if (e.key === '-') zoomAt(1 / 1.4, innerWidth / 2, innerHeight / 2); } });
  addEventListener('resize', () => box.style.display === 'block' && doFit());
  box.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const a = b.dataset.a, c = [innerWidth / 2, innerHeight / 2]; if (a === 'close') close(); if (a === 'in') zoomAt(1.5, ...c); if (a === 'out') zoomAt(1 / 1.5, ...c); if (a === 'fit') doFit(); }));
  box.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
  const pts = new Map(); let moved = false, lastDist = 0, downOnImg = false;
  box.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false; downOnImg = e.target === img; box.style.cursor = 'grabbing'; if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  box.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId); const dx = e.clientX - p[0], dy = e.clientY - p[1]; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (pts.size === 1) { x += dx; y += dy; apply(); }
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (lastDist) zoomAt(d / lastDist, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); lastDist = d; } });
  const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); lastDist = 0; box.style.cursor = 'grab';
    if (!moved && pts.size === 0) { if (downOnImg) { s > fit * 1.05 ? doFit() : zoomAt(2.5 * fit / s, e.clientX, e.clientY); } else close(); } };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
})();
