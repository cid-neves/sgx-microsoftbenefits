// ════════════════════════════════════════════════════════════════════
// src/i18n.js — Internationalisation helpers
// ════════════════════════════════════════════════════════════════════
import { I18N } from './data.js';
import { LANG, setLANG } from './state.js';
// Render imports (circular deps safe in ES modules — resolved at call time)
import { renderUsage } from './render/usage.js';
import { renderFin1, renderFin2, renderCloud } from './render/finance.js';
import { renderAll, renderPricesPage, renderPurchaseTab } from './render/allpacks.js';

export function detectLang() {
  const stored = localStorage.getItem('sg_lang');
  if (stored) return stored;
  const bl = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
  return bl.startsWith('en') ? 'en' : 'es';
}

export function t(key) { return (I18N[LANG] && I18N[LANG][key]) || (I18N['en'] && I18N['en'][key]) || key; }

export function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.getElementById('btn-en').classList.toggle('active', LANG === 'en');
  document.getElementById('btn-es').classList.toggle('active', LANG === 'es');
  document.documentElement.lang = LANG;
  renderUsage();
  const at = document.querySelector('.tabpanel.active');
  if (at) { const id = at.id; if(id==='t-all') renderAll(); if(id==='t-cloud') renderCloud(); if(id==='t-fin1') renderFin1(); if(id==='t-fin2') renderFin2(); if(id==='t-prices') renderPricesPage(); if(id==='t-purchase') renderPurchaseTab(); }
}

export function setLang(l) {
  setLANG(l);
  localStorage.setItem('sg_lang', l);
  applyI18n();
}
