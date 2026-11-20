  // ---- bar, reveal-on-scroll, and the style menu
  const html = document.documentElement, bar = document.getElementById('bar');
  document.getElementById('brand').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
  const onScroll = () => bar.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(([e]) => bar.classList.toggle('named', !e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-56px 0px 0px 0px' }).observe(document.getElementById('name'));

  const rvObs = new IntersectionObserver(entries => {
    let n = 0;
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.transitionDelay = (n++ * 40) + 'ms'; e.target.classList.add('shown'); }
      else { e.target.style.transitionDelay = '0ms'; e.target.classList.remove('shown'); }
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  const mobile = matchMedia('(width < 860px)');
  let projectObserver;
  let revealHeight = 0;
  function observeReveals() {
    rvObs.disconnect(); projectObserver?.disconnect();
    document.querySelectorAll('.rv').forEach(el => {
      if (!mobile.matches || !el.matches('.work-sec .item')) rvObs.observe(el);
    });
    if (!mobile.matches) return;
    revealHeight = document.getElementById('svhProbe').offsetHeight || innerHeight;
    // The bottom 30% is reserved for the anchored molecule. Reveal text only
    // after its leading edge has entered the reading area above the peptide.
    projectObserver = new IntersectionObserver(entries => {
      for (const e of entries) {
        e.target.style.transitionDelay = '0ms';
        e.target.classList.toggle('shown', e.isIntersecting);
      }
    }, { rootMargin: `0px 0px -${Math.round(revealHeight * .30)}px 0px`, threshold: 0 });
    document.querySelectorAll('.work-sec .item.rv').forEach(el => projectObserver.observe(el));
  }
  mobile.addEventListener('change', observeReveals);
  new ResizeObserver(() => {
    if (mobile.matches && Math.abs(document.getElementById('svhProbe').offsetHeight - revealHeight) > 1) observeReveals();
  }).observe(document.getElementById('svhProbe'));
  observeReveals();

  // light (Oat) / dark (Kiln)
  const themeBtn = document.getElementById('themeBtn');
  themeBtn.addEventListener('click', () => {
    const dark = html.dataset.palette !== 'kiln';
    html.dataset.palette = dark ? 'kiln' : 'oat';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    syncThemeColor();
    dispatchEvent(new CustomEvent('stylechange', { detail: { key: 'palette' } }));
  });
  syncThemeColor();
