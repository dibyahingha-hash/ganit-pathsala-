// ai-engine.js - Gemini Dynamic Intelligence Engine for All Standards

async function callGeminiDynamic(promptText) {
  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];
  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) return txt;
    } catch (e) {}
  }
  return null;
}

// 1. Universal Search Handler
window.handleUniversalSearchQuery = async function(query) {
  const resultsContainer = document.getElementById('searchResultsDropdown');
  if (!resultsContainer) return;
  if (!query || query.trim().length < 2) {
    resultsContainer.classList.add('hidden');
    return;
  }

  resultsContainer.classList.remove('hidden');
  resultsContainer.innerHTML = `<div class="p-4 text-xs font-bold text-amber-800 animate-pulse">🔍 Searching standard index and AI database...</div>`;

  // First match against curriculum-tree
  let matches = [];
  const qLower = query.toLowerCase();
  window.MATH_CURRICULUM.forEach(cls => {
    const checkTopic = (t, streamName) => {
      const titleEn = (t.title.en || '').toLowerCase();
      const titleAs = (t.title.as || '').toLowerCase();
      if (titleEn.includes(qLower) || titleAs.includes(qLower)) {
        matches.push({ classLabel: cls.label, topic: t, streamName: streamName });
      }
    };
    if (cls.topics) cls.topics.forEach(t => checkTopic(t, null));
    if (cls.streams) {
      cls.streams.forEach(s => s.topics.forEach(t => checkTopic(t, s.streamName)));
    }
  });

  if (matches.length > 0) {
    resultsContainer.innerHTML = matches.slice(0, 8).map(m => `
      <div onclick="openWorkspaceDirect('${m.topic.title.en}', '${m.classLabel.en}')" class="p-3 border-b border-amber-100 hover:bg-amber-50 cursor-pointer text-left">
        <div class="text-[10px] uppercase font-bold text-amber-700">${m.classLabel[window.currentLang] || m.classLabel.en} ${m.streamName ? '• ' + (m.streamName[window.currentLang] || m.streamName.en) : ''}</div>
        <div class="text-sm font-bold text-slate-800">${m.topic.title[window.currentLang] || m.topic.title.en}</div>
      </div>
    `).join('');
  } else {
    resultsContainer.innerHTML = `
      <div onclick="openWorkspaceDirect('${query}', 'Universal Query')" class="p-4 hover:bg-amber-50 cursor-pointer text-left">
        <div class="text-xs text-amber-800 font-semibold">No direct chapter match in syllabus index.</div>
        <div class="text-sm font-bold text-amber-950 mt-1">✨ Ask Gemini AI to generate full lesson for: "${query}"</div>
      </div>
    `;
  }
};

// 2. Open Workspace for any topic at any level
window.openWorkspaceForTopic = async function(topicTitle, standardLevel, mode) {
  const modal = document.getElementById('workspaceModal');
  const body = document.getElementById('wsBody');
  const title = document.getElementById('wsChapterTitle');
  const badge = document.getElementById('wsModeBadge');

  if (!modal || !body) return;
  modal.classList.remove('hidden');
  title.textContent = topicTitle;
  badge.textContent = `${standardLevel} • ${mode.toUpperCase()}`;

  body.innerHTML = `
    <div class="p-8 text-center space-y-3">
      <div class="text-3xl animate-bounce">📐</div>
      <div class="text-amber-900 font-bold text-sm animate-pulse">
        ${window.currentLang === 'as' ? 'পাঠ্যক্ৰম অনুসৰি সমল প্ৰস্তুত কৰা হৈছে...' : 'Synthesizing pedagogical content for this standard...'}
      </div>
    </div>
  `;

  const isAs = window.currentLang === 'as';
  const langPrompt = isAs
    ? "Respond completely in Assamese using formal mathematical terminology. Wrap all equations, expressions, and values in LaTeX ($...$ or $$...$$)."
    : "Respond completely in English with mathematical rigor. Wrap all equations and values in LaTeX ($...$ or $$...$$).";
// Determine educational stage from standardLevel string
const isPrimary = /class (i|ii|iii|iv|v)\b/i.test(standardLevel);
const isMiddle = /class (vi|vii|viii)\b/i.test(standardLevel);
const isHighSchool = /class (ix|x)\b/i.test(standardLevel);
const isHigherSec = /class (xi|xii)\b/i.test(standardLevel);
const isUniversity = /undergraduate|post-graduate|b\.sc|m\.sc/i.test(standardLevel);

let stageInstruction = "";
if (isPrimary) {
  stageInstruction = `
TARGET AUDIENCE: A young child (Age 5-10, Primary School).
TONE: Playful, extremely simple, warm, visual.
RULES:
- DO NOT use college math, set theory symbols, cardinality notation, or complex words like 'discrete' or 'progression'.
- Use bright emojis (🍎, ⭐, 🚗, 🎈, 🐶) to illustrate quantities.
- Emphasize counting visually: show groupings with emojis.
- Teach number names and simple actions.
- Keep sentences short (5-8 words each).
`;
} else if (isMiddle) {
  stageInstruction = `
TARGET AUDIENCE: Middle school student (Age 11-14).
TONE: Clear, conceptual, relatable with everyday examples (pocket money, sports scores, pizza slices).
RULES: Introduce variables and negative numbers using concrete visual number-line analogies.
`;
} else if (isHighSchool || isHigherSec) {
  stageInstruction = `
TARGET AUDIENCE: High school / Senior secondary board exam student.
TONE: Rigorous, focused on step-by-step algebraic derivations, formulas, standard theorems, and board exam accuracy.
`;
} else {
  stageInstruction = `
TARGET AUDIENCE: University / Research student (B.Sc. / M.Sc.).
TONE: Pure mathematical rigor with formal definitions, lemmas, proofs, and vector/topological generalizations.
`;
}

  let prompt = "";
  if (mode === 'learn') {
    if (isPrimary) {
      prompt = `You are an elementary school math teacher teaching young children.
Level: ${standardLevel}
Topic: ${topicTitle}
${langPrompt}
${stageInstruction}

Generate a visual, friendly lesson formatted strictly in clean HTML:
1. <div class="text-center p-4 bg-amber-50 rounded-2xl mb-4 border border-amber-200">
     <div class="text-4xl mb-2">🍎 🍎 🍎</div>
     <h3 class="text-xl font-black text-amber-950">Let's Count! / আহা গণনা কৰোঁ!</h3>
     <p class="text-slate-700 text-sm mt-1">Simple friendly explanation using items the child recognizes.</p>
   </div>
2. <div class="grid grid-cols-3 gap-2 text-center mb-4">
     <div class="p-3 bg-white border border-amber-200 rounded-xl shadow-sm"><span class="text-2xl font-black text-amber-800">1</span><div class="text-lg">⭐</div><div class="text-xs font-bold text-slate-600">One / এক</div></div>
     <div class="p-3 bg-white border border-amber-200 rounded-xl shadow-sm"><span class="text-2xl font-black text-amber-800">2</span><div class="text-lg">⭐⭐</div><div class="text-xs font-bold text-slate-600">Two / দুই</div></div>
     <div class="p-3 bg-white border border-amber-200 rounded-xl shadow-sm"><span class="text-2xl font-black text-amber-800">3</span><div class="text-lg">⭐⭐⭐</div><div class="text-xs font-bold text-slate-600">Three / তিনি</div></div>
   </div>
3. <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-900 font-semibold">
     💡 Fun Fact or Quick Activity for the child!
   </div>`;
    } else {
      prompt = `You are a master mathematics instructor.
Level: ${standardLevel}
Topic: ${topicTitle}
${langPrompt}
${stageInstruction}

Structure your response strictly in HTML format (using Tailwind-friendly styles, without <html> or <body> tags):
1. <div class="mb-4"><h4 class="font-bold text-amber-950 mb-1">Intuitive Concept / ধাৰণা:</h4><p class="text-slate-700 text-sm leading-relaxed">[Real-life context and intuition appropriate for this level]</p></div>
2. <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-4"><h4 class="font-bold text-amber-900 text-xs uppercase mb-2">Core Identity / Theorem:</h4><div class="text-center text-lg font-bold">[Key formula or theorem in display LaTeX $$...$$]</div></div>
3. <div class="mb-4"><h4 class="font-bold text-amber-950 mb-1">Step-by-Step Breakdown:</h4><p class="text-slate-700 text-sm">[Detailed algebraic derivation or proof]</p></div>`;
    }
  }
   else if (mode === 'play') {
    prompt = `You are a universal mathematics curriculum designer.
Level/Standard: ${standardLevel}
Topic: ${topicTitle}
${langPrompt}
Create an interactive mental or visual exploration challenge suited to this exact level.
Format strictly in clean HTML:
Provide a clear goal, a worked scenario where changing values changes the outcome, and 3 exploration questions that let the student mentally manipulate variables.`;
  } else if (mode === 'test') {
    prompt = `You are a diagnostic mathematics examiner.
Level/Standard: ${standardLevel}
Topic: ${topicTitle}
${langPrompt}
Generate 2 distinct practice problems strictly calibrated to this level:
Problem 1: Conceptual Check.
Problem 2: Analytical Application.
Format cleanly in HTML with the problems and solutions enclosed inside a hidden toggle or expandable details block.`;
  }

  const result = await callGeminiDynamic(prompt);
  if (result) {
    body.innerHTML = result;
    if (window.renderMathInElement) {
      window.renderMathInElement(body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        strict: false
      });
    }
  } else {
    body.innerHTML = `<div class="p-6 text-center text-rose-600 font-bold">Failed to load content. Please check API connection and retry.</div>`;
  }
};

window.openWorkspaceDirect = function(title, standard) {
  document.getElementById('searchResultsDropdown')?.classList.add('hidden');
  window.openWorkspaceForTopic(title, standard, 'learn');
};

