// ============================================================================
// GANIT PATHSHALA - 100% AI-POWERED PEDAGOGY ENGINE (GEMINI-DRIVEN)
// ============================================================================

window.activeTopicContext = { title: '', standard: '', mode: 'learn', topicId: '' };
let currentPracticeProblem = null;
let practiceStreak = 0;

// Test Engine State
let testQuestions = [];
let currentTestIndex = 0;
let testScore = 0;

// Dynamic Session Cache (Prevents redundant API calls)
window.aiLessonCache = window.aiLessonCache || {};
window.aiPracticeCache = window.aiPracticeCache || {};


  // ----------------------------------------------------
// 1. GEMINI API RUNNER WITH MULTI-MODEL FALLBACK
// ----------------------------------------------------
async function fetchGeminiAI(promptText, returnJson = true) {
  const apiKey = window.apiKey || localStorage.getItem('omnimath_gemini_key') || '';
  if (!apiKey) {
    throw new Error('API key missing. Please enter your Gemini key.');
  }

  // Multi-tier model candidate array starting from 3.8
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.0-flash',
    'gemini-2.5-flash'
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: returnJson ? { responseMimeType: "application/json" } : {}
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty response from AI engine.");

      if (returnJson) {
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleaned);
      }
      return rawText;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} unavailable, trying next...:`, err.message);
    }
  }

  throw lastError || new Error("Failed to connect to Gemini API.");
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
  testQuestions = [];
  currentTestIndex = 0;
  testScore = 0;

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
// 3. LEARN MODE (100% AI PEDAGOGICAL GENERATION)
// ----------------------------------------------------
window.renderLearnMode = async function(container) {
  const isAs = window.currentLang === 'as';
  const title = window.activeTopicContext.title;
  const standard = window.activeTopicContext.standard;
  const cacheKey = `learn_${title}_${standard}_${window.currentLang}`;

  // Use cached response if already fetched
  if (window.aiLessonCache[cacheKey]) {
    displayRenderedLesson(container, window.aiLessonCache[cacheKey], isAs);
    return;
  }

  // Loading View
  container.innerHTML = `
    <div class="py-12 px-4 text-center space-y-4">
      <div class="text-4xl animate-bounce">🧠</div>
      <h4 class="text-base font-black text-amber-950">
        ${isAs ? 'AI গুৰুৱে পাঠটো প্ৰস্তুত কৰি আছে...' : 'AI Guru is preparing your interactive lesson...'}
      </h4>
      <p class="text-xs text-slate-500 font-bold max-w-xs mx-auto">
        ${title} • ${standard}
      </p>
      <div class="w-32 h-1.5 bg-amber-200 rounded-full mx-auto overflow-hidden">
        <div class="w-full h-full bg-amber-600 animate-pulse"></div>
      </div>
    </div>
  `;

  const prompt = `You are an award-winning mathematics teacher creating a pedagogy-first interactive lesson card for students in "${standard}".
Topic: "${title}".
Target Language: Strictly ${isAs ? 'Assamese (অসমীয়া ভাষাত আৰু লিপি ব্যৱহাৰ কৰক)' : 'English'}.

Respond ONLY with a valid JSON object matching this schema without any markdown code fences:
{
  "conceptHeadline": "Short catchy rule or intuitive headline",
  "conceptExplanation": "A 2-3 sentence intuitive explanation using an age-appropriate real-world analogy.",
  "coreFormula": "Key mathematical formula in LaTeX ($...$) or memory rule",
  "visualIllustrationHtml": "A clean HTML representation (e.g. styled flexboxes with emojis, fraction bars, blocks, or number lines using Tailwind CSS classes like 'flex gap-2 justify-center p-3 bg-amber-100 rounded-xl')",
  "sampleProblem": "A clean illustrative practice problem",
  "stepByStepSolution": [
    "Step 1: First explain what is observed or given",
    "Step 2: Show the mathematical conversion",
    "Step 3: State the final conclusion"
  ],
  "finalAnswer": "Final answer value"
}`;

  try {
    const lessonData = await fetchGeminiAI(prompt, true);
    window.aiLessonCache[cacheKey] = lessonData;
    displayRenderedLesson(container, lessonData, isAs);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center space-y-4">
        <div class="text-3xl text-rose-500">⚠️</div>
        <p class="text-sm font-bold text-rose-800">
          ${isAs ? 'পাঠটো সংগ্ৰহ কৰাত সমস্যা হ’ল।' : 'Failed to generate lesson from AI.'}
        </p>
        <p class="text-xs text-slate-500">${err.message}</p>
        <div class="flex gap-2 justify-center">
          <button onclick="window.renderLearnMode(document.getElementById('wsBody'))" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">
            ${isAs ? 'পুনৰ চেষ্টা কৰক' : 'Try Again'}
          </button>
          <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" class="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs">
            ${isAs ? 'অনুশীলনলৈ যাওক' : 'Skip to Practice'}
          </button>
        </div>
      </div>
    `;
  }
};

function displayRenderedLesson(container, lesson, isAs) {
  container.innerHTML = `
    <div class="space-y-4 text-slate-800">
      
      <!-- 1. The Concept Card -->
      <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl shadow-xs">
        <h4 class="text-xs uppercase tracking-wider font-black text-amber-800 mb-1">
          💡 ${lesson.conceptHeadline || (isAs ? 'ধাৰণা / বুজি লওঁ আহক' : 'Concept Explanation')}
        </h4>
        <p class="text-sm font-semibold text-slate-800 leading-relaxed">${lesson.conceptExplanation}</p>
        ${lesson.coreFormula ? `<div class="mt-2.5 text-xs font-black text-amber-950 font-mono bg-white p-2.5 rounded-xl border border-amber-200 inline-block">${lesson.coreFormula}</div>` : ''}
      </div>

      <!-- 2. Visual Representation / Manipulative -->
      ${lesson.visualIllustrationHtml ? `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
          <div class="text-[10px] font-black uppercase text-slate-400 mb-2">${isAs ? 'দৃশ্যমান আৰ্হি' : 'Visual Model'}</div>
          ${lesson.visualIllustrationHtml}
        </div>
      ` : ''}

      <!-- 3. Worked Step-by-Step Example -->
      ${lesson.sampleProblem ? `
        <div class="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl shadow-xs">
          <div class="text-xs font-black text-indigo-900 uppercase mb-1">
            📝 ${isAs ? 'সমাধান কৰা উদাহৰণ' : 'Step-by-Step Example'}
          </div>
          <div class="text-sm font-bold text-slate-900 mb-2.5">${lesson.sampleProblem}</div>
          <div class="text-xs space-y-1.5 text-slate-700">
            ${(lesson.stepByStepSolution || []).map(s => `<div class="flex items-start gap-1.5"><span>•</span><span>${s}</span></div>`).join('')}
          </div>
          <div class="mt-3 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl inline-block">
            ${isAs ? 'শুদ্ধ উত্তৰ' : 'Answer'}: ${lesson.finalAnswer}
          </div>
        </div>
      ` : ''}

      <!-- 4. Action Button: Move to Practice -->
      <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" 
              class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md transition active:scale-95 text-sm flex items-center justify-center gap-2">
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
// 4. PRACTICE ARENA (100% AI DYNAMIC QUESTION GEN)
// ----------------------------------------------------
window.renderPracticeArena = async function(container) {
  const isAs = window.currentLang === 'as';
  const title = window.activeTopicContext.title;
  const standard = window.activeTopicContext.standard;

  container.innerHTML = `
    <div class="py-12 px-4 text-center space-y-4">
      <div class="text-4xl animate-spin">⚡</div>
      <h4 class="text-base font-black text-amber-950">
        ${isAs ? 'AI য়ে প্ৰশ্ন সাজি আছে...' : 'AI Guru is generating a real-time question...'}
      </h4>
      <p class="text-xs text-slate-500 font-bold max-w-xs mx-auto">
        ${title} • ${standard}
      </p>
    </div>
  `;

  const prompt = `You are a mathematics question generator for "${standard}".
Topic: "${title}".
Language: Strictly ${isAs ? 'Assamese (অসমীয়া)' : 'English'}.

Generate 1 high-quality question strictly relevant to this chapter. Provide 4 distinct answer choices, identifying the correct choice and providing common misconceptions for the wrong choices. Do NOT provide negative numbers for early grades.

Respond ONLY with a valid JSON object matching this schema:
{
  "questionText": "The question string with LaTeX ($...$) if needed",
  "visualHtml": "Optional HTML visual string (or empty string)",
  "correctAnswer": "Exact string of the correct answer",
  "distractors": ["Wrong 1", "Wrong 2", "Wrong 3"],
  "hint": "A guiding conceptual hint without giving away the final answer immediately"
}`;

  try {
    const qData = await fetchGeminiAI(prompt, true);
    
    // Combine correct answer and distractors into randomized options
    const allOptions = window.shuffleArray([qData.correctAnswer, ...qData.distractors]);

    currentPracticeProblem = {
      questionText: qData.questionText,
      visualHtml: qData.visualHtml || '',
      correctAnswer: qData.correctAnswer,
      options: allOptions,
      hint: qData.hint
    };

    displayRenderedPractice(container, isAs);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center space-y-4">
        <p class="text-sm font-bold text-rose-700">${isAs ? 'প্ৰশ্ন প্ৰস্তুত কৰাত সমস্যা হ’ল।' : 'Failed to generate question.'}</p>
        <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" class="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">
          ${isAs ? 'পুনৰ চেষ্টা কৰক' : 'Retry'}
        </button>
      </div>
    `;
  }
};

function displayRenderedPractice(container, isAs) {
  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4">';
  currentPracticeProblem.options.forEach(opt => {
    const optArg = typeof opt === 'string' ? `'${opt.replace(/'/g, "\\'")}'` : opt;
    optionsHtml += `
      <button onclick="window.handleOptionSelect(${optArg}, this)" class="option-btn py-4 px-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base sm:text-lg font-black text-slate-800 shadow-sm active:scale-95 transition">
        ${opt}
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

      <div class="p-5 bg-white border-2 border-amber-300 rounded-3xl shadow-sm text-center">
        <div class="text-lg sm:text-xl font-black text-slate-800 tracking-wider mb-2">
          ${currentPracticeProblem.questionText}
        </div>

        ${currentPracticeProblem.visualHtml ? `<div class="my-2">${currentPracticeProblem.visualHtml}</div>` : ''}

        <p class="text-xs text-slate-400 font-bold mb-2">${isAs ? 'শুদ্ধ উত্তৰ বাছক:' : 'Tap the correct answer:'}</p>
        ${optionsHtml}
      </div>

      <div id="practiceFeedback" class="text-center font-bold text-sm min-h-[28px]"></div>

      <div class="flex gap-2">
        <button onclick="window.askPracticeHint()" class="flex-1 py-2.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl text-xs transition">
          💡 ${isAs ? 'ইংগিত দিয়ক' : 'Need a Hint?'}
        </button>
      </div>

      <div id="practiceHintBox" class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 hidden"></div>
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

window.handleOptionSelect = function(selectedVal, btnElement) {
  const fb = document.getElementById('practiceFeedback');
  const isAs = window.currentLang === 'as';

  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

  if (String(selectedVal) === String(currentPracticeProblem.correctAnswer)) {
    practiceStreak++;
    btnElement.className = 'option-btn py-4 px-2 bg-emerald-500 border-2 border-emerald-600 rounded-2xl text-base sm:text-lg font-black text-white shadow-md scale-105 transition';
    if (fb) fb.innerHTML = `<span class="text-emerald-600 text-base animate-bounce">🎉 ${isAs ? 'শুদ্ধ হৈছে! বহুত ভাল!' : 'Correct! Outstanding!'}</span>`;

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      const arena = document.getElementById('wsBody');
      if (arena) window.renderPracticeArena(arena);
    }, 1200);
  } else {
    practiceStreak = 0;
    btnElement.className = 'option-btn py-4 px-2 bg-rose-500 border-2 border-rose-600 rounded-2xl text-base sm:text-lg font-black text-white shadow-sm transition';
    if (fb) fb.innerHTML = `<span class="text-rose-600">${isAs ? 'ভুল হৈছে, পুনৰ চেষ্টা কৰক!' : 'Incorrect! Give it another try!'}</span>`;

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = false;
        b.className = 'option-btn py-4 px-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base sm:text-lg font-black text-slate-800 shadow-sm active:scale-95 transition';
      });
    }, 800);
  }
};

window.askPracticeHint = function() {
  const hintBox = document.getElementById('practiceHintBox');
  if (!hintBox || !currentPracticeProblem) return;
  hintBox.classList.remove('hidden');
  hintBox.innerHTML = `<div class="font-medium">${currentPracticeProblem.hint}</div>`;
};

// ----------------------------------------------------
// 5. TEST MODE (AI-GENERATED QUESTION SET)
// ----------------------------------------------------
window.renderTestSetup = function(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="p-5 text-center space-y-4">
      <h3 class="text-base font-bold text-slate-800">${isAs ? 'পৰীক্ষাৰ প্ৰশ্ন সংখ্যা বাছক:' : 'Select Question Count'}</h3>
      <p class="text-xs text-slate-500">${isAs ? 'AI দ্বাৰা তৈয়াৰী পৰীক্ষা। সময় নিৰ্ধাৰিত।' : 'AI-generated test for this topic. No hints.'}</p>
      
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
    <div class="py-12 px-4 text-center space-y-4">
      <div class="text-4xl animate-spin">⏱️</div>
      <h4 class="text-base font-black text-amber-950">
        ${isAs ? 'AI গুৰুৱে পৰীক্ষাৰ প্ৰশ্নকাকত তৈয়াৰ কৰি আছে...' : 'AI Guru is generating your customized test paper...'}
      </h4>
      <p class="text-xs text-slate-500 font-bold max-w-xs mx-auto">
        ${count} Questions • ${title}
      </p>
    </div>
  `;

  const prompt = `You are an examination board generator for "${standard}".
Topic: "${title}".
Language: Strictly ${isAs ? 'Assamese' : 'English'}.

Create exactly ${count} distinct multiple-choice questions for this chapter.
Respond ONLY with a JSON array of objects matching this schema:
[
  {
    "questionText": "Question 1 string",
    "correctAnswer": "Answer value",
    "distractors": ["Wrong 1", "Wrong 2", "Wrong 3"]
  }
]`;

  try {
    const questionsArray = await fetchGeminiAI(prompt, true);
    testQuestions = questionsArray.map(q => ({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      options: window.shuffleArray([q.correctAnswer, ...q.distractors])
    }));
    currentTestIndex = 0;
    testScore = 0;
    renderTestQuestion(container);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center space-y-4">
        <p class="text-sm font-bold text-rose-700">${isAs ? 'পৰীক্ষা প্ৰস্তুত কৰাত সমস্যা হ’ল।' : 'Failed to generate test questions.'}</p>
        <button onclick="window.renderTestSetup(document.getElementById('wsBody'))" class="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">
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

  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4">';
  q.options.forEach(opt => {
    const optArg = typeof opt === 'string' ? `'${opt.replace(/'/g, "\\'")}'` : opt;
    optionsHtml += `
      <button onclick="window.handleTestSelect(${optArg})" class="option-btn py-4 px-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base font-black text-slate-800 shadow-sm active:scale-95 transition">
        ${opt}
      </button>
    `;
  });
  optionsHtml += '</div>';

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
        <span>⏱️ ${isAs ? 'পৰীক্ষা চলি আছে' : 'Test Mode'}</span>
        <span>${isAs ? 'প্ৰশ্ন' : 'Question'}: <strong>${currentTestIndex + 1} / ${total}</strong></span>
      </div>

      <div class="p-6 bg-white border-2 border-amber-300 rounded-3xl text-center shadow-sm">
        <div class="text-lg font-black text-slate-800 tracking-wider mb-4">
          ${q.questionText}
        </div>
        ${optionsHtml}
      </div>
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

// ----------------------------------------------------
// 6. UTILITY HELPERS
// ----------------------------------------------------
window.shuffleArray = function(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
