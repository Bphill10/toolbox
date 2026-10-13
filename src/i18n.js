// Translations. Add a language by adding a block; add a string by adding a key
// to every block. Any element with data-t="key" gets its text replaced.
const I18N = {
  en: {
    'app.title': 'Toolbox',
    'nav.home': 'Home',
    'nav.people': 'People',
    'home.heading': 'Welcome',
    'home.intro': 'Pick a tool above.',
    'people.heading': 'People',
  },
  es: {
    'app.title': 'Caja de herramientas',
    'nav.home': 'Inicio',
    'nav.people': 'Personas',
    'home.heading': 'Bienvenido',
    'home.intro': 'Elige una herramienta arriba.',
    'people.heading': 'Personas',
  },
};

function applyLang(lang) {
  const t = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-t]')) {
    if (t[el.dataset.t]) el.textContent = t[el.dataset.t];
  }
  try { localStorage.setItem('lang', lang); } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('lang');
  for (const code of Object.keys(I18N)) sel.add(new Option(code.toUpperCase(), code));
  let saved = 'en';
  try { saved = localStorage.getItem('lang') || 'en'; } catch {}
  sel.value = saved;
  sel.onchange = () => applyLang(sel.value);
  applyLang(saved);
});
