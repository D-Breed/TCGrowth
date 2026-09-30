/* ==========================================================================
   TCGrowth site script
   1. Preferences (theme + font size), applied before first paint and saved
   2. Slideshow: manual arrows, keyboard support, full-screen mode
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const KEYS = { theme: 'tcg-theme', font: 'tcg-font-size' };

  // localStorage can throw (private mode, blocked storage), so every access is guarded.
  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* preference just won't persist */ }
    }
  };

  /* ---------- 1. Apply saved preferences immediately --------------------
     This file is loaded in <head>, so these lines run before the body renders
     and the page never flashes the wrong theme or text size. */
  const savedTheme = store.get(KEYS.theme);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.bsTheme = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : (prefersDark ? 'dark' : 'light');
  root.dataset.fontSize = store.get(KEYS.font) === 'large' ? 'large' : 'medium';

  document.addEventListener('DOMContentLoaded', () => {
    initPreferences();
    initSlideshow();
  });

  /* ---------- Preference toggles ----------------------------------------
     Both settings live on <html>, so the homepage and the full-screen
     slideshow always share the same theme and text size. */
  function initPreferences() {
    const themeBtn = document.getElementById('themeToggle');
    const fontBtn = document.getElementById('fontToggle');

    const sync = () => {
      themeBtn.setAttribute('aria-pressed', String(root.dataset.bsTheme === 'dark'));
      fontBtn.setAttribute('aria-pressed', String(root.dataset.fontSize === 'large'));
    };

    themeBtn.addEventListener('click', () => {
      root.dataset.bsTheme = root.dataset.bsTheme === 'dark' ? 'light' : 'dark';
      store.set(KEYS.theme, root.dataset.bsTheme);
      sync();
    });

    fontBtn.addEventListener('click', () => {
      root.dataset.fontSize = root.dataset.fontSize === 'large' ? 'medium' : 'large';
      store.set(KEYS.font, root.dataset.fontSize);
      sync();
    });

    sync();
  }

  /* ---------- 2. Slideshow ---------------------------------------------- */
  function initSlideshow() {
    const show = document.getElementById('slideshow');
    const slides = Array.from(show.querySelectorAll('.slide'));
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const counter = document.getElementById('slideCounter');
    const homeLink = document.getElementById('homeLink');
    const nav = document.getElementById('siteNav');
    const pageContent = document.querySelectorAll('[data-page-content]');

    let index = 0;
    let fullscreen = false;

    // Number each slide for screen readers ("3 of 10") from its position,
    // so slides can be added, removed or reordered without editing labels.
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    });

    // Keep --nav-h equal to the real nav height (it grows with large text),
    // so the full-screen slideshow starts exactly below the nav.
    new ResizeObserver(([entry]) => {
      root.style.setProperty('--nav-h', `${entry.borderBoxSize[0].blockSize}px`);
    }).observe(nav);

    function render() {
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      prevBtn.setAttribute('aria-disabled', String(index === 0));
      nextBtn.setAttribute('aria-disabled', String(fullscreen && index === slides.length - 1));
      counter.textContent = `Slide ${index + 1} of ${slides.length}`;
    }

    function setFullscreen(on) {
      fullscreen = on;
      show.classList.toggle('is-fullscreen', on);
      document.body.classList.toggle('slideshow-open', on);
      // While full screen, the page behind is inert so Tab stays in the nav + slideshow.
      pageContent.forEach((el) => { el.inert = on; });
      nextBtn.setAttribute('aria-label', on ? 'Next slide' : 'Next slide (opens full screen)');
    }

    // Leaving full screen returns the deck to the Welcome slide.
    function closeSlideshow() {
      if (!fullscreen) return false;
      setFullscreen(false);
      index = 0;
      render();
      return true;
    }

    // Forward arrow: opens full screen on first use, then advances.
    function next() {
      if (nextBtn.getAttribute('aria-disabled') === 'true') return;
      if (!fullscreen) setFullscreen(true);
      index = Math.min(index + 1, slides.length - 1);
      render();
    }

    function prev() {
      if (index === 0) return;
      index -= 1;
      render();
    }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    // TCGrowth (Home) link: close full screen, then the normal #top link scrolls to the header.
    homeLink.addEventListener('click', closeSlideshow);

    // Arrow keys work while focus is anywhere inside the slideshow.
    show.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });

    // Esc closes full screen from anywhere; focus returns to the forward arrow.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && closeSlideshow()) nextBtn.focus();
    });

    render();
  }
})();
