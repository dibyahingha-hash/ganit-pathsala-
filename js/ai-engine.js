// ai-engine.js - Gemini Dynamic Intelligence Engine & 6-Stage Interactive Player

// ----------------------------------------------------
// 0. OFFLINE / PRELOADED LESSON STORE
// ----------------------------------------------------
let preloadedLessons = {};
let activeLesson = null;
let currentStage = 1;

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
      <div onclick="openWorkspaceDirect('${query}', 'Universal Query', '')" class="p-4 hover:bg-amber-50 cursor-pointer text-left">
        <div class="text-xs text-amber-800 font-semibold">No direct chapter match in index.</div>
        <div class="text-sm font-bold text-amber-950 mt-1">✨ Generate 6-Stage Lesson for: "${query}"</div>
      </div>
    `;
  }
};

// ----------------------------------------------------
// 3. WORKSPACE ENTRY POINT (ROUTER)
// ----------------------------------------------------
window.openWorkspaceForTopic = async function(topicTitle, standardLevel, mode = 'learn', topicId = '') {
  const modal = document.getElementById('workspaceModal');
  const body = document.getElementById('wsBody');
  const title = document.getElementById('wsChapterTitle');
  const badge = document.getElementById('wsModeBadge');

  if (!modal || !body) return;
  modal.classList.remove('hidden');
  if (title) title.textContent = topicTitle;
  if (badge) badge.textContent = `${standardLevel} • ${mode.toUpperCase()}`;

  // Find topic key in preloadedLessons
  const lookupKey = topicId || Object.keys(preloadedLessons).find(k => 
    preloadedLessons[k].title.toLowerCase() === topicTitle.toLowerCase()
  );

  // 1. Instant Static Retrieval
  if (lookupKey && preloadedLessons[lookupKey]) {
    render6StageLesson(preloadedLessons[lookupKey]);
    return;
  }

  // 2. Instant LocalStorage Retrieval
  const cached = localStorage.getItem(`lesson_${topicTitle}`);
  if (cached) {
    try {
      render6StageLesson(JSON.parse(cached));
      return;
    } catch(e) {}
  }

  // 3. On-Demand Dynamic Generator
  fetchDynamicStructuredLesson(topicTitle, standardLevel);
};

// ----------------------------------------------------
// 4. ON-DEMAND STRUCTURED GENERATOR
// ----------------------------------------------------
async function fetchDynamicStructuredLesson(topicTitle, standardLevel) {
  const body = document.getElementById('wsBody');
  body.innerHTML = `
    <div class="p-8 text-center space-y-3">
      <div class="text-3xl animate-bounce">⚡</div>
      <div class="text-amber-900 font-bold text-sm animate-pulse">
        ${window.currentLang === 'as' ? '৬-পৰ্যায়ৰ পাঠ প্ৰস্তুত কৰা হৈছে...' : 'Building interactive 6-stage lesson...'}
      </div>
    </div>
  `;

  const prompt = `You are a master mathematics educator creating a bite-sized, 6-stage interactive lesson.
Target: ${standardLevel} - ${topicTitle}

Return STRICT JSON matching this exact structure:
{
  "id": "gen_${Date.now()}",
  "class_level": "${standardLevel}",
  "title": "${topicTitle}",
  "stage1_hook": {
    "en": "Short puzzle or question in max 12 words",
    "as": "Assamese translation of the hook question"
  },
  "stage2_sandbox": {
    "type": "grid_or_slider",
    "min": 1,
    "max": 10,
    "default": 4,
    "instruction_en": "One punchy action instruction under 10 words",
    "instruction_as": "Assamese instruction"
  },
  "stage3_discovery": {
    "formula_latex": "\\\\text{Core formula or equation}",
    "takeaway_en": "Plain English explanation in under 12 words",
    "takeaway_as": "Plain Assamese explanation"
  },
  "stage4_trap": {
    "trap_title_en": "The common trap name",
    "trap_alert_en": "Why students make this mistake in 12 words",
    "trap_alert_as": "Assamese warning"
  },
  "stage5_quiz": [
    {
      "q_en": "Question 1 (Easy)",
      "q_as": "Assamese Q1",
      "options": ["Option A", "Option B", "Option C"],
      "answer_index": 0
    },
    {
      "q_en": "Question 2 (Medium)",
      "q_as": "Assamese Q2",
      "options": ["Option A", "Option B", "Option C"],
      "answer_index": 1
    },
    {
      "q_en": "Question 3 (Trap Check)",
      "q_as": "Assamese Q3",
      "options": ["Option A", "Option B", "Option C"],
      "answer_index": 2
    }
  ]
}`;

  const resText = await callGeminiDynamic(prompt, true);
  if (resText) {
    try {
      const cleanJson = resText.replace(/```json|```/g, '').trim();
      const lessonData = JSON.parse(cleanJson);
      localStorage.setItem(`lesson_${topicTitle}`, JSON.stringify(lessonData));
      render6StageLesson(lessonData);
      return;
    } catch (e) {
      console.error("JSON parsing error", e);
    }
  }

  body.innerHTML = `<div class="p-6 text-center text-rose-600 font-bold">Failed to generate lesson. Please retry.</div>`;
}

// ----------------------------------------------------
// 5. 6-STAGE INTERACTIVE PLAYER
// ----------------------------------------------------
function render6StageLesson(lessonData) {
  activeLesson = lessonData;
  currentStage = 1;
  renderStageUI();
}

function renderStageUI() {
  if (!activeLesson) return;
  const lang = window.currentLang || 'en';
  const body = document.getElementById('wsBody');
  if (!body) return;

  let contentHtml = '';

  // Stage 1: The Hook
  if (currentStage === 1) {
    const text = lang === 'as' ? activeLesson.stage1_hook.as : activeLesson.stage1_hook.en;
    contentHtml = `
      <div class="p-6 text-center">
        <span class="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">Stage 1 • The Hook</span>
        <h2 class="text-2xl font-bold mt-6 text-slate-800 leading-snug">${text}</h2>
      </div>
    `;
  }
  // Stage 2: Sandbox
  else if (currentStage === 2) {
    const instr = lang === 'as' ? activeLesson.stage2_sandbox.instruction_as : activeLesson.stage2_sandbox.instruction_en;
    const sb = activeLesson.stage2_sandbox;
    contentHtml = `
      <div class="p-6 text-center">
        <span class="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded-full">Stage 2 • Interactive Sandbox</span>
        <p class="text-sm font-semibold text-slate-600 mt-4">${instr}</p>
        <div class="my-6 max-w-xs mx-auto">
          <input type="range" id="sb-slider" min="${sb.min}" max="${sb.max}" value="${sb.default}" class="w-full accent-indigo-600 cursor-pointer">
          <div id="sb-val" class="text-4xl font-black text-indigo-600 mt-3">${sb.default}</div>
        </div>
      </div>
    `;
    setTimeout(() => {
      const slider = document.getElementById('sb-slider');
      const val = document.getElementById('sb-val');
      if (slider && val) {
        slider.addEventListener('input', (e) => { val.innerText = e.target.value; });
      }
    }, 50);
  }
  // Stage 3: Core Discovery & Formula
  else if (currentStage === 3) {
    const takeaway = lang === 'as' ? activeLesson.stage3_discovery.takeaway_as : activeLesson.stage3_discovery.takeaway_en;
    contentHtml = `
      <div class="p-6 text-center">
        <span class="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">Stage 3 • Core Pattern</span>
        <div id="math-render" class="text-2xl my-6 text-slate-900 font-serif font-bold">$$${activeLesson.stage3_discovery.formula_latex}$$</div>
        <p class="text-base font-semibold text-slate-700">${takeaway}</p>
      </div>
    `;
  }
  // Stage 4: Trap
  else if (currentStage === 4) {
    const trapAlert = lang === 'as' ? activeLesson.stage4_trap.trap_alert_as : activeLesson.stage4_trap.trap_alert_en;
    contentHtml = `
      <div class="p-6 text-center bg-rose-50 rounded-2xl border border-rose-200">
        <span class="text-xs font-black text-rose-600 uppercase tracking-widest bg-rose-100 px-3 py-1 rounded-full">Stage 4 • Misconception Trap</span>
        <h3 class="text-lg font-bold text-rose-900 mt-4">${activeLesson.stage4_trap.trap_title_en}</h3>
        <p class="text-sm font-semibold text-rose-700 mt-2">${trapAlert}</p>
      </div>
    `;
  }
  // Stage 5: Quiz
  else if (currentStage === 5) {
    const quiz = activeLesson.stage5_quiz;
    contentHtml = `
      <div class="p-4">
        <div class="text-center mb-4">
          <span class="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full">Stage 5 • Mastery Check</span>
        </div>
        <div class="space-y-4">
          ${quiz.map((q, idx) => `
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p class="text-sm font-bold text-slate-800">${lang === 'as' ? q.q_as : q.q_en}</p>
              <div class="grid grid-cols-3 gap-2 mt-3">
                ${q.options.map((opt, optIdx) => `
                  <button onclick="handleQuizAnswer(${idx}, ${optIdx}, ${q.answer_index}, this)" class="py-2 px-3 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:border-indigo-500 shadow-sm transition">
                    ${opt}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Navigation Bar Footer
  const controlsHtml = `
    <div class="flex justify-between items-center border-t border-slate-200 pt-4 mt-6">
      <button onclick="prevStage()" ${currentStage === 1 ? 'disabled class="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"' : 'class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50"'}>
        Back
      </button>
      <span class="text-xs font-bold text-slate-500">Step ${currentStage} of 5</span>
      <button onclick="nextStage()" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700">
        ${currentStage === 5 ? 'Finish' : 'Next'}
      </button>
    </div>
  `;

  body.innerHTML = contentHtml + controlsHtml;

  // Render Math equations via KaTeX if available
  if (window.renderMathInElement) {
    window.renderMathInElement(body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      strict: false
    });
  }
}

// Stage Navigation Controls
window.nextStage = function() {
  if (currentStage < 5) {
    currentStage++;
    renderStageUI();
  } else {
    document.getElementById('workspaceModal')?.classList.add('hidden');
  }
};

window.prevStage = function() {
  if (currentStage > 1) {
    currentStage--;
    renderStageUI();
  }
};

window.handleQuizAnswer = function(qIdx, selectedIdx, correctIdx, btn) {
  const parent = btn.parentElement;
  const buttons = parent.querySelectorAll('button');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  if (selectedIdx === correctIdx) {
    btn.className = "py-2 px-3 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-sm";
  } else {
    btn.className = "py-2 px-3 text-xs font-bold text-white bg-rose-600 rounded-lg shadow-sm";
    buttons[correctIdx].className = "py-2 px-3 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-sm";
  }
};

window.openWorkspaceDirect = function(title, standard, topicId = '') {
  document.getElementById('searchResultsDropdown')?.classList.add('hidden');
  window.openWorkspaceForTopic(title, standard, 'learn', topicId);
};
