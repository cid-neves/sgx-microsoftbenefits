// ════════════════════════════════════════════════════════════════════
// src/i18n.js — Internationalisation helpers
// ════════════════════════════════════════════════════════════════════
import { I18N } from './data.js';
import { LANG, setLANG } from './state.js';

/**
 * Translate a key using the active language, falling back to English.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  const lang = LANG || 'en';
  return (I18N[lang] && I18N[lang][key]) || (I18N['en'] && I18N['en'][key]) || key;
}

/**
 * Apply translated strings to all elements carrying a [data-i18n] attribute.
 */
export function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
}

/**
 * Switch the active language and re-apply translations.
 * @param {string} lang  e.g. 'en', 'pt'
 */
export function setLang(lang) {
  if (!I18N[lang]) lang = 'en';
  setLANG(lang);
  document.documentElement.lang = lang;
  applyI18n();
}

/**
 * Detect the preferred language from the browser or query string.
 * @returns {string}  language code
 */
export function detectLang() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('lang')) return params.get('lang');
  const saved = localStorage.getItem('sg_lang');
  if (saved) return saved;
  const nav = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
  return I18N[nav] ? nav : 'en';
}
