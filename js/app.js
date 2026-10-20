// js/app.js
import { i18n } from './i18n.js';
import { classesData } from './curriculum.js';

const AI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

let currentClassId = classesData[0].id;
let userLanguage = localStorage.getItem('omnimath_lang');
let apiKey = localStorage.getItem('omnimath_gemini_key') || '';
let currentHwImageBase64 = null;
let currentHwType = "hint";

document.addEventListener('DOMContentLoaded', () => {
  // Check First-Time Setup
  if (!userLanguage || !apiKey || !apiKey.startsWith('AIza')) {
    initOnboardingGateway();
  } else {
    bootMainApp();
  }

  setupEventListeners();
});

function bootMainApp() {
  i18n.setLanguage(userLanguage);
  applyStaticTranslations();
  populateClassDropdown();
  renderChapterCards();
}

function setupEventListeners() {
  // Language selection during onboarding
  document.getElementById('chooseLangAsBtn')?.addEventListener('click', () => pickLanguage('as'));
  document.getElementById('chooseLangEnBtn')?.addEventListener('click', () => pickLanguage('en'));

  // Header language toggle
  document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    const nextLang = i18n.currentLang === 'as' ? 'en' : 'as';
    pickLanguage(nextLang);
  });

  // Direct Key Redirection
  document.getElementById('directRedirectBtn')?.addEventListener('click', () => {
    sessionStorage.setItem('omnimath_redirected', 'true');
    window.open(AI_STUDIO_URL, '_blank');
    showKeyPasteScreen();
  });

  document.getElementById('reopenGoogleBtn')?.addEventListener('click', () => {
    window.open(AI_STUDIO_URL, '_blank');
  });

  document.getElementById('saveAndLaunchBtn')?.addEventListener('click', verifyAndLaunch);

  // Return from Google tab listener
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !apiKey && userLanguage) {
      if (sessionStorage.getItem('omnimath_redirected') === 'true') {
        showKeyPasteScreen();
      }
    }
  });

  // Class Dropdown Change
  document.getElementById('classSelectDropdown')?.addEventListener('change', (e) => {
    currentClassId = e.target.value;
    renderChapterCards();
  });

  // Search Input
  document.getElementById('conceptSearchInput')?.addEventListener('input', handleUniversalSearch);

  // Homework Helper Modals
  document.getElementById('openHwBtn')?.addEventListener('click', openHomeworkModal);
  document.getElementById('closeHwBtn')?.addEventListener('click', closeHomeworkModal);

  // Homework Image Handling
  document.getElementById('hwCameraInput')?.addEventListener('change', handleHwImage);
  document.getElementById('hwFileInput')?.addEventListener('change', handleHwImage);
  document.getElementById('hwRemoveImgBtn')?.addEventListener('click', clearHwImage);

  // Homework Mode Buttons
  document.querySelectorAll('.hw-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hw-type-btn').forEach(b => b.classList.remove('active-hw-type'));
      btn.classList.add('active-hw-type');
      currentHwType = btn.getAttribute('data-type');
    });
  });

  document.getElementById('askHwBtn')?.addEventListener('click', submitHomeworkQuery);
  document.getElementById('closeWsBtn')?.addEventListener('click', closeWorkspace);
}

// Onboarding Logic
function initOnboardingGateway() {
  const portal = document.getElementById('onboardingPortal');
  portal?.classList.remove('hidden');

  if (!userLanguage) {
    document.getElementById('onboardingStepLang')?.classList.remove('hidden');
    document.getElementById('onboardingStepKeyRedirect')?.classList.add('hidden');
    document.getElementById('onboardingStepKeyPaste')?.classList.add('hidden');
  } else {
    showKeyRedirectScreen();
  }
}

function pickLanguage(lang) {
  userLanguage = lang;
  i18n.setLanguage(lang);
  applyStaticTranslations();

  if (!apiKey) {
    showKeyRedirectScreen();
  } else {
    bootMainApp();
  }
}

function showKeyRedirectScreen() {
  document.getElementById('onboardingStepLang')?.classList.add('hidden');
  document.getElementById('onboardingStepKeyPaste')?.classList.add('hidden');
  const redirectScreen = document.getElementById('onboardingStepKeyRedirect');
  redirectScreen?.classList.remove('hidden');

  document.getElementById('portalKeyTitle').innerText = i18n.t('portalKeyTitle');
  document.getElementById('portalKeyDesc').innerText = i18n.t('portalKeyDesc');
  document.getElementById('redirectBtnText').innerText = i18n.t('redirectBtnText');
}

function showKeyPasteScreen() {
  document.getElementById('onboardingStepKeyRedirect')?.classList.add('hidden');
  const pasteScreen = document.getElementById('onboardingStepKeyPaste');
  pasteScreen?.classList.remove('hidden');

  document.getElementById('portalPasteTitle').innerText = i18n.t('portalPasteTitle');
  document.getElementById('portalPasteDesc').innerText = i18n.t('portalPasteDesc');
  document.getElementById('launchBtnText').innerText = i18n.t('launchBtnText');
  document.getElementById('reopenGoogleBtnText').innerText = i18n.t('reopenGoogleBtnText');

  setTimeout(() => document.getElementById('geminiKeyInput')?.focus(), 200);
}

async function verifyAndLaunch() {
  const input = document.getElementById('geminiKeyInput');
  const feedback = document.getElementById('portalFeedback');
  const btn = document.getElementById('saveAndLaunchBtn');
  const key = input?.value.trim();

  if (!feedback) return;
  feedback.classList.remove('hidden');

  if (!key || !key.startsWith('AIza')) {
    feedback.className = "mt-3 p-2.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 text-center";
    feedback.innerText = i18n.t('keyInvalid');
    return;
  }

  feedback.className = "mt-3 p-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 text-center";
  feedback.innerText = i18n.t('verifyingKey');
  btn.disabled = true;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
    });

    if (res.ok) {
      apiKey = key;
      localStorage.setItem('omnimath_gemini_key', key);
      sessionStorage.removeItem('omnimath_redirected');

      feedback.className = "mt-3 p-2.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 text-center";
      feedback.innerText = i18n.t('keyValid');

      setTimeout(() => {
        document.getElementById('onboardingPortal')?.classList.add('hidden');
        btn.disabled = false;
        bootMainApp();
      }, 700);
    } else {
      throw new Error();
    }
  } catch (err) {
    btn.disabled = false;
    feedback.className = "mt-3 p-2.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 text-center";
    feedback.innerText = i18n.t('keyFailed');
  }
}

// Translations Injector
function applyStaticTranslations() {
  document.getElementById('uiBrandTitle').innerText = i18n.t('brandTitle');
  document.getElementById('uiBrandTagline').innerText = i18n.t('brandTagline');
  document.getElementById('currentLangLabel').innerText = i18n.currentLang === 'as' ? 'English' : 'অসমীয়া';
  document.getElementById('conceptSearchInput').placeholder = i18n.t('searchPlaceholder');
  document.getElementById('uiSelectClassLabel').innerText = i18n.t('selectClassLabel');
  document.getElementById('uiHwNavText').innerText = i18n.t('hwNavText');
  document.getElementById('uiHwTitle').innerText = i18n.t('hwTitle');
  document.getElementById('uiCaptureBtnText').innerText = i18n.t('captureBtn');
  document.getElementById('uiUploadBtnText').innerText = i18n.t('uploadBtn');
  document.getElementById('hwTextInput').placeholder = i18n.t('hwPlaceholder');
  document.getElementById('uiHwModeSelectLabel').innerText = i18n.t('hwModeLabel');
  document.getElementById('uiHwOptHint').innerText = i18n.t('hwHint');
  document.getElementById('uiHwOptStep').innerText = i18n.t('hwStep');
  document.getElementById('uiHwOptCheck').innerText = i18n.t('hwCheck');
  document.getElementById('uiAskBtnText').innerText = i18n.t('askBtn');
}

function populateClassDropdown() {
  const dd = document.getElementById('classSelectDropdown');
  if (!dd) return;
  dd.innerHTML = '';

  classesData.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = c.title[i18n.currentLang];
    if (c.id === currentClassId) opt.selected = true;
    dd.appendChild(opt);
  });
}

function renderChapterCards() {
  const container = document.getElementById('chaptersContainer');
  if (!container) return;
  container.innerHTML = '';

  const currentClass = classesData.find(c => c.id === currentClassId) || classesData[0];

  currentClass.chapters.forEach(ch => {
    const card = document.createElement('div');
    card.className = "bg-white border-2 border-amber-200/90 rounded-3xl p-5 hover:border-amber-400 hover:shadow-lg transition flex flex-col justify-between";

    card.innerHTML = `
      <div>
        <h4 class="font-extrabold text-slate-900 text-lg">${ch.title[i18n.currentLang]}</h4>
        <p class="text-xs text-slate-600 my-1.5 leading-relaxed">${ch.desc[i18n.currentLang]}</p>
        <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-2 text-center my-3 text-amber-950 font-mono text-sm overflow-x-auto">
          $$${ch.formula}$$
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100">
        <button class="action-learn-btn bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs py-2 rounded-xl transition text-center" data-id="${ch.id}">
          📖 ${i18n.t('learnBtn')}
        </button>
        <button class="action-play-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs py-2 rounded-xl transition text-center" data-id="${ch.id}">
          🎮 ${i18n.t('playBtn')}
        </button>
        <button class="action-test-btn bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold text-xs py-2 rounded-xl transition text-center" data-id="${ch.id}">
          ✍️ ${i18n.t('testBtn')}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach button triggers
  container.querySelectorAll('.action-learn-btn').forEach(btn => {
    btn.onclick = () => launchWorkspace(btn.getAttribute('data-id'), 'learn');
  });
  container.querySelectorAll('.action-play-btn').forEach(btn => {
    btn.onclick = () => launchWorkspace(btn.getAttribute('data-id'), 'play');
  });
  container.querySelectorAll('.action-test-btn').forEach(btn => {
    btn.onclick = () => launchWorkspace(btn.getAttribute('data-id'), 'test');
  });

  if (window.renderMathInElement) {
    renderMathInElement(container, { delimiters: [{ left: '$$', right: '$$', display: true }] });
  }
}

// Universal Search
function handleUniversalSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!dropdown) return;

  if (query.length < 2) {
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
    return;
  }

  const results = [];
  classesData.forEach(c => {
    c.chapters.forEach(ch => {
      const matchAs = ch.title.as.toLowerCase().includes(query) || ch.desc.as.toLowerCase().includes(query);
      const matchEn = ch.title.en.toLowerCase().includes(query) || ch.desc.en.toLowerCase().includes(query);
      if (matchAs || matchEn) {
        results.push({ ...ch, classTitle: c.title[i18n.currentLang] });
      }
    });
  });

  if (results.length === 0) {
    dropdown.innerHTML = `<div class="p-4 text-xs text-slate-500 text-center">কোনো ধাৰণা পোৱা নগ'ল / No concept found</div>`;
  } else {
    dropdown.innerHTML = results.map(r => `
      <div class="search-result-item p-3 border-b border-slate-100 hover:bg-amber-50 cursor-pointer flex justify-between items-center" data-id="${r.id}">
        <div>
          <h5 class="text-sm font-bold text-slate-900">${r.title[i18n.currentLang]}</h5>
          <span class="text-[10px] text-amber-700 font-semibold uppercase">${r.classTitle}</span>
        </div>
        <span class="text-xs text-amber-700 font-bold">খোলক &rarr;</span>
      </div>
    `).join('');

    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.onclick = () => {
        dropdown.classList.add('hidden');
        launchWorkspace(item.getAttribute('data-id'), 'learn');
      };
    });
  }

  dropdown.classList.remove('hidden');
}

// Workspace Logic: Learn / Play / Test
function launchWorkspace(chapterId, mode) {
  let foundChapter = null;
  classesData.forEach(c => {
    const ch = c.chapters.find(x => x.id === chapterId);
    if (ch) foundChapter = ch;
  });
  if (!foundChapter) return;

  const modal = document.getElementById('workspaceModal');
  const badge = document.getElementById('wsModeBadge');
  const title = document.getElementById('wsChapterTitle');
  const body = document.getElementById('wsBody');

  badge.innerText = mode.toUpperCase();
  title.innerText = foundChapter.title[i18n.currentLang];
  modal?.classList.remove('hidden');

  if (mode === 'learn') {
    renderLearnMode(foundChapter, body);
  } else if (mode === 'play') {
    renderPlayMode(foundChapter, body);
  } else if (mode === 'test') {
    renderTestMode(foundChapter, body);
  }

  if (window.renderMathInElement) {
    renderMathInElement(body, { delimiters: [{ left: '$$', right: '$$', display: true }] });
  }
}

function closeWorkspace() {
  document.getElementById('workspaceModal')?.classList.add('hidden');
}

// 1. Procedural Learn Mode
function renderLearnMode(ch, container) {
  const isAs = i18n.currentLang === 'as';
  container.innerHTML = `
    <div class="space-y-4">
      <div class="prose max-w-none text-sm text-slate-700 leading-relaxed">
        ${ch.learnHtml[i18n.currentLang]}
      </div>

      <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200">
        <h5 class="text-xs font-bold text-amber-900 uppercase">${isAs ? 'প্ৰধান সূত্ৰ' : 'Core Identity'}</h5>
        <div class="text-center text-lg my-2 font-mono">$$${ch.formula}$$</div>
      </div>

      <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
        <h5 class="text-xs font-bold text-emerald-900 uppercase">${isAs ? 'ধাৰণাৰ পৰীক্ষণ' : 'Understanding Check'}</h5>
        <p class="text-xs text-emerald-800 mt-1">
          ${isAs ? 'ধাৰণাটো স্পষ্ট হ’লনে? তলৰ বুটামত ক্লিক কৰি অনুৰূপ খেল বা পৰীক্ষা আৰম্ভ কৰক।' : 'Ready to explore further? Jump into the dynamic sandbox or test yourself.'}
        </p>
      </div>
    </div>
  `;
}

// 2. Procedural Play Sandbox (Virtual Balance Scale)
function renderPlayMode(ch, container) {
  const isAs = i18n.currentLang === 'as';
  let target = Math.floor(Math.random() * 8) + 4;
  let currentVal = 0;

  container.innerHTML = `
    <div class="space-y-4 text-center">
      <p class="text-sm font-bold text-slate-800">
        ${isAs ? `তুলাচনীৰ সোঁফালে যোগ কৰি মুঠ মান <b>${i18n.toDigits(target)}</b> ৰ সমান কৰক:` : `Add weights to balance the scale to exactly <b>${target}</b>:`}
      </p>

      <!-- Visual Scale Balance -->
      <div class="p-6 bg-amber-50 rounded-2xl border-2 border-amber-300 flex justify-around items-center min-h-[140px]">
        <div class="bg-amber-600 text-white font-black text-xl p-4 rounded-2xl shadow">
          <span>🎯</span> ${i18n.toDigits(target)}
        </div>
        <div class="text-2xl font-black text-amber-800">=</div>
        <div id="playCurrentBox" class="bg-white border-2 border-amber-400 text-amber-900 font-black text-xl p-4 rounded-2xl shadow min-w-[70px]">
          ${i18n.toDigits(0)}
        </div>
      </div>

      <div id="playFeedback" class="text-xs font-bold h-5 text-amber-700"></div>

      <!-- Tactile Adders -->
      <div class="flex justify-center gap-3">
        <button id="addWeight1" class="px-4 py-2.5 bg-white border-2 border-amber-400 hover:bg-amber-100 text-amber-950 font-bold rounded-xl shadow-sm">+${i18n.toDigits(1)}</button>
        <button id="addWeight2" class="px-4 py-2.5 bg-white border-2 border-amber-400 hover:bg-amber-100 text-amber-950 font-bold rounded-xl shadow-sm">+${i18n.toDigits(2)}</button>
        <button id="resetPlayWeight" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">🔄</button>
      </div>
    </div>
  `;

  const box = container.querySelector('#playCurrentBox');
  const feed = container.querySelector('#playFeedback');

  container.querySelector('#addWeight1').onclick = () => updateWeight(1);
  container.querySelector('#addWeight2').onclick = () => updateWeight(2);
  container.querySelector('#resetPlayWeight').onclick = () => {
    currentVal = 0;
    box.innerText = i18n.toDigits(currentVal);
    feed.innerText = '';
  };

  function updateWeight(val) {
    currentVal += val;
    box.innerText = i18n.toDigits(currentVal);

    if (currentVal === target) {
      feed.className = "text-xs font-bold h-5 text-emerald-700 animate-bounce";
      feed.innerText = isAs ? "🎉 অসাধাৰণ! সমতা নিশ্চিত হ’ল!" : "🎉 Splendid! Equilibrium achieved!";
    } else if (currentVal > target) {
      feed.className = "text-xs font-bold h-5 text-rose-700";
      feed.innerText = isAs ? "অলপ বেছি হ’ল! পুনৰ চেষ্টা কৰক।" : "A bit over! Reset and try again.";
    }
  }
}

// 3. Infinite Procedural Test Mode with Joyful Guidance
function renderTestMode(ch, container) {
  const isAs = i18n.currentLang === 'as';
  const a = Math.floor(Math.random() * 6) + 2;
  const b = Math.floor(Math.random() * 5) + 3;
  const correctAnswer = a + b;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <span class="text-xs font-bold text-amber-700 uppercase">${isAs ? 'পৰীক্ষাৰ প্ৰশ্ন' : 'Diagnostic Challenge'}</span>
        <h4 class="text-lg font-black text-slate-900 mt-1">
          ${isAs ? `তলৰ সমীকৰণটো সমাধান কৰক:` : `Solve the given equation:`}
        </h4>
        <div class="text-center text-xl font-bold my-3 font-mono">
          ${i18n.toDigits(a)} + ${i18n.toDigits(b)} = ?
        </div>
      </div>

      <div class="flex gap-2">
        <input type="number" id="testAnsInput" placeholder="?" 
               class="flex-1 p-3 border-2 border-slate-300 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none" />
        <button id="testSubmitBtn" class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl transition">
          ${isAs ? 'উত্তৰ চাওক' : 'Check'}
        </button>
      </div>

      <!-- Compassionate Rescue Box -->
      <div id="testRescueBox" class="hidden p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs space-y-2">
        <h5 class="font-black text-amber-950 flex items-center gap-1.5 text-sm">
          <span>💡</span> <span>${i18n.t('rescueTitle')}</span>
        </h5>
        <p class="text-amber-900 font-medium">${i18n.t('tryAgainGuidance')}</p>
        <p class="font-mono bg-white p-2 rounded-lg border border-amber-200">
          ${i18n.toDigits(a)} + ${i18n.toDigits(b)} = ${i18n.toDigits(a)} + (${i18n.toDigits(1)} + ${i18n.toDigits(b - 1)})
        </p>
      </div>
    </div>
  `;

  const btn = container.querySelector('#testSubmitBtn');
  const input = container.querySelector('#testAnsInput');
  const rescue = container.querySelector('#testRescueBox');

  btn.onclick = () => {
    const val = parseInt(input.value.trim(), 10);
    if (val === correctAnswer) {
      rescue.classList.remove('hidden');
      rescue.className = "p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs space-y-1 text-emerald-900 font-bold";
      rescue.innerHTML = `<span>🌟 ${isAs ? 'শুদ্ধ সমাধান! আপুনি ধাৰণাটো আয়ত্ত কৰিলে।' : 'Correct! Concept fully mastered.'}</span>`;
