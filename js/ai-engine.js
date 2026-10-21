// ai-engine.js - Gemini Dynamic Intelligence Engine & 6-Stage Interactive Player

// ----------------------------------------------------
// 0. OFFLINE / PRELOADED LESSON STORE
// ----------------------------------------------------
let preloadedLessons = {};
let activeTopicContext = {
  title: '',
  standard: '',
  topicId: '',
  activeTab: 'practice'
};


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
// 1. GEMINI API CALLER (WITH RATE LIMIT & 2026 MODEL FALLBACKS)
// ----------------------------------------------------
async function callGeminiDynamic(promptText, isJson = false) {
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash'
  ];

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
  resultsContainer.innerHTML = `<div class="p-4 text-xs font-bold text-amber-800 animate-pulse">🔍 Searching standard index and database...</div>`;

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
    resultsContainer.innerHTML = matches.slice(0, 8).map(m => `
      <div onclick="openWorkspaceDirect('${m.topic.title?.en || m.topic.title}', '${m.classLabel?.en || m.classLabel}', '${m.topic.id || ''}')" class="p-3 border-b border-amber-100 hover:bg-amber-50 cursor-pointer text-left">
        <div class="text-[10px] uppercase font-bold text-amber-700">${m.classLabel[window.currentLang] || m.classLabel.en || m.classLabel} ${m.streamName ? '• ' + (m.streamName[window.currentLang] || m.streamName.en) : ''}</div>
        <div class="text-sm font-bold text-slate-800">${m.topic.title[window.currentLang] || m.topic.title.en || m.topic.title}</div>
      </div>
    `).join('');
  } else {
    resultsContainer.innerHTML = `
              <div class="text-sm font-bold text-amber-950 mt-1">✨ Open Practice Arena for: "${query}"</div>
              
    `;
  }
};


// ----------------------------------------------------
// 3. 4-TAB WORKSPACE ARENA ROUTER
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

  // Render the Tab Bar and Container Shell
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
// 4. TAB IMPLEMENTATIONS
// ----------------------------------------------------
function renderConceptTab(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
        <h4 class="text-xs font-black uppercase text-amber-700 tracking-wider mb-1">${isAs ? 'মূল ধাৰণা' : 'Core Concept'}</h4>
        <p class="text-sm font-medium text-slate-700 leading-relaxed">
          ${isAs ? 'বিষয়টোৰ মূল নিয়ম আৰু সংক্ষিপ্ত বুজাবুজি ইয়াত প্ৰদান কৰা হৈছে।' : 'Explore key fundamentals, rules, and formulas for this chapter.'}
        </p>
      </div>

      <!-- Socratic Q&A Box -->
      <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <label class="block text-xs font-bold text-slate-700 mb-2">
          ${isAs ? '❓ সন্দেহ আছে? প্ৰশ্ন সোধক (Assamese / English):' : '❓ Have doubts? Ask Guru:'}
        </label>
        <div class="flex gap-2">
          <input type="text" id="guruConceptInput" placeholder="${isAs ? 'যিকোনো প্ৰশ্ন লিখক...' : 'Type any question about this topic...'}" class="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600">
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
          <p><strong>Step 1:</strong> Identify the given values and applicable identity.</p>
          <p><strong>Step 2:</strong> Substitute and simplify each component step by step.</p>
          <p class="font-bold text-emerald-700">Result: Solved accurately.</p>
        </div>
      </div>
    </div>
  `;
}

// Practice State
let currentPracticeProblem = null;
let practiceStreak = 0;

function generateArithmeticProblem(topicTitle, standard) {
  const isClass1or2 = standard.includes('1') || standard.includes('2') || standard.toLowerCase().includes('primary');
  
  if (isClass1or2) {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    const isAdd = Math.random() > 0.3; // 70% addition, 30% subtraction
    
    if (isAdd) {
      return {
        questionText: `${a} + ${b} = ?`,
        operandA: a,
        operandB: b,
        operator: '+',
        correctAnswer: a + b,
        hint: `Start with ${a}, then count forward ${b} more steps!`
      };
    } else {
      const bigger = Math.max(a, b);
      const smaller = Math.min(a, b);
      return {
        questionText: `${bigger} - ${smaller} = ?`,
        operandA: bigger,
        operandB: smaller,
        operator: '-',
        correctAnswer: bigger - smaller,
        hint: `You have ${bigger} items. Remove ${smaller} of them. How many remain?`
      };
    }
  }

  // Higher classes generic generator
  const x = Math.floor(Math.random() * 12) + 2;
  const mult = Math.floor(Math.random() * 9) + 2;
  return {
    questionText: `Solve: ${x} × ${mult} = ?`,
    operandA: x,
    operandB: mult,
    operator: '×',
    correctAnswer: x * mult,
    hint: `Break it into parts: (${x} × 10) or add ${x} repeatedly.`
  };
}

function renderPracticeArena(container) {
  const isAs = window.currentLang === 'as';
  currentPracticeProblem = generateArithmeticProblem(activeTopicContext.title, activeTopicContext.standard);

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Streak Header -->
      <div class="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
        <span class="text-xs font-black text-amber-900 uppercase">🎯 ${isAs ? 'অনুশীলন মঞ্চ' : 'Practice Arena'}</span>
        <span class="text-xs font-bold text-amber-800">🔥 ${isAs ? 'ধাৰাবাহিক স্কোৰ' : 'Streak'}: <strong id="streakCount" class="text-sm font-black text-amber-600">${practiceStreak}</strong></span>
      </div>

      <!-- Problem Presentation Card -->
      <div class="p-6 bg-white border-2 border-amber-300 rounded-3xl shadow-sm text-center">
        <div class="text-3xl font-black text-slate-800 tracking-wider mb-4" id="practiceQuestionDisplay">
          ${window.toDigits ? window.toDigits(currentPracticeProblem.questionText) : currentPracticeProblem.questionText}
        </div>

        <!-- Visual Counter Manipulatives for Young Learners -->
        <div id="visualCounters" class="flex flex-wrap justify-center items-center gap-2 mb-6 min-h-[40px]">
          ${renderVisualTokens(currentPracticeProblem)}
        </div>

        <!-- Answer Input & Keypad -->
        <div class="max-w-[240px] mx-auto space-y-3">
          <input type="number" id="practiceInput" placeholder="?" readonly class="w-full text-center text-3xl font-black py-2 border-2 border-amber-400 rounded-2xl bg-amber-50/30 text-amber-950 focus:outline-none">
                    <!-- Tactile Number Keypad -->
          <div class="grid grid-cols-5 gap-1.5">
            ${renderKeypadButtons()}
          </div>

          
          <div class="flex gap-2">
            <button onclick="clearPracticeInput()" class="flex-1 py-1.5 bg-rose-100 text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-200">⌫ Clear</button>
          </div>
        </div>
      </div>

      <!-- Feedback & Action Buttons -->
      <div id="practiceFeedback" class="text-center font-bold text-sm min-h-[24px]"></div>

      <div class="flex gap-2 pt-2">
        <button onclick="askPracticeHint()" class="flex-1 py-2.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl text-xs transition">
          💡 ${isAs ? 'ইংগিত দিয়ক' : 'Need a Hint?'}
        </button>
        <button onclick="checkPracticeAnswer()" id="checkAnswerBtn" class="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm">
          ✓ ${isAs ? 'উত্তৰ পৰীক্ষা কৰক' : 'Check Answer'}
        </button>
      </div>

      <!-- Hint Box -->
      <div id="practiceHintBox" class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 hidden"></div>
    </div>
  `;
}function renderKeypadButtons() {
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
  if (!problem.operandA || !problem.operandB) return '';
  let tokens = '';
  for (let i = 0; i < problem.operandA; i++) {
    tokens += `<span class="inline-block w-6 h-6 bg-amber-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍎</span>`;
  }
  tokens += `<span class="font-black text-amber-800 mx-2 text-sm">${problem.operator}</span>`;
  for (let j = 0; j < problem.operandB; j++) {
    tokens += `<span class="inline-block w-6 h-6 bg-emerald-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍏</span>`;
  }
  return tokens;
}

window.pressPracticeNum = function(num) {
  const input = document.getElementById('practiceInput');
  if (input) {
    if (input.value.length < 4) input.value += num;
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

window.handleGuruQuestion = async function() {
  const input = document.getElementById('guruConceptInput');
  const respArea = document.getElementById('guruResponseArea');
  if (!input || !respArea || !input.value.trim()) return;

  respArea.classList.remove('hidden');
  respArea.innerHTML = `<span class="animate-pulse text-amber-800 font-bold">Thinking...</span>`;

  const q = input.value.trim();
  const prompt = `You are an encouraging math teacher. The student is learning "${activeTopicContext.title}" (${activeTopicContext.standard}).
Question: "${q}".
Explain the answer clearly and concisely in maximum 3 sentences. Answer in ${window.currentLang === 'as' ? 'Assamese' : 'English'}.`;

  const reply = await callGeminiDynamic(prompt, false);
  respArea.innerHTML = `<div class="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2 font-medium">${reply || 'Unable to fetch response. Please try again.'}</div>`;
};
        

  



window.openWorkspaceDirect = function(title, standard, topicId = '') {
  document.getElementById('searchResultsDropdown')?.classList.add('hidden');
  window.openWorkspaceForTopic(title, standard, 'learn', topicId);
};
