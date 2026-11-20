// Load the expensive renderer only as the work section approaches the viewport.
const work = document.getElementById('work');
let started = false;
function loadPeptide() {
  if (started) return;
  started = true;
  observer?.disconnect();
  import('./peptide.js').catch(error => {
    document.documentElement.classList.remove('peptide-live');
    console.warn('Peptide unavailable; using static fallback.', error);
  });
}
let observer;
if ('IntersectionObserver' in window) {
  observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) loadPeptide();
  }, { rootMargin: '100% 0px' });
  observer.observe(work);
} else loadPeptide();
