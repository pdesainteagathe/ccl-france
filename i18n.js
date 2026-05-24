// i18n.js — moteur de traduction léger, sans dépendances

let currentLang = 'fr';

/**
 * Accès rapide à une clé de traduction depuis app.js :
 *   window.t('carbon_price_label')
 */
window.t = function(key) {
  return (translations[currentLang] && translations[currentLang][key])
    || (translations['fr'] && translations['fr'][key])
    || key;
};

/**
 * Change la langue et met à jour toute l'interface.
 * @param {string} lang  Code langue ('fr', 'en', …)
 */
function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // 1. Attribut lang sur <html> (accessibilité + SEO)
  document.documentElement.lang = lang;

  // 2. <title>
  const titleKey = document.title && document.querySelector('title[data-i18n]')
    ? document.querySelector('title').getAttribute('data-i18n')
    : 'page_title';
  document.title = window.t(titleKey);

  // 3. Éléments avec data-i18n (textContent)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = window.t(key);
    if (value) el.textContent = value;
  });

  // 4. Éléments avec data-i18n-tooltip (attribut data-tooltip)
  document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
    const key = el.getAttribute('data-i18n-tooltip');
    const value = window.t(key);
    if (value) el.setAttribute('data-tooltip', value);
  });

  // 5. Mettre à jour les boutons de langue actifs
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // 6. Notifier app.js si besoin (re-render des graphiques, labels, etc.)
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// Au chargement : langue sauvegardée → langue navigateur → français par défaut
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lang');

  const browserLang = navigator.language?.toLowerCase() || '';
  let detected = 'fr'; // fallback
  if (browserLang.startsWith('de')) detected = 'de';
  else if (browserLang.startsWith('en')) detected = 'en';
  else if (browserLang.startsWith('fr')) detected = 'fr';

  setLang(saved || detected);
});