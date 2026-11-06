(() => {
  const key = 'lo9os-language';
  const page = document.documentElement.dataset.page;
  const route = lang => `${lang === 'en' ? '/en' : ''}${page === 'privacy' ? '/privacy/' : page === '404' ? '/404.html' : '/'}`;
  let preferred;
  try { preferred = localStorage.getItem(key); } catch { /* The links work without storage. */ }
  document.querySelectorAll('[data-language]').forEach(link => {
    link.addEventListener('click', () => {
      try { localStorage.setItem(key, link.dataset.language); } catch { /* Storage is optional. */ }
    });
  });
  // Honor saved English on default-language entry pages. Explicit /en/ URLs stay English.
  if (document.documentElement.lang === 'ko' && preferred === 'en') {
    location.replace(route('en') + location.hash);
  }
})();
