// ai-engine.js - Gemini Dynamic Intelligence Engine & Practice Arena

// ----------------------------------------------------
// 0. OFFLINE / PRELOADED LESSON STORE & STATE
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

// Fetch pre-compiled lessons on application start
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
    'gemini-2.5-flash',
    'gemini-2.0-flash'
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
// 5. GRADE- & TOPIC-AWARE PRACTICE ENGINE
// ----------------------------------------------------
function generateArithmeticProblem(topicTitle, standard) {
  const t = (topicTitle || '').toLowerCase();
  const rawStd = (standard || '').toLowerCase().trim();

  // Robust Roman Numeral and Standard Classifier
  const isUndergrad = rawStd.includes('undergraduate') || rawStd.includes('b.sc') || rawStd.includes('b.tech') || rawStd.includes('degree');
  const isClass11or12 = rawStd.includes('class xi') || rawStd.includes('class xii') || rawStd.includes('11') || rawStd.includes('12');
  const isClass9or10 = rawStd.includes('class ix') || rawStd.includes('class x') || rawStd.includes('9') || rawStd.includes('10');
  const isMiddleSchool = rawStd.includes('class vi') || rawStd.includes('class vii') || rawStd.includes('class viii') ||
                         rawStd.includes('class 6') || rawStd.includes('class 7') || rawStd.includes('class 8');
  const isUpperPrimary = rawStd.includes('class iii') || rawStd.includes('class iv') || rawStd.includes('class v') ||
                         rawStd.includes('class 3') || rawStd.includes('class 4') || rawStd.includes('class 5');
  const isClass1 = rawStd === 'class i' || rawStd.includes('class 1') || rawStd === '1';
  const isClass2 = rawStd === 'class ii' || rawStd.includes('class 2') || rawStd === '2';

  // CATEGORY A: UNDERGRADUATE & ADVANCED (Real Analysis, Calculus, Linear Algebra, Diff Eq)
  if (isUndergrad) {
    if (t.includes('real analysis') || t.includes('sequence') || t.includes('series') || t.includes('riemann')) {
      const n = Math.floor(Math.random() * 4) + 2;
      const ans = (n * n) + 1;
      return {
        questionText: `For sequence aₙ = n² + 1, find term a₍${n}₎:`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: ans,
        hint: `Calculate (${n} × ${n}) + 1.`
      };
    }
    const c = Math.floor(Math.random() * 5) + 2;
    return {
      questionText: `Evaluate ∫₀² (${c}x) dx:`,
      operandA: null, operandB: null, showTokens: false,
      correctAnswer: c * 2,
      hint: `Antiderivative is (${c}/2)x². Substitute x=2: (${c}/2) × 4 = ${c * 2}.`
    };
  }

  // CATEGORY B: HIGH SCHOOL & HIGHER SECONDARY (Class 9, 10, 11, 12)
  if (isClass9or10 || isClass11or12) {
    if (t.includes('coordinate') || t.includes('line') || t.includes('geometry') || t.includes('জ্যামিতি')) {
      const m = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 6) + 1;
      const x = Math.floor(Math.random() * 4) + 1;
      return {
        questionText: `For line y = ${m}x + ${c}, find y when x = ${x}:`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: (m * x) + c,
        hint: `Multiply ${m} × ${x}, then add ${c}.`
      };
    }
    if (t.includes('trig') || t.includes('ত্রিকোণমিতি')) {
      return {
        questionText: `Evaluate: sin²(30°) + cos²(30°) = ?`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: 1,
        hint: `Recall Pythagorean Identity: sin²θ + cos²θ = 1.`
      };
    }
    if (t.includes('calculus') || t.includes('deriv') || t.includes('differentiat')) {
      const p = Math.floor(Math.random() * 3) + 2;
      const xVal = 2;
      return {
        questionText: `If f(x) = x^${p}, find f'(${xVal}):`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: p * Math.pow(xVal, p - 1),
        hint: `f'(x) = ${p}x^${p - 1}. Evaluate at x = ${xVal}.`
      };
    }
    // High-school quadratic mental math
    const root = Math.floor(Math.random() * 5) + 2;
    return {
      questionText: `If x² = ${root * root}, find the positive value of x:`,
      operandA: null, operandB: null, showTokens: false,
      correctAnswer: root,
      hint: `Take the positive square root of ${root * root}.`
    };
  }

  // CATEGORY C: MIDDLE SCHOOL (Class 6 - 8)
  if (isMiddleSchool) {
    if (t.includes('ratio') || t.includes('proportion')) {
      const mult = Math.floor(Math.random() * 4) + 2;
      return {
        questionText: `If 2 : 5 = 6 : x, find x:`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: 5 * 3,
        hint: `Cross multiply: 2x = 30 -> x = 15.`
      };
    }
    if (t.includes('fraction') || t.includes('ভাগ') || t.includes('divis')) {
      const div = Math.floor(Math.random() * 7) + 3;
      const q = Math.floor(Math.random() * 8) + 2;
      return {
        questionText: `Evaluate: ${div * q} ÷ ${div} = ?`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: q,
        hint: `How many groups of ${div} fit inside ${div * q}?`
      };
    }
    const a = Math.floor(Math.random() * 9) + 4;
    const b = Math.floor(Math.random() * 8) + 3;
    return {
      questionText: `Solve: ${a} × ${b} = ?`,
      operandA: null, operandB: null, showTokens: false,
      correctAnswer: a * b,
      hint: `Multiply ${a} by ${b}.`
    };
  }

  // CATEGORY D: UPPER PRIMARY (Class 3 - 5)
  if (isUpperPrimary) {
    if (t.includes('subtract') || t.includes('বিয়োগ')) {
      const a = Math.floor(Math.random() * 40) + 20;
      const b = Math.floor(Math.random() * 15) + 5;
      return {
        questionText: `${a} - ${b} = ?`,
        operandA: null, operandB: null, showTokens: false,
        correctAnswer: a - b,
        hint: `Subtract tens first, then units.`
      };
    }
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;
    return {
      questionText: `${a} × ${b} = ?`,
      operandA: null, operandB: null, showTokens: false,
      correctAnswer: a * b,
      hint: `Recall your ${a} times table.`
    };
  }

  // CATEGORY E: CLASS 1 & 2 (Foundational Primary with Visual Apples)
  const isSubtractTopic = t.includes('sub') || t.includes('বিয়োগ') || t.includes('minus');
  if (isClass1) {
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 4) + 1;
    if (isSubtractTopic) {
      const bigger = Math.max(a, b);
      const smaller = Math.min(a, b);
      return {
        questionText: `${bigger} - ${smaller} = ?`,
        operandA: bigger, operandB: smaller, operator: '-', showTokens: true,
        correctAnswer: bigger - smaller,
        hint: `Start with ${bigger} apples, cross out ${smaller}.`
      };
    }
    return {
      questionText: `${a} + ${b} = ?`,
      operandA: a, operandB: b, operator: '+', showTokens: true,
      correctAnswer: a + b,
      hint: `Count ${a} red apples, then count ${b} green apples!`
    };
  }

  // Class 2 defaults
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return {
    questionText: `${a} + ${b} = ?`,
    operandA: a, operandB: b, operator: '+', showTokens: true,
    correctAnswer: a + b,
    hint: `Add ${a} and ${b}.`
  };
}

// ----------------------------------------------------
// 6. PRACTICE ARENA UI RENDERING
// ----------------------------------------------------
function renderKeypadButtons() {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  let html = '';
  for (let i = 0; i < digits.length; i++) {
    const d = digits[i];
    const display = (window.toDigits ? window.toDigits(d) : d);
    html += '<button onclick="pressPracticeNum(' + d + ')" class="py-2.5 bg-slate-100 hover:bg-amber-100 font-black text-sm text-slate-800 rounded-xl transition shadow-xs active:scale-95">' + display + '</button>';
  }
  return html;
}

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

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
        <span class="text-xs font-black text-amber-900 uppercase">🎯 ${isAs ? 'অনুশীলন মঞ্চ' : 'Practice Arena'}</span>
        <span class="text-xs font-bold text-amber-800">🔥 ${isAs ? 'ধাৰাবাহিক স্কোৰ' : 'Streak'}: <strong id="streakCount" class="text-sm font-black text-amber-600">${practiceStreak}</strong></span>
      </div>

      <div class="p-6 bg-white border-2 border-amber-300 rounded-3xl shadow-sm text-center">
        <div class="text-2xl sm:text-3xl font-black text-slate-800 tracking-wider mb-4" id="practiceQuestionDisplay">
          ${displayQuestion}
        </div>

        <div id="visualCounters" class="flex flex-wrap justify-center items-center gap-2 mb-6 min-h-[30px]">
          ${renderVisualTokens(currentPracticeProblem)}
        </div>

        <div class="max-w-[240px] mx-auto space-y-3">
          <input type="number" id="practiceInput" placeholder="?" readonly class="w-full text-center text-3xl font-black py-2 border-2 border-amber-400 rounded-2xl bg-amber-50/30 text-amber-950 focus:outline-none">
          
          <div class="grid grid-cols-5 gap-1.5">
            ${renderKeypadButtons()}
          </div>
          <div class="flex gap-2">
            <button onclick="clearPracticeInput()" class="flex-1 py-1.5 bg-rose-100 text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-200">⌫ Clear</button>
          </div>
        </div>
      </div>

      <div id="practiceFeedback" class="text-center font-bold text-sm min-h-[24px]"></div>

      <div class="flex gap-2 pt-2">
        <button onclick="askPracticeHint()" class="flex-1 py-2.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl text-xs transition">
          💡 ${isAs ? 'ইংগিত দিয়ক' : 'Need a Hint?'}
        </button>
        <button onclick="checkPracticeAnswer()" id="checkAnswerBtn" class="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm">
          ✓ ${isAs ? 'উত্তৰ পৰীক্ষা কৰক' : 'Check Answer'}
        </button>
      </div>

      <div id="practiceHintBox" class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 hidden"></div>
    </div>
  `;
}

// ----------------------------------------------------
// 7. INPUT & ACTION HANDLERS
// ----------------------------------------------------
window.pressPracticeNum = function(num) {
  const input = document.getElementById('practiceInput');
  if (input && input.value.length < 5) {
    input.value += num;
  }
};

window.clearPracticeInput = function() {
  const input = document.getElementById('practiceInput');
  if (input) input.value = '';
};

window.checkPracticeAnswer = function() {
  const input = document.getElementById('practiceInput');
  const fb = document.getElementById('practiceFeedback');
  const checkBtn = document.getElementById('checkAnswerBtn');
  if (!input || !fb || !currentPracticeProblem) return;

  const userVal = parseInt(input.value, 10);
  const isAs = window.currentLang === 'as';

  if (isNaN(userVal)) {
    fb.innerHTML = `<span class="text-rose-600">${isAs ? 'অনুগ্ৰহ কৰি উত্তৰ লিখক।' : 'Please enter an answer first.'}</span>`;
    return;
  }

  if (userVal === currentPracticeProblem.correctAnswer) {
    practiceStreak++;
    fb.innerHTML = `<span class="text-emerald-600 animate-bounce">🎉 ${isAs ? 'শুদ্ধ হৈছে! বহুত ভাল!' : 'Correct! Awesome job!'}</span>`;
    checkBtn.textContent = isAs ? 'পৰৱৰ্তী প্ৰশ্ন ➔' : 'Next Problem ➔';
    checkBtn.className = 'flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm';
    checkBtn.onclick = function() {
      const arena = document.getElementById('arenaBody');
      if (arena) renderPracticeArena(arena);
    };
  } else {
    practiceStreak = 0;
    fb.innerHTML = `<span class="text-rose-600">${isAs ? 'ভুল হৈছে, পুনৰ চেষ্টা কৰক বা ইংগিত লওক।' : 'Not quite right. Try again or check the hint!'}</span>`;
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;
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
