// ============================================================================
// GANIT PATHSHALA - RESILIENT PEDAGOGY ENGINE
// ============================================================================

window.activeTopicContext = { title: '', standard: '', mode: 'learn', topicId: '' };
let currentPracticeProblem = null;
let practiceStreak = 0;

let practiceQuestionQueue = [];
let isFetchingQueue = false;

let testQuestions = [];
let currentTestIndex = 0;
let testScore = 0;

let exampleCounter = 1;

const ASSAMESE_GUARDRAIL = `
CRITICAL LINGUISTIC INSTRUCTION:
- You must write in 100% PURE ASSAMESE (অসমীয়া).
- Strictly use the Assamese letter 'ৰ' (U+09F0), NEVER use the Bengali 'র' (U+09B0).
- Strictly use the Assamese letter 'ৱ' (U+09F1), NEVER replace it with 'ব'.
- DO NOT mix Bengali grammar or vocabulary (e.g., use 'কৰক/কৰে', never 'করুন/করে'; use 'হ’ব', never 'হবে'; use 'এটা', never 'একটি'; use 'আছেনে', never 'আছে কি').
- Use authentic Assamese mathematical terms (যেনে: কালি/ক্ষেত্ৰফল, অনুপাত, সদৃশ ত্ৰিভুজ, দহক, একক, ভগ্নাংশ, সমীকৰণ).
`;

// ----------------------------------------------------
// 1. ROBUST MULTI-TIER CALLER (HIGH-QUOTA FREE TIER)
// ----------------------------------------------------
async function fetchGeminiFast(promptText, returnJson = true) {
  const apiKey = window.apiKey || localStorage.getItem('omnimath_gemini_key') || '';
  if (!apiKey) throw new Error('API key missing. Enter your Gemini key.');

  // High-quota models prioritized over the 20 RPD preview models
  const models = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: returnJson ? { responseMimeType: "application/json" } : {}
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty AI response.");

      if (returnJson) {
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleaned);
      }
      return rawText;
    } catch (err) {
      lastError = err;
      console.warn(`[FastEngine] Model ${model} skipped:`, err.message);
    }
  }

  throw lastError || new Error("Connection failed. Check your network.");
}

// ----------------------------------------------------
// 2. WORKSPACE MODAL CONTROLLER
// ----------------------------------------------------
window.openWorkspaceForTopic = function(title, standard, mode = 'learn', topicId = '') {
  window.activeTopicContext = {
    title: title || 'Mathematics',
    standard: standard || 'Class 1',
    mode: mode || 'learn',
    topicId: topicId || ''
  };

  practiceStreak = 0;
  practiceQuestionQueue = [];
  testQuestions = [];
  currentTestIndex = 0;
  testScore = 0;
  exampleCounter = 1;

  const modal = document.getElementById('workspaceModal') || document.getElementById('topicWorkspaceModal');
  const titleEl = document.getElementById('wsChapterTitle');
  const badgeEl = document.getElementById('wsModeBadge');
  const bodyEl = document.getElementById('wsBody');
  const closeBtn = document.getElementById('closeWsBtn');

  if (titleEl) titleEl.innerText = title;
  if (badgeEl) badgeEl.innerText = (mode || 'LEARN').toUpperCase();
  if (closeBtn) closeBtn.onclick = window.closeTopicWorkspace;

  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  if (!bodyEl) return;

  if (mode === 'learn') {
    window.renderLearnMode(bodyEl);
  } else if (mode === 'test') {
    window.renderTestSetup(bodyEl);
  } else {
    window.renderPracticeArena(bodyEl);
  }
};

window.closeTopicWorkspace = function() {
  const modal = document.getElementById('workspaceModal') || document.getElementById('topicWorkspaceModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

// ----------------------------------------------------
// 3. LEARN MODE (INITIAL CONCEPT + PERSISTENCE)
// ----------------------------------------------------
window.renderLearnMode = async function(container) {
  const isAs = window.currentLang === 'as';
  const title = window.activeTopicContext.title;
  const standard = window.activeTopicContext.standard;
  const storageKey = `gp_lesson_${title}_${standard}_${window.currentLang}`;

  const savedLesson = localStorage.getItem(storageKey);
  if (savedLesson) {
    try {
      displayRenderedLesson(container, JSON.parse(savedLesson), isAs);
      return;
    } catch (e) {
      localStorage.removeItem(storageKey);
    }
  }

  container.innerHTML = `
    <div class="py-10 px-4 text-center space-y-3">
      <div class="text-3xl animate-bounce">⚡</div>
      <h4 class="text-sm font-black text-amber-950">
        ${isAs ? 'AI গুৰুৱে পাঠটো প্ৰস্তুত কৰি আছে...' : 'Loading interactive lesson...'}
      </h4>
      <p class="text-xs text-slate-500 font-semibold">${title} • ${standard}</p>
      <div class="w-24 h-1 bg-amber-200 rounded-full mx-auto overflow-hidden">
        <div class="w-full h-full bg-amber-600 animate-pulse"></div>
      </div>
    </div>
  `;

  const prompt = `Mathematics educator for "${standard}".
Topic: "${title}".
Target Language: Strictly ${isAs ? 'Assamese' : 'English'}.
${isAs ? ASSAMESE_GUARDRAIL : ''}

Respond ONLY with a JSON object:
{
  "conceptHeadline": "Short intuitive headline",
  "conceptExplanation": "Clear, warm 2-3 sentence intuitive explanation using an age-appropriate analogy.",
  "coreFormula": "Key identity in LaTeX ($...$) or short memory rule",
  "visualIllustrationHtml": "Compact HTML manipulative using Tailwind CSS",
  "sampleProblem": "Illustrative example problem",
  "stepByStepSolution": ["Step 1", "Step 2", "Step 3"],
  "finalAnswer": "Answer string"
}`;

  try {
    const lessonData = await fetchGeminiFast(prompt, true);
    localStorage.setItem(storageKey, JSON.stringify(lessonData));
    displayRenderedLesson(container, lessonData, isAs);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center space-y-3">
        <p class="text-xs font-bold text-rose-700">${isAs ? 'পাঠটো ল’ড কৰাত সমস্যা হ’ল।' : 'Failed to load lesson.'}</p>
        <button onclick="window.renderLearnMode(document.getElementById('wsBody'))" class="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs">
          ${isAs ? 'পুনৰ চেষ্টা কৰক' : 'Retry'}
        </button>
      </div>
    `;
  }
};

function displayRenderedLesson(container, lesson, isAs) {
  exampleCounter = 1;

  container.innerHTML = `
    <div class="space-y-4 text-slate-800">
      
      <!-- 1. The Core Concept Card -->
      <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl shadow-xs">
        <h4 class="text-xs uppercase tracking-wider font-black text-amber-800 mb-1">
          💡 ${lesson.conceptHeadline || (isAs ? 'ধাৰণা / বুজি লওঁ আহক' : 'Concept Explanation')}
        </h4>
        <p class="text-sm font-semibold text-slate-800 leading-relaxed">${lesson.conceptExplanation}</p>
        ${lesson.coreFormula ? `<div class="mt-2.5 text-xs font-black text-amber-950 font-mono bg-white p-2 rounded-xl border border-amber-200 inline-block">${lesson.coreFormula}</div>` : ''}
      </div>

      <!-- 2. Visual Model -->
      ${lesson.visualIllustrationHtml ? `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div class="text-[10px] font-black uppercase text-slate-400 mb-1.5">${isAs ? 'দৃশ্যমান আৰ্হি' : 'Visual Model'}</div>
          ${lesson.visualIllustrationHtml}
        </div>
      ` : ''}

      <!-- 3. Worked Examples List -->
      <div id="workedExamplesList" class="space-y-3">
        ${lesson.sampleProblem ? `
          <div class="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
            <div class="text-xs font-black text-indigo-900 uppercase mb-1">
              📝 ${isAs ? 'উদাহৰণ ১' : 'Example 1'}
            </div>
            <div class="text-sm font-bold text-slate-900 mb-2">${lesson.sampleProblem}</div>
            <div class="text-xs space-y-1 text-slate-700">
              ${(lesson.stepByStepSolution || []).map(s => `<div>• ${s}</div>`).join('')}
            </div>
            <div class="mt-2.5 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg inline-block">
              ${isAs ? 'শুদ্ধ উত্তৰ' : 'Answer'}: ${lesson.finalAnswer}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Deep Dive Container -->
      <div id="deepDiveContainer" class="hidden"></div>

      <!-- Controls -->
      <div class="pt-2 border-t border-slate-200 space-y-2">
        <div class="text-[11px] font-black uppercase text-slate-500 tracking-wider">
          ${isAs ? 'আৰু অধিক জানিব বিচাৰে নেকি?' : 'Want to explore deeper?'}
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <button id="moreExampleBtn" onclick="window.requestMoreExample()" class="py-2.5 px-3 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5 transition active:scale-95">
            <span>➕</span>
            <span>${isAs ? 'আন এটা উদাহৰণ' : 'Another Example'}</span>
          </button>

          <button id="deepDiveBtn" onclick="window.requestDeepDive()" class="py-2.5 px-3 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5 transition active:scale-95">
            <span>🔍</span>
            <span>${isAs ? 'গভীৰ অন্তৰ্দৃষ্টি' : 'Deep Insight'}</span>
          </button>
        </div>

        <div class="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <input type="text" id="studentDoubtInput" 
                 placeholder="${isAs ? 'এই পাঠটোৰ বিষয়ে কিবা সন্দেহ আছে নেকি?...' : 'Any doubt about this concept?...'}" 
                 class="flex-1 bg-transparent text-xs px-2 py-1.5 focus:outline-none text-slate-800" />
          <button onclick="window.askStudentDoubt()" class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition">
            ${isAs ? 'সুধক' : 'Ask'}
          </button>
        </div>
        <div id="doubtResponseBox" class="hidden text-xs p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 leading-relaxed"></div>
      </div>

      <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" 
              class="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md transition active:scale-95 text-sm flex items-center justify-center gap-2">
        <span>${isAs ? 'এতিয়া নিজে অনুশীলন কৰক' : 'Ready to Practice!'}</span>
        <span>➔</span>
      </button>

    </div>
  `;

  if (window.renderMathInElement) {
    window.renderMathInElement(container, { 
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ] 
    });
  }
}

// ----------------------------------------------------
// 3C. ON-DEMAND EXPANSION HANDLERS
// ----------------------------------------------------
window.requestMoreExample = async function() {
  const btn = document.getElementById('moreExampleBtn');
  const container = document.getElementById('workedExamplesList');
  if (!btn || !container) return;

  const isAs = window.currentLang === 'as';
  const title = window.activeTopicContext.title;
  const standard = window.activeTopicContext.standard;

  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin">⏳</span> <span>${isAs ? 'সাজি আছে...' : 'Crafting...'}</span>`;

  exampleCounter++;
  const prompt = `Math educator for "${standard}". Topic: "${title}".
Create a DIFFERENT, clear worked example for this topic.
Target Language: Strictly ${isAs ? 'Assamese' : 'English'}.
${isAs ? ASSAMESE_GUARDRAIL : ''}

Respond ONLY with a JSON object:
{
  "problem": "Problem statement with LaTeX ($...$)",
  "steps": ["Step 1 explanation", "Step 2 equation", "Step 3 conclusion"],
  "answer": "Final clean answer"
}`;

  try {
    const data = await fetchGeminiFast(prompt, true);
    
    // Fallback safe access in case Gemini uses alternate property keys
    const problemText = data.problem || data.sampleProblem || data.questionText || '';
    const stepsList = Array.isArray(data.steps) ? data.steps : (Array.isArray(data.stepByStepSolution) ? data.stepByStepSolution : []);
    const answerText = data.answer || data.finalAnswer || data.correctAnswer || '';

    const card = document.createElement('div');
    card.className = "bg-indigo-50 border border-indigo-200 p-4 rounded-2xl shadow-xs space-y-1.5 mt-2";
    card.innerHTML = `
      <div class="text-xs font-black text-indigo-900 uppercase">
        📝 ${isAs ? `উদাহৰণ ${window.toDigits ? window.toDigits(exampleCounter) : exampleCounter}` : `Example ${exampleCounter}`}
      </div>
      <div class="text-sm font-bold text-slate-900 mb-1.5">${problemText}</div>
      <div class="text-xs space-y-1 text-slate-700">
        ${stepsList.map(s => `<div>• ${s}</div>`).join('')}
      </div>
      <div class="mt-2 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg inline-block">
        ${isAs ? 'শুদ্ধ উত্তৰ' : 'Answer'}: ${answerText}
      </div>
    `;
    container.appendChild(card);

    if (window.renderMathInElement) {
      window.renderMathInElement(card, { 
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ] 
      });
    }
  } catch (err) {
    console.error("requestMoreExample error:", err);
    alert((isAs ? "উদাহৰণ প্ৰস্তুত কৰাত সমস্যা হ’ল: " : "Error generating example: ") + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>➕</span> <span>${isAs ? 'আৰু এটা উদাহৰণ' : 'Another Example'}</span>`;
  }
};


  

// ----------------------------------------------------
// 4. PRACTICE ARENA (BATCH BUFFERING & SPEED)
// ----------------------------------------------------
window.renderPracticeArena = async function(container) {
  const isAs = window.currentLang === 'as';

  if (practiceQuestionQueue.length > 0) {
    currentPracticeProblem = practiceQuestionQueue.shift();
    displayRenderedPractice(container, isAs);
    refillPracticeQueueBackground();
    return;
  }

  container.innerHTML = `
    <div class="py-12 px-4 text-center space-y-3">
      <div class="text-3xl animate-spin">⚡</div>
      <h4 class="text-sm font-black text-amber-950">
        ${isAs ? 'প্ৰশ্ন মঞ্চ প্ৰস্তুত হৈছে...' : 'Setting up practice arena...'}
      </h4>
    </div>
  `;

  await fetchPracticeBatch(5);

  if (practiceQuestionQueue.length > 0) {
    currentPracticeProblem = practiceQuestionQueue.shift();
    displayRenderedPractice(container, isAs);
  } else {
    container.innerHTML = `
      <div class="p-6 text-center space-y-3">
        <p class="text-xs font-bold text-rose-700">${isAs ? 'সংযোগ বিফল হ’ল।' : 'Failed to load questions.'}</p>
        <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" class="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs">
          ${isAs ? 'পুনৰ চেষ্টা কৰক' : 'Retry'}
        </button>
      </div>
    `;
  }
};

async function fetchPracticeBatch(count = 5) {
  if (isFetchingQueue) return;
  isFetchingQueue = true;

  const isAs = window.currentLang === 'as';
  const title = window.activeTopicContext.title;
  const standard = window.activeTopicContext.standard;

  const prompt = `Math question generator for "${standard}".
Topic: "${title}".
Target Language: Strictly ${isAs ? 'Assamese' : 'English'}.
${isAs ? ASSAMESE_GUARDRAIL : ''}

Create exactly ${count} distinct practice questions.
Respond ONLY with a JSON array:
[
  {
    "questionText": "Question string with LaTeX ($...$) if needed",
    "visualHtml": "Optional short visual HTML or empty string",
    "correctAnswer": "Answer string",
    "distractors": ["Wrong 1", "Wrong 2", "Wrong 3"],
    "hint": "Short guiding clue"
  }
]`;

  try {
    const list = await fetchGeminiFast(prompt, true);
    list.forEach(q => {
      practiceQuestionQueue.push({
        questionText: q.questionText,
        visualHtml: q.visualHtml || '',
        correctAnswer: q.correctAnswer,
        options: window.shuffleArray([q.correctAnswer, ...q.distractors]),
        hint: q.hint
      });
    });
  } catch (e) {
    console.warn("Queue prefetch error:", e);
  } finally {
    isFetchingQueue = false;
  }
}

function refillPracticeQueueBackground() {
  if (practiceQuestionQueue.length <= 2 && !isFetchingQueue) {
    fetchPracticeBatch(5);
  }
}

function displayRenderedPractice(container, isAs) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
        <span class="text-xs font-black text-amber-900 uppercase">🎯 ${isAs ? 'অনুশীলন মঞ্চ' : 'Practice Arena'}</span>
        <span class="text-xs font-bold text-amber-800">🔥 ${isAs ? 'ধাৰাবাহিক স্কোৰ' : 'Streak'}: <strong id="streakCount" class="text-sm font-black text-amber-600">${practiceStreak}</strong></span>
      </div>

      <div class="p-5 bg-white border-2 border-amber-300 rounded-3xl shadow-sm text-center">
        <div class="text-lg sm:text-xl font-black text-slate-800 tracking-wider mb-2">
          ${currentPracticeProblem.questionText}
        </div>

        ${currentPracticeProblem.visualHtml ? `<div class="my-2">${currentPracticeProblem.visualHtml}</div>` : ''}

        <p class="text-xs text-slate-400 font-bold mb-2">${isAs ? 'শুদ্ধ উত্তৰ বাছক:' : 'Tap the correct answer:'}</p>
        <div id="practiceOptionsContainer" class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4"></div>
      </div>

      <div id="practiceFeedback" class="text-center font-bold text-sm min-h-[28px]"></div>

      <div class="flex gap-2">
        <button onclick="window.askPracticeHint()" class="flex-1 py-2.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl text-xs transition">
          💡 ${isAs ? 'ইংগিত দিয়ক' : 'Need a Hint?'}
        </button>
      </div>

      <div id="practiceHintBox" class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 hidden leading-relaxed"></div>
    </div>
  `;

  const optContainer = document.getElementById('practiceOptionsContainer');
  currentPracticeProblem.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn py-4 px-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base sm:text-lg font-black text-slate-800 shadow-sm active:scale-95 transition';
    btn.innerText = opt;
    btn.onclick = () => window.handleOptionSelect(opt, btn);
    optContainer.appendChild(btn);
  });

  if (window.renderMathInElement) {
    window.renderMathInElement(container, { 
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ] 
    });
  }
}

window.handleOptionSelect = function(selectedVal, btnElement) {
  const fb = document.getElementById('practiceFeedback');
  const isAs = window.currentLang === 'as';

  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

  if (String(selectedVal) === String(currentPracticeProblem.correctAnswer)) {
    practiceStreak++;
    btnElement.className = 'option-btn py-4 px-2 bg-emerald-500 border-2 border-emerald-600 rounded-2xl text-base sm:text-lg font-black text-white shadow-md scale-105 transition';
    if (fb) fb.innerHTML = `<span class="text-emerald-600 text-base animate-bounce">🎉 ${isAs ? 'শুদ্ধ হৈছে! বঢ়িয়া!' : 'Correct! Outstanding!'}</span>`;

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      const arena = document.getElementById('wsBody');
      if (arena) window.renderPracticeArena(arena);
    }, 700);
  } else {
    practiceStreak = 0;
    btnElement.className = 'option-btn py-4 px-2 bg-rose-500 border-2 border-rose-600 rounded-2xl text-base sm:text-lg font-black text-white shadow-sm transition';
    if (fb) fb.innerHTML = `<span class="text-rose-600">${isAs ? 'ভুল হৈছে, পুনৰ চেষ্টা কৰক!' : 'Incorrect! Try again!'}</span>`;

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = false;
        b.className = 'option-btn py-4 px-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base sm:text-lg font-black text-slate-800 shadow-sm active:scale-95 transition';
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

// ----------------------------------------------------
// 5. TEST MODE
// ----------------------------------------------------
window.renderTestSetup = function(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="p-5 text-center space-y-4">
      <h3 class="text-base font-bold text-slate-800">${isAs ? 'পৰীক্ষাৰ প্ৰশ্ন সংখ্যা বাছক:' : 'Select Question Count'}</h3>
      <p class="text-xs text-slate-500">${isAs ? 'AI দ্বাৰা তৈয়াৰী পৰীক্ষা। সময় নিৰ্ধাৰিত।' : 'AI-generated test. No hints.'}</p>
      
      <div class="grid grid-cols-3 gap-3 max-w-xs mx-auto pt-2">
        <button onclick="window.startTestMode(5)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          5 Qs
        </button>
        <button onclick="window.startTestMode(10)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          10 Qs
        </button>
        <button onclick="window.startTestMode(15)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          15 Qs
        </button>
      </div>
    </div>
  `;
};

window.startTestMode = async function(count) {
  const container = document.getElementById('wsBody');
  const isAs = window.currentLang === 'as';
  const title = window.activeTopicContext.title;
  const standard = window.activeTopicContext.standard;

  container.innerHTML = `
    <div class="py-12 px-4 text-center space-y-3">
      <div class="text-3xl animate-spin">⏱️</div>
      <h4 class="text-sm font-black text-amber-950">
        ${isAs ? 'প্ৰশ্নকাকত প্ৰস্তুত হৈছে...' : 'Generating test paper...'}
      </h4>
      <p class="text-xs text-slate-500 font-semibold">${count} Questions • ${title}</p>
    </div>
  `;

  const prompt = `Examination board for "${standard}".
Topic: "${title}".
Target Language: Strictly ${isAs ? 'Assamese' : 'English'}.
${isAs ? ASSAMESE_GUARDRAIL : ''}

Create exactly ${count} distinct multiple-choice questions.
Respond ONLY with a JSON array:
[
  {
    "questionText": "Question string",
    "correctAnswer": "Answer string",
    "distractors": ["Wrong 1", "Wrong 2", "Wrong 3"]
  }
]`;

  try {
    const list = await fetchGeminiFast(prompt, true);
    testQuestions = list.map(q => ({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      options: window.shuffleArray([q.correctAnswer, ...q.distractors])
    }));
    currentTestIndex = 0;
    testScore = 0;
    renderTestQuestion(container);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center space-y-3">
        <p class="text-xs font-bold text-rose-700">${isAs ? 'পৰীক্ষা প্ৰস্তুত কৰাত সমস্যা হ’ল।' : 'Failed to generate test.'}</p>
        <button onclick="window.renderTestSetup(document.getElementById('wsBody'))" class="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs">
          ${isAs ? 'পুনৰ চেষ্টা কৰক' : 'Retry'}
        </button>
      </div>
    `;
  }
};

function renderTestQuestion(container) {
  const q = testQuestions[currentTestIndex];
  const isAs = window.currentLang === 'as';
  const total = testQuestions.length;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
        <span>⏱️ ${isAs ? 'পৰীক্ষা' : 'Test Mode'}</span>
        <span>${isAs ? 'প্ৰশ্ন' : 'Q'}: <strong>${currentTestIndex + 1} / ${total}</strong></span>
      </div>

      <div class="p-6 bg-white border-2 border-amber-300 rounded-3xl text-center shadow-sm">
        <div class="text-lg font-black text-slate-800 tracking-wider mb-4">
          ${q.questionText}
        </div>
        <div id="testOptionsContainer" class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4"></div>
      </div>
    </div>
  `;

  const optContainer = document.getElementById('testOptionsContainer');
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn py-4 px-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base font-black text-slate-800 shadow-sm active:scale-95 transition';
    btn.innerText = opt;
    btn.onclick = () => window.handleTestSelect(opt);
    optContainer.appendChild(btn);
  });

  if (window.renderMathInElement) {
    window.renderMathInElement(container, { 
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ] 
    });
  }
}

window.handleTestSelect = function(val) {
  const q = testQuestions[currentTestIndex];
  if (String(val) === String(q.correctAnswer)) {
    testScore++;
  }

  currentTestIndex++;
  const container = document.getElementById('wsBody');

  if (currentTestIndex < testQuestions.length) {
    if (container) renderTestQuestion(container);
  } else {
    const isAs = window.currentLang === 'as';
    const total = testQuestions.length;
    if (container) {
      container.innerHTML = `
        <div class="p-6 bg-white border-2 border-amber-300 rounded-3xl text-center space-y-4">
          <div class="text-4xl">🏆</div>
          <h3 class="text-xl font-black text-slate-800">${isAs ? 'পৰীক্ষা সম্পূৰ্ণ হ’ল!' : 'Test Completed!'}</h3>
          <p class="text-lg font-bold text-amber-900">
            ${isAs ? 'আপোনাৰ নম্বৰ' : 'Your Score'}: <span class="text-2xl font-black text-emerald-600">${testScore}</span> / ${total}
          </p>
          <button onclick="window.renderTestSetup(document.getElementById('wsBody'))" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition">
            ${isAs ? 'পুনৰ পৰীক্ষা দিয়ক' : 'Take Another Test'}
          </button>
        </div>
      `;
    }
  }
};

window.shuffleArray = function(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
