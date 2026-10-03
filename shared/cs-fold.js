/* Fit a case study's hero band to the first screen, so its bottom edge is
   the fold and the whole picture is visible on opening.

   Loaded by each case study, and injected by the homepages into the overlay
   frame as well — the Slack page's HTML only changes on a rebuild, so that
   is how it gets this today. Safe to load twice.

   The band starts wherever the title and lede end, which depends on how they
   wrap, so it is measured rather than set in CSS. Every hero stays full
   bleed — the band always spans the panel. Three kinds:
   - a padded band with one picture centred in it (Slack, Visual Design): the
     band takes the remaining height and the picture shrinks to fit inside
     its padding;
   - a bleed picture wider than the panel (Systems): it keeps its width, and
     the band's padding gives way instead;
   - PayPal's plate, whose phone screen is positioned in percentages of the
     band: the plate keeps its size and the band crops it at the fold, top
     kept, with the screen pinned in pixels so it stays on the phone. */
(() => {
  if (window.__csFold) return;
  window.__csFold = true;

  const band = document.querySelector('.cs-heroVisual');
  const scroller = document.querySelector('[data-modal]');
  const panel = document.querySelector('.cs-panel');
  if (!band || !scroller || !panel) return;

  const plate = band.querySelector('.cs-heroVisual__plate');
  const screen = band.querySelector('.cs-heroVisual__screen');
  const pic = plate ? null : band.firstElementChild;
  const bleed = !!(pic && pic.matches('.cs-shot--bleed'));
  const MIN_PAD = 32;         // bleed heroes: the least padding left above and below
  const MIN = 320;            // never squeeze a hero below this
  const MAX_GROWTH = 1.4;     // on very tall screens, stop growing the band here

  // The scroll-in reveal nudges elements down with a transform; measure
  // where they will settle, not where they are mid-animation.
  const shiftY = (el) => {
    const t = getComputedStyle(el).transform;
    return t && t !== 'none' ? new DOMMatrix(t).m42 : 0;
  };

  const reset = () => {
    band.style.height = band.style.aspectRatio = '';
    band.style.paddingTop = band.style.paddingBottom = '';
    if (pic) pic.style.width = '';
    if (plate) plate.style.height = '';
    if (screen) screen.style.top = screen.style.height = '';
  };

  const fit = () => {
    reset();
    const b = band.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const top = (b.top - shiftY(band)) - (p.top - shiftY(panel))
      + parseFloat(getComputedStyle(scroller).paddingTop);
    const h = Math.round(Math.max(MIN, Math.min(scroller.clientHeight - top, b.height * MAX_GROWTH)));

    if (plate) {
      if (h >= b.height) return;
      const s = screen && getComputedStyle(screen);
      const sTop = s && s.top, sHeight = s && s.height;
      band.style.aspectRatio = 'auto';
      band.style.height = h + 'px';
      plate.style.height = b.height + 'px';
      if (screen) { screen.style.top = sTop; screen.style.height = sHeight; }
      return;
    }

    const r = pic ? pic.getBoundingClientRect() : null;
    band.style.aspectRatio = 'auto';
    band.style.height = h + 'px';
    if (r && r.height && bleed) {
      const cs = getComputedStyle(band);
      const pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
      const spare = h - r.height;
      if (spare < pt + pb) {
        // share what is left in the band's own top:bottom proportion
        const k = Math.max(0, spare) / (pt + pb);
        band.style.paddingTop = Math.max(MIN_PAD, pt * k) + 'px';
        band.style.paddingBottom = Math.max(MIN_PAD, pb * k) + 'px';
      }
    } else if (r && r.height) {
      const cs = getComputedStyle(band);
      const room = h - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const w = Math.min(r.width, room * (r.width / r.height));
      if (w < r.width) pic.style.width = w + 'px';
    }
  };

  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  addEventListener('load', fit);
  let frame = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  });
})();
