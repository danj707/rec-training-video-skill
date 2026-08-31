(() => {
  if (!document.getElementById('__cap')) {
    const cap = document.createElement('div'); cap.id = '__cap';
    cap.style.cssText = 'position:fixed;z-index:2147483647;left:50%;transform:translateX(-50%);bottom:26px;' +
      'width:min(900px,82%);background:rgba(15,23,42,.94);color:#fff;padding:16px 22px;border-radius:14px;' +
      'font-family:Inter,system-ui,-apple-system,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.4);transition:opacity .25s;';
    cap.innerHTML = '<div id="__capt" style="font-weight:700;font-size:15px;color:#7ee2a8;letter-spacing:.3px;margin-bottom:6px"></div>' +
      '<div id="__capb" style="font-weight:450;font-size:16px;line-height:1.5"></div>';
    document.body.appendChild(cap);
  }
  if (!document.getElementById('__cur')) {
    const cur = document.createElement('div'); cur.id = '__cur';
    cur.style.cssText = 'position:fixed;z-index:2147483647;width:20px;height:20px;border-radius:50%;' +
      'background:rgba(37,99,235,.35);border:2px solid rgba(37,99,235,.9);pointer-events:none;' +
      'left:60px;top:60px;transition:left .5s cubic-bezier(.22,.7,.3,1),top .5s cubic-bezier(.22,.7,.3,1);';
    document.body.appendChild(cur);
  }
  window.__setCap = (t, b) => { const c = document.getElementById('__capt'), d = document.getElementById('__capb'); if (c) c.textContent = t; if (d) d.innerHTML = b; };
  window.__cur = (x, y) => { const e = document.getElementById('__cur'); if (e) { e.style.left = (x - 10) + 'px'; e.style.top = (y - 10) + 'px'; } };

  // Hide stray floating widgets (e.g. a leftover "Active Order" POS cart timer) that can
  // pop up over a page mid-recording and have nothing to do with the walkthrough. Finds the
  // fixed/sticky-positioned ancestor of any matching text and hides that whole widget.
  const STRAY_TEXT = /active order|view order/i;
  const hideStray = (root) => {
    for (const el of root.querySelectorAll('body *')) {
      if (el.id === '__cap' || el.id === '__cur' || el.closest('#__cap')) continue;
      const txt = el.textContent;
      if (!txt || txt.length > 400 || !STRAY_TEXT.test(txt)) continue;
      let node = el;
      while (node && node !== document.body) {
        const pos = getComputedStyle(node).position;
        if (pos === 'fixed' || pos === 'sticky') { node.style.setProperty('display', 'none', 'important'); break; }
        node = node.parentElement;
      }
    }
  };
  hideStray(document);
  if (!window.__strayObserver) {
    window.__strayObserver = new MutationObserver(() => hideStray(document));
    window.__strayObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
