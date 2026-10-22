// ai-engine.js - Gemini Dynamic Intelligence Engine & Gamified Tap-to-Play Arena

// ----------------------------------------------------
// 0. STATE MANAGEMENT & OFFLINE PRELOAD
// ----------------------------------------------------
let preloadedLessons = {};
let activeTopicContext = {
  title: '',
  standard: '',
  topicId: '',
  activeTab: 'practice'
};

let currentPracticeProblem = null;
let practiceStreak = 0;

fetch('./data/lessons.json')
  .then(res => res.json())
  .then(data => {
    preloadedLessons = data;
    console.log("✓ Preloaded lessons loaded:", Object.keys(data));
  })
  .catch(err => {
    console.warn("Static lessons.json not found, dynamic fallback active.", err);
  });

// ----------------------------------------------------
// 1. GEMINI API CALLER
// ----------------------------------------------------
async function callGeminiDynamic(promptText, isJson = false) {
  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite'
  ];

  const apiKey = window.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not configured.");
    return null;
  }

  for (const m of models) {
    try {
      const payload = {
        contents: [{ parts: [{ text: promptText }] }]
      };
      if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) continue;
      const data = await res.json();
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) return txt;
    } catch (e) {
      console.warn(`Model ${m} failed, trying next...`, e);
    }
  }
  return null;
}

// ----------------------------------------------------
// 2. UNIVERSAL SEARCH HANDLER
// ----------------------------------------------------
window.handleUniversalSearchQuery = async function(query) {
  const resultsContainer = document.getElementById('searchResultsDropdown');
  if (!resultsContainer) return;
  if (!query || query.trim().length < 2) {
    resultsContainer.classList.add('hidden');
    return;
  }

  resultsContainer.classList.remove('hidden');
  resultsContainer.innerHTML = '<div class="p-4 text-xs font-bold text-amber-800 animate-pulse">🔍 Searching standard index and database...</div>';

  let matches = [];
  const qLower = query.toLowerCase();

  if (window.MATH_CURRICULUM) {
    window.MATH_CURRICULUM.forEach(cls => {
      const checkTopic = (t, streamName) => {
        const titleEn = (t.title?.en || t.title || '').toLowerCase();
        const titleAs = (t.title?.as || '').toLowerCase();
        if (titleEn.includes(qLower) || titleAs.includes(qLower)) {
          matches.push({ classLabel: cls.label, topic: t, streamName: streamName });
        }
      };
      if (cls.topics) cls.topics.forEach(t => checkTopic(t, null));
      if (cls.streams) {
        cls.streams.forEach(s => s.topics.forEach(t => checkTopic(t, s.streamName)));
      }
    });
  }

  if (matches.length > 0) {
    let listHtml = '';
    matches.slice(0, 8).forEach(m => {
      const lang = window.currentLang || 'en';
      const label = (m.classLabel && m.classLabel[lang]) || m.classLabel?.en || m.classLabel || '';
      const stream = m.streamName ? ' • ' + ((m.streamName && m.streamName[lang]) || m.streamName.en || '') : '';
      const tTitle = (m.topic.title && m.topic.title[lang]) || m.topic.title?.en || m.topic.title || '';
      const tId = m.topic.id || '';
      
      listHtml += '<div onclick="window.openWorkspaceDirect(\'' + tTitle.replace(/'/g, "\\'") + '\', \'' + label.replace(/'/g, "\\'") + '\', \'' + tId + '\')" class="p-3 border-b border-amber-100 hover:bg-amber-50 cursor-pointer text-left">' +
        '<div class="text-[10px] uppercase font-bold text-amber-700">' + label + stream + '</div>' +
        '<div class="text-sm font-bold text-slate-800">' + tTitle + '</div>' +
      '</div>';
    });
    resultsContainer.innerHTML = listHtml;
  } else {
    resultsContainer.innerHTML = '<div class="p-4 hover:bg-amber-50 cursor-pointer text-left" onclick="window.openWorkspaceDirect(\'' + query.replace(/'/g, "\\'") + '\', \'Universal Query\', \'\')">' +
      '<div class="text-xs text-amber-800 font-semibold">No direct chapter match in index.</div>' +
      '<div class="text-sm font-bold text-amber-950 mt-1">✨ Open Practice Arena for: "' + query + '"</div>' +
    '</div>';
  }
};

window.openWorkspaceDirect = function(title, standard, topicId = '') {
  const dropdown = document.getElementById('searchResultsDropdown');
  if (dropdown) dropdown.classList.add('hidden');
  window.openWorkspaceForTopic(title, standard, 'learn', topicId);
};

// ----------------------------------------------------
// 3. WORKSPACE MODAL & 4-TAB ROUTER
// ----------------------------------------------------
window.openWorkspaceForTopic = function(topicTitle, standardLevel, mode = 'practice', topicId = '') {
  const modal = document.getElementById('workspaceModal');
  const body = document.getElementById('wsBody');
  const title = document.getElementById('wsChapterTitle');
  const badge = document.getElementById('wsModeBadge');

  if (!modal || !body) return;

  activeTopicContext = {
    title: topicTitle,
    standard: standardLevel,
    topicId: topicId,
    activeTab: mode === 'learn' ? 'concept' : (mode === 'play' ? 'practice' : mode)
  };

  modal.classList.remove('hidden');
  if (title) title.textContent = topicTitle;
  if (badge) badge.textContent = standardLevel;

  body.innerHTML = `
    <div class="flex border-b border-amber-200 bg-amber-50/70 p-1.5 rounded-2xl gap-1 mb-4 text-xs font-bold">
      <button onclick="window.switchWorkspaceTab('concept')" id="tab-btn-concept" class="flex-1 py-2 rounded-xl text-slate-600 hover:text-amber-900 transition">📖 Concept</button>
      <button onclick="window.switchWorkspaceTab('solved')" id="tab-btn-solved" class="flex-1 py-2 rounded-xl text-slate-600 hover:text-amber-900 transition">💡 Solved</button>
      <button onclick="window.switchWorkspaceTab('practice')" id="tab-btn-practice" class="flex-1 py-2 rounded-xl bg-amber-600 text-white shadow-sm transition">🎯 Practice</button>
      <button onclick="window.switchWorkspaceTab('test')" id="tab-btn-test" class="flex-1 py-2 rounded-xl text-slate-600 hover:text-amber-900 transition">⏱️ Test</button>
    </div>
    <div id="arenaBody" class="min-h-[340px] flex flex-col justify-between"></div>
  `;

  window.switchWorkspaceTab(activeTopicContext.activeTab);
};

window.switchWorkspaceTab = function(tabName) {
  activeTopicContext.activeTab = tabName;
  ['concept', 'solved', 'practice', 'test'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = 'flex-1 py-2 rounded-xl bg-amber-600 text-white shadow-sm font-bold transition';
      } else {
        btn.className = 'flex-1 py-2 rounded-xl text-slate-600 hover:text-amber-900 font-bold transition';
      }
    }
  });

  const arena = document.getElementById('arenaBody');
  if (!arena) return;

  if (tabName === 'concept') renderConceptTab(arena);
  else if (tabName === 'solved') renderSolvedTab(arena);
  else if (tabName === 'practice') renderPracticeArena(arena);
  else if (tabName === 'test') renderTestSetup(arena);
};

// ----------------------------------------------------
// 4. TAB CONTENTS (CONCEPT, SOLVED, TEST)
// ----------------------------------------------------
function renderConceptTab(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
        <h4 class="text-xs font-black uppercase text-amber-700 tracking-wider mb-1">${isAs ? 'মূল ধাৰণা' : 'Core Concept'}</h4>
        <p class="text-sm font-medium text-slate-700 leading-relaxed">
          ${isAs ? 'বিষয়টোৰ মূল নিয়ম, সূত্ৰ আৰু ব্যাখ্যা ইয়াত উপলব্ধ কৰা হৈছে।' : 'Explore key fundamentals, rules, and formulas for this chapter.'}
        </p>
      </div>

      <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <label class="block text-xs font-bold text-slate-700 mb-2">
          ${isAs ? '❓ কোনো সন্দেহ আছে? গুৰুক প্ৰশ্ন সোধক:' : '❓ Have doubts? Ask Guru:'}
        </label>
        <div class="flex gap-2">
          <input type="text" id="guruConceptInput" placeholder="${isAs ? 'প্ৰশ্ন লিখক...' : 'Type your question here...'}" class="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600">
          <button onclick="handleGuruQuestion()" class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs">Ask</button>
        </div>
        <div id="guruResponseArea" class="mt-3 text-xs text-slate-700 hidden"></div>
      </div>
    </div>
  `;
}

function renderSolvedTab(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="space-y-3">
      <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <span class="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">${isAs ? 'উদাহৰণ ১' : 'Example 1'}</span>
        <h4 class="font-bold text-slate-800 text-sm mt-2">${activeTopicContext.title} - Sample Problem</h4>
        <div class="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-2 text-slate-700">
          <p><strong>Step 1:</strong> Identify given inputs and definitions.</p>
          <p><strong>Step 2:</strong> Apply the governing mathematical relation step-by-step.</p>
          <p class="font-bold text-emerald-700">Result: Evaluated and verified.</p>
        </div>
      </div>
    </div>
  `;
}

function renderTestSetup(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="p-5 text-center space-y-4">
      <h3 class="text-base font-bold text-slate-800">${isAs ? 'পৰীক্ষাৰ প্ৰশ্ন সংখ্যা বাছক' : 'Select Question Count'}</h3>
      <p class="text-xs text-slate-500">${isAs ? 'কোনো ইংগিত পোৱা নাযাব। সময় নিৰ্ধাৰিত থাকিব।' : 'Strict timed test. No hints allowed.'}</p>
      
      <div class="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        <button class="p-3 border-2 border-amber-600 text-amber-900 rounded-2xl font-black text-sm hover:bg-amber-50">10 Qs</button>
        <button class="p-3 border-2 border-amber-600 text-amber-900 rounded-2xl font-black text-sm hover:bg-amber-50">15 Qs</button>
        <button class="p-3 border-2 border-amber-600 text-amber-900 rounded-2xl font-black text-sm hover:bg-amber-50">20 Qs</button>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// 5. GRADE- & TOPIC-AWARE TAP PROBLEM ENGINE
// ----------------------------------------------------
function generateArithmeticProblem(topicTitle, standard) {
  const t = (topicTitle || '').toLowerCase();
  const rawStd = (standard || '').toLowerCase().trim();

  const isUndergrad = rawStd.includes('undergraduate') || rawStd.includes('b.sc') || rawStd.includes('b.tech') || rawStd.includes('degree');
  const isHighSchool = rawStd.includes('class ix') || rawStd.includes('class x') || rawStd.includes('class xi') || rawStd.includes('class xii') || rawStd.includes('9') || rawStd.includes('10');
  const isMiddleSchool = rawStd.includes('class vi') || rawStd.includes('class vii') || rawStd.includes('class viii') || rawStd.includes('class 6') || rawStd.includes('class 7') || rawStd.includes('class 8');
  const isUpperPrimary = rawStd.includes('class iii') || rawStd.includes('class iv') || rawStd.includes('class v') || rawStd.includes('class 3') || rawStd.includes('class 4') || rawStd.includes('class 5');
  const isClass1 = rawStd === 'class i' || rawStd.includes('class 1') || rawStd === '1';
  const isClass2 = rawStd === 'class ii' || rawStd.includes('class 2') || rawStd === '2';

  let qText = '';
  let correct = 0;
  let hint = '';
  let showTokens = false;
  let opA = null;
  let opB = null;
  let op = '';

  // 1. UNDERGRADUATE (Real Analysis, Calculus, Differential Equations)
  if (isUndergrad) {
    if (t.includes('real analysis') || t.includes('sequence') || t.includes('series') || t.includes('riemann')) {
      const n = Math.floor(Math.random() * 4) + 2;
      correct = (n * n) + 1;
      qText = `For sequence aₙ = n² + 1, find term a₍${n}₎:`;
      hint = `Substitute n = ${n}: (${n} × ${n}) + 1 = ${correct}.`;
    } else {
      const c = Math.floor(Math.random() * 4) + 2;
      correct = c * 2;
      qText = `Evaluate ∫₀² (${c}x) dx:`;
      hint = `Antiderivative is (${c}/2)x². Evaluated at 2: (${c}/2) × 4 = ${correct}.`;
    }
  }
  // 2. HIGH SCHOOL (Class 9 - 10: Euclid, Geometry, Quadratics, Trig)
  else if (isHighSchool) {
    if (t.includes('euclid') || t.includes('real number')) {
      const base = Math.floor(Math.random() * 4) + 2;
      const num1 = base * 3;
      const num2 = base * 4;
      correct = base;
      qText = `Find HCF of ${num1} and ${num2}:`;
      hint = `Find the highest common factor dividing both ${num1} and ${num2}.`;
    } else if (t.includes('line') || t.includes('coordinate') || t.includes('geometry') || t.includes('জ্যামিতি')) {
      const m = Math.floor(Math.random() * 3) + 2;
      const c = Math.floor(Math.random() * 5) + 1;
      const x = Math.floor(Math.random() * 4) + 1;
      correct = (m * x) + c;
      qText = `For line y = ${m}x + ${c}, find y when x = ${x}:`;
      hint = `Compute (${m} × ${x}) + ${c} = ${correct}.`;
    } else if (t.includes('trig') || t.includes('ত্রিকোণমিতি')) {
      correct = 1;
      qText = `Evaluate: sin²(45°) + cos²(45°) = ?`;
      hint = `Pythagorean Identity states sin²θ + cos²θ is always 1.`;
    } else {
      const root = Math.floor(Math.random() * 5) + 2;
      correct = root;
      qText = `If x² = ${root * root}, find positive x:`;
      hint = `Take positive square root: √${root * root} = ${root}.`;
    }
  }
  // 3. MIDDLE SCHOOL (Class 6 - 8: Ratios, Integers, Pre-Algebra)
  else if (isMiddleSchool) {
    if (t.includes('ratio') || t.includes('proportion')) {
      const mult = Math.floor(Math.random() * 3) + 2;
      correct = 4 * mult;
      qText = `If 3 : 4 = ${3 * mult} : x, find x:`;
      hint = `Multiply 4 by ${mult} = ${correct}.`;
    } else if (t.includes('divis') || t.includes('ভাগ')) {
      const div = Math.floor(Math.random() * 6) + 3;
      correct = Math.floor(Math.random() * 7) + 2;
      qText = `Evaluate: ${div * correct} ÷ ${div} = ?`;
      hint = `Divide ${div * correct} by ${div}.`;
    } else {
      const a = Math.floor(Math.random() * 8) + 3;
      const b = Math.floor(Math.random() * 7) + 3;
      correct = a * b;
      qText = `${a} × ${b} = ?`;
      hint = `Multiply ${a} by ${b}.`;
    }
  }
  // 4. UPPER PRIMARY (Class 3 - 5)
  else if (isUpperPrimary) {
    if (t.includes('subtract') || t.includes('বিয়োগ')) {
      const a = Math.floor(Math.random() * 40) + 20;
      const b = Math.floor(Math.random() * 15) + 4;
      correct = a - b;
      qText = `${a} - ${b} = ?`;
      hint = `Take away ${b} from ${a}.`;
    } else {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      correct = a * b;
      qText = `${a} × ${b} = ?`;
      hint = `Recall the multiplication table for ${a}.`;
    }
  }
  // 5. FOUNDATIONAL PRIMARY (Class 1 & 2)
  else {
    const isSub = t.includes('sub') || t.includes('বিয়োগ') || t.includes('minus');
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 4) + 1;
    showTokens = true;

    if (isSub) {
      const bigger = Math.max(a, b);
      const smaller = Math.min(a, b);
      correct = bigger - smaller;
      qText = `${bigger} - ${smaller} = ?`;
      opA = bigger;
      opB = smaller;
      op = '-';
      hint = `Start with ${bigger} apples, remove ${smaller}.`;
    } else {
      correct = a + b;
      qText = `${a} + ${b} = ?`;
      opA = a;
      opB = b;
      op = '+';
      hint = `Count ${a} red apples, then add ${b} green apples!`;
    }
  }

  // Generate 4 distinct options (1 correct + 3 smart distractors)
  const options = new Set([correct]);
  while (options.size < 4) {
    const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + 1);
    const candidate = correct + delta;
    if (candidate >= 0) options.add(candidate);
  }
  const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

  return {
    questionText: qText,
    correctAnswer: correct,
    options: shuffledOptions,
    operandA: opA,
    operandB: opB,
    operator: op,
    showTokens: showTokens,
    hint: hint
  };
}

// ----------------------------------------------------
// 6. PRACTICE ARENA UI & TAP HANDLERS
// ----------------------------------------------------
function renderVisualTokens(problem) {
  if (!problem.showTokens || !problem.operandA || !problem.operandB) return '';
  let tokens = '';
  for (let i = 0; i < problem.operandA; i++) {
    tokens += '<span class="inline-block w-6 h-6 bg-amber-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍎</span>';
  }
  tokens += '<span class="font-black text-amber-800 mx-2 text-sm">' + problem.operator + '</span>';
  for (let j = 0; j < problem.operandB; j++) {
    tokens += '<span class="inline-block w-6 h-6 bg-emerald-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍏</span>';
  }
  return tokens;
}

function renderPracticeArena(container) {
  const isAs = window.currentLang === 'as';
  currentPracticeProblem = generateArithmeticProblem(activeTopicContext.title, activeTopicContext.standard);

  const displayQuestion = window.toDigits ? window.toDigits(currentPracticeProblem.questionText) : currentPracticeProblem.questionText;

  // Build 4 large tactile choice buttons
  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-5">';
  currentPracticeProblem.options.forEach(opt => {
    const displayOpt = window.toDigits ? window.toDigits(opt) : opt;
    optionsHtml += `
      <button onclick="handleOptionSelect(${opt}, this)" class="option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-xl font-black text-slate-800 shadow-sm active:scale-95 transition">
        ${displayOpt}
      </button>
    `;
  });
  optionsHtml += '</div>';

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
        <span class="text-xs font-black text-amber-900 uppercase">🎯 ${isAs ? 'অনুশীলন মঞ্চ' : 'Practice Arena'}</span>
        <span class="text-xs font-bold text-amber-800">🔥 ${isAs ? 'ধাৰাবাহিক স্কোৰ' : 'Streak'}: <strong id="streakCount" class="text-sm font-black text-amber-600">${practiceStreak}</strong></span>
      </div>

      <div class="p-6 bg-white border-2 border-amber-300 rounded-3xl shadow-sm text-center">
        <div class="text-2xl font-black text-slate-800 tracking-wider mb-2">
          ${displayQuestion}
        </div>

        <div id="visualCounters" class="flex flex-wrap justify-center items-center gap-2 mb-2 min-h-[26px]">
          ${renderVisualTokens(currentPracticeProblem)}
        </div>

        <p class="text-xs text-slate-400 font-bold mb-2">${isAs ? 'শুদ্ধ উত্তৰত স্পৰ্শ কৰক:' : 'Tap the correct answer:'}</p>

        ${optionsHtml}
      </div>

      <div id="practiceFeedback" class="text-center font-bold text-sm min-h-[28px]"></div>

      <div class="flex gap-2 pt-2">
        <button onclick="askPracticeHint()" class="flex-1 py-2.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl text-xs transition">
          💡 ${isAs ? 'ইংগিত দিয়ক' : 'Need a Hint?'}
        </button>
      </div>

      <div id="practiceHintBox" class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 hidden"></div>
    </div>
  `;
}

window.handleOptionSelect = function(selectedVal, btnElement) {
  const fb = document.getElementById('practiceFeedback');
  const isAs = window.currentLang === 'as';

  // Disable buttons immediately
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

  if (selectedVal === currentPracticeProblem.correctAnswer) {
    practiceStreak++;
    btnElement.className = 'option-btn py-4 bg-emerald-500 border-2 border-emerald-600 rounded-2xl text-xl font-black text-white shadow-md scale-105 transition';
    if (fb) fb.innerHTML = `<span class="text-emerald-600 text-base animate-bounce">🎉 ${isAs ? 'শুদ্ধ হৈছে! বহুত ভাল!' : 'Correct! Awesome job!'}</span>`;

    setTimeout(() => {
      const arena = document.getElementById('arenaBody');
      if (arena) renderPracticeArena(arena);
    }, 1000);
  } else {
    practiceStreak = 0;
    btnElement.className = 'option-btn py-4 bg-rose-500 border-2 border-rose-600 rounded-2xl text-xl font-black text-white shadow-sm transition';
    if (fb) fb.innerHTML = `<span class="text-rose-600">${isAs ? 'ভুল হৈছে, পুনৰ চেষ্টা কৰক!' : 'Oops! Try again!'}</span>`;
    
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = false;
        b.className = 'option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-xl font-black text-slate-800 shadow-sm active:scale-95 transition';
      });
    }, 600);
  }
};

window.askPracticeHint = function() {
  const hintBox = document.getElementById('practiceHintBox');
  if (!hintBox || !currentPracticeProblem) return;
  hintBox.classList.remove('hidden');
  hintBox.innerHTML = `<div class="font-medium">${currentPracticeProblem.hint}</div>`;
};

window.handleGuruQuestion = async function() {
  const input = document.getElementById('guruConceptInput');
  const respArea = document.getElementById('guruResponseArea');
  if (!input || !respArea || !input.value.trim()) return;

  respArea.classList.remove('hidden');
  respArea.innerHTML = '<span class="animate-pulse text-amber-800 font-bold">Thinking...</span>';

  const q = input.value.trim();
  const prompt = `You are an encouraging math teacher. The student is learning "${activeTopicContext.title}" (${activeTopicContext.standard}).
Question: "${q}".
Explain the answer clearly and concisely in maximum 3 sentences. Answer in ${window.currentLang === 'as' ? 'Assamese' : 'English'}.`;

  const reply = await callGeminiDynamic(prompt, false);
  respArea.innerHTML = `<div class="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2 font-medium">${reply || 'Unable to fetch response. Please try again.'}</div>`;
};
