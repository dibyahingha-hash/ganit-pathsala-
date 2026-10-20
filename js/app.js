// js/app.js
import { i18n } from './i18n.js';
import { stages } from './curriculum.js';

let currentStageIndex = 0;
let apiKey = localStorage.getItem('omnimath_gemini_key') || '';

// Tactile Game State
let targetCount = 5;
let collectedCount = 0;

// Web Audio synthesizer for pops and chimes
let audioCtx = null;
function playSound(freq, duration = 0.08) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
  updateKeyStatusUi();
  renderStageTabs();
  renderActiveStage();

  // Language toggle
  document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    i18n.toggleLanguage();
    updateKeyStatusUi();
    renderStageTabs();
    renderActiveStage();
  });

  // Modal handlers
  document.getElementById('openKeyModalBtn')?.addEventListener('click', openKeyModal);
  document.getElementById('closeKeyModalBtn')?.addEventListener('click', closeKeyModal);
  document.getElementById('cancelKeyModalBtn')?.addEventListener('click', closeKeyModal);
  document.getElementById('saveKeyBtn')?.addEventListener('click', testAndSaveKey);
});

// Render the stage navigation pills
function renderStageTabs() {
  const container = document.getElementById('stageSelector');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach((stg, idx) => {
    const isAct = idx === currentStageIndex;
    const btn = document.createElement('button');
    btn.className = `px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
      isAct 
        ? 'bg-amber-600 text-white shadow-amber-300' 
        : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-amber-200/80'
    }`;
    btn.innerHTML = `<span>${stg.icon}</span> <span>${stg.title[i18n.currentLang]}</span>`;
    btn.onclick = () => {
      currentStageIndex = idx;
      renderStageTabs();
      renderActiveStage();
    };
    container.appendChild(btn);
  });
}

// Render active stage content (Tactile toy or curriculum grid)
function renderActiveStage() {
  const stg = stages[currentStageIndex];
  const container = document.getElementById('stageContainer');
  if (!container) return;

  const isAs = i18n.currentLang === 'as';

  let html = '';

  // If Foundation / Class 1-2, inject the Tactile Sensory Play Area
  if (stg.isTactile) {
    targetCount = Math.floor(Math.random() * 4) + 3; // 3 to 6
    collectedCount = 0;

    html += `
      <div class="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-md">
        <div class="flex justify-between items-center pb-3 border-b border-amber-100">
          <div>
            <span class="bg-amber-100 text-amber-900 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full">
              ${isAs ? 'হস্তানુભৱ গণিত খেল' : 'Tactile Sensory Play'}
            </span>
            <h3 class="text-xl sm:text-2xl font-black text-amber-950 mt-1 font-kid">
              ${isAs ? 'আম গণনা খেল' : 'Touch & Count Mangoes'}
            </h3>
          </div>
          <button id="resetPlayBtn" class="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition">
            🔄 ${isAs ? 'নতুন খেল' : 'Restart'}
          </button>
        </div>

        <p class="text-base sm:text-lg font-bold text-slate-800 mt-4 font-kid">
          ${isAs 
            ? `তলৰ আমবোৰ চুই চুই খৰাহীত থোৱা: <span class="text-amber-600 text-2xl font-black">${i18n.toAssameseDigits(targetCount)} টা</span>` 
            : `Tap mangoes to put them in the basket: <span class="text-amber-600 text-2xl font-black">${targetCount}</span>`}
        </p>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <!-- Mango Tree / Yard -->
          <div id="mangoYard" class="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-4 min-h-[180px] flex flex-wrap gap-4 items-center justify-center">
            ${Array.from({length: 8}).map((_, i) => `
              <button class="mango-btn text-4xl sm:text-5xl hover:scale-125 active:scale-150 transition transform cursor-pointer p-2 select-none" data-id="${i}">
                🥭
              </button>
            `).join('')}
          </div>

          <!-- Basket / Khorahi -->
          <div id="basketZone" class="bg-orange-50 border-4 border-dashed border-amber-400 rounded-2xl p-4 min-h-[180px] flex flex-col items-center justify-between relative transition duration-300">
            <div class="w-full flex justify-between items-center text-xs font-bold text-amber-900 px-2">
              <span>🧺 ${isAs ? 'খৰাহী (দলঙা)' : 'Bamboo Basket'}</span>
              <span id="basketCountTxt" class="text-base font-black text-amber-700 font-kid">
                ${isAs ? i18n.toAssameseDigits(0) + ' / ' + i18n.toAssameseDigits(targetCount) : `0 / ${targetCount}`}
              </span>
            </div>
            
            <div id="collectedMangoes" class="flex flex-wrap gap-2 items-center justify-center p-3 flex-1"></div>

            <div id="winBanner" class="hidden absolute inset-0 bg-emerald-600/95 text-white rounded-xl flex flex-col items-center justify-center gap-1 p-3 text-center z-10">
              <span class="text-3xl">🎉 🌟</span>
              <h4 class="text-lg font-black">${isAs ? 'বৰ ধুনীয়া! গণনা সম্পূৰ্ণ হ’ল!' : 'Splendid! Counting Complete!'}</h4>
              <button id="nextLevelBtn" class="mt-2 px-4 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-full shadow hover:bg-emerald-50 transition">
                ${isAs ? 'পৰৱৰ্তী খেল খেলক →' : 'Next Challenge →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Curriculum Chapters Grid
  html += `
    <div>
      <h3 class="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
        <span>📖 ${isAs ? 'পাঠ্যক্ৰমৰ অধ্যায়সমূহ' : 'Curriculum Modules'}</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${stg.chapters.map(ch => `
          <div class="bg-white border border-amber-200/90 rounded-2xl p-4 hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <h4 class="font-bold text-slate-900 text-base">${ch.title[i18n.currentLang]}</h4>
              <p class="text-xs text-slate-600 my-1 leading-relaxed">${ch.desc[i18n.currentLang]}</p> <div class="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-center my-2 text-amber-950 font-mono text-sm overflow-x-auto"> $$${ch.formula}$$
              </div>
            </div>
            <button class="mt-3 text-xs font-bold text-amber-700 hover:text-amber-900 text-left flex items-center gap-1">
              <span>${isAs ? 'অধ্যায় পঢ়ক আৰু শিকক' : 'Explore Lesson'}</span> &rarr;
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind tactile game events if active
  if (stg.isTactile) {
    bindTactileGame();
  }

  // Render KaTeX formulas
  if (window.renderMathInElement) {
    renderMathInElement(container, {
      delimiters: [{ left: '$$', right: '$$', display: true }]
    });
  }
}

// Bind sensory game touch events
function bindTactileGame() {
  const isAs = i18n.currentLang === 'as';
  const yard = document.getElementById('mangoYard');
  const collectedBox = document.getElementById('collectedMangoes');
  const countTxt = document.getElementById('basketCountTxt');
  const winBanner = document.getElementById('winBanner');

  document.querySelectorAll('.mango-btn').forEach(btn => {
    btn.onclick = () => {
      if (collectedCount >= targetCount) return;

      playSound(420 + collectedCount * 60);
      if (navigator.vibrate) navigator.vibrate(40);

      btn.classList.add('scale-0');
      setTimeout(() => {
        btn.remove();
        collectedCount++;

        const mango = document.createElement('span');
        mango.className = 'text-3xl animate-bounce';
        mango.innerText = '🥭';
        collectedBox.appendChild(mango);

        countTxt.innerText = isAs 
          ? `${i18n.toAssameseDigits(collectedCount)} / ${i18n.toAssameseDigits(targetCount)}`
          : `${collectedCount} / ${targetCount}`;

        if (collectedCount === targetCount) {
          playSound(880, 0.3);
          winBanner.classList.remove('hidden');
        }
      }, 100);
    };
  });

  document.getElementById('resetPlayBtn')?.addEventListener('click', renderActiveStage);
  document.getElementById('nextLevelBtn')?.addEventListener('click', renderActiveStage);
}

// Modal & API Key Functions
function openKeyModal() {
  document.getElementById('keyModal')?.classList.remove('hidden');
  const input = document.getElementById('geminiKeyInput');
  if (input) input.value = apiKey;
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
