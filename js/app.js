
// js/app.js
import { i18n } from './i18n.js';

let apiKey = localStorage.getItem('omnimath_gemini_key') || '';

document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
  updateKeyStatusUi();

  // Language toggle listener
  document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    i18n.toggleLanguage();
    updateKeyStatusUi();
  });

  // Modal triggers
  document.getElementById('openKeyModalBtn')?.addEventListener('click', openKeyModal);
  document.getElementById('closeKeyModalBtn')?.addEventListener('click', closeKeyModal);
  document.getElementById('cancelKeyModalBtn')?.addEventListener('click', closeKeyModal);
  document.getElementById('saveKeyBtn')?.addEventListener('click', testAndSaveKey);
});

function openKeyModal() {
  const modal = document.getElementById('keyModal');
  const input = document.getElementById('geminiKeyInput');
  if (input) input.value = apiKey;
  modal?.classList.remove('hidden');
}

function closeKeyModal() {
  document.getElementById('keyModal')?.classList.add('hidden');
}

function updateKeyStatusUi() {
  const dot = document.getElementById('apiStatusDot');
  const label = document.getElementById('apiStatusLabel');
  if (!dot || !label) return;

  if (apiKey && apiKey.startsWith('AIza')) {
    dot.className = "w-2 h-2 rounded-full bg-emerald-400";
    label.innerText = i18n.t('activeKeyStatus');
  } else {
    dot.className = "w-2 h-2 rounded-full bg-rose-400";
    label.innerText = i18n.t('needKeyStatus');
  }
}

async function testAndSaveKey() {
  const input = document.getElementById('geminiKeyInput');
  const feedback = document.getElementById('keyFeedback');
  const key = input?.value.trim();

  if (!feedback) return;
  feedback.classList.remove('hidden');

  if (!key || !key.startsWith('AIza')) {
    feedback.className = "p-3 rounded-xl text-xs font-semibold bg-rose-100 text-rose-800";
    feedback.innerText = i18n.t('keyInvalid');
    return;
  }

  feedback.className = "p-3 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800";
  feedback.innerText = i18n.t('testingKey');

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
    });

    if (res.ok) {
      apiKey = key;
      localStorage.setItem('omnimath_gemini_key', key);
      updateKeyStatusUi();
      feedback.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800";
      feedback.innerText = i18n.t('keyValid');
      setTimeout(closeKeyModal, 1000);
    } else {
      throw new Error();
    }
  } catch (err) {
    feedback.className = "p-3 rounded-xl text-xs font-semibold bg-rose-100 text-rose-800";
    feedback.innerText = i18n.t('keyInvalid');
  }
}
