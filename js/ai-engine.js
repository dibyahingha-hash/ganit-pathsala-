

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
// ============================================================================
// COMPREHENSIVE CURRICULUM-AWARE PRACTICE GENERATOR (ALL GRADES & CHAPTERS)
// ============================================================================
function generateArithmeticProblem(topicTitle, standard) {
  const t = (topicTitle || '').toLowerCase();
  const rawStd = (standard || '').toLowerCase().trim();

  // ----------------------------------------------------
  // GRADE CLASSIFIER (Exact Roman & Keyword Mapping)
  // ----------------------------------------------------
  const isUndergrad = rawStd.includes('undergraduate') || rawStd.includes('b.sc') || rawStd.includes('b.tech') || rawStd.includes('degree');
  const isClass11or12 = rawStd.includes('class xi') || rawStd.includes('class xii') || rawStd.includes('11') || rawStd.includes('12');
  const isClass9or10 = rawStd.includes('class ix') || rawStd.includes('class x') || rawStd.includes('9') || rawStd.includes('10');
  const isMiddleSchool = rawStd.includes('class vi') || rawStd.includes('class vii') || rawStd.includes('class viii') ||
                         rawStd.includes('class 6') || rawStd.includes('class 7') || rawStd.includes('class 8');
  const isUpperPrimary = rawStd.includes('class iii') || rawStd.includes('class iv') || rawStd.includes('class v') ||
                         rawStd.includes('class 3') || rawStd.includes('class 4') || rawStd.includes('class 5');
  const isClass1 = rawStd === 'class i' || rawStd.includes('class 1') || rawStd === '1';
  const isClass2 = rawStd === 'class ii' || rawStd.includes('class 2') || rawStd === '2';

  let qText = '';
  let correct = 0;
  let hint = '';
  let showTokens = false;
  let opA = null;
  let opB = null;
  let op = '';
  let explicitDistractors = null; // Used when options are non-integer or formulaic

  // ==========================================================================
  // TIER 1: UNDERGRADUATE (B.Sc. / B.Tech / University)
  // ==========================================================================
  if (isUndergrad) {
    // 1. Real Analysis & Sequences
    if (t.includes('real analysis') || t.includes('sequence') || t.includes('series') || t.includes('riemann') || t.includes('cauchy')) {
      const p = Math.floor(Math.random() * 3) + 2;
      correct = 0;
      qText = `Evaluate the limit as n → ∞ for sequence aₙ = 1 / n^${p}:`;
      hint = `As n grows infinitely large, 1/n^${p} converges to 0.`;
      explicitDistractors = [0, 1, '∞', p];
    }
    // 2. Linear Algebra & Matrices
    else if (t.includes('matrix') || t.includes('linear algebra') || t.includes('determinant') || t.includes('eigen')) {
      const a = Math.floor(Math.random() * 3) + 2;
      const d = Math.floor(Math.random() * 3) + 2;
      const b = 1;
      const c = 2;
      correct = (a * d) - (b * c);
      qText = `For matrix [[${a}, ${b}], [${c}, ${d}]], calculate determinant |A|:`;
      hint = `|A| = (${a} × ${d}) - (${b} × ${c}) = ${correct}.`;
    }
    // 3. Differential Equations
    else if (t.includes('differential') || t.includes('ode') || t.includes('pde')) {
      const deg = Math.floor(Math.random() * 2) + 2;
      correct = 2;
      qText = `State the order of the ODE: (d²y/dx²) + 5(dy/dx)^${deg} + y = 0:`;
      hint = `The order is the highest derivative present (d²y/dx² = order 2).`;
      explicitDistractors = [1, 2, deg, deg + 1];
    }
    // 4. Abstract Algebra (Groups, Rings, Fields)
    else if (t.includes('group') || t.includes('ring') || t.includes('field') || t.includes('algebra')) {
      correct = 0;
      qText = `In the additive group (ℤ, +), what is the identity element?`;
      hint = `For any integer a, a + 0 = a. The identity is 0.`;
      explicitDistractors = [0, 1, -1, 'None'];
    }
    // 5. Multivariable / Vector Calculus
    else if (t.includes('vector') || t.includes('curl') || t.includes('divergence') || t.includes('gradient')) {
      const x = Math.floor(Math.random() * 3) + 1;
      const y = Math.floor(Math.random() * 3) + 1;
      correct = (2 * x) + (2 * y);
      qText = `For f(x, y) = x² + y², find magnitude of ∇f at (${x}, ${y}) if ∇f = (2x, 2y) sum:`;
      hint = `2(${x}) + 2(${y}) = ${correct}.`;
    }
    // Undergrad Fallback
    else {
      const k = Math.floor(Math.random() * 3) + 2;
      correct = k * 2;
      qText = `Evaluate definite integral: ∫₀² (${k}) dx:`;
      hint = `Area under constant ${k} from 0 to 2 is ${k} × 2 = ${correct}.`;
    }
  }

  // ==========================================================================
  // TIER 2: HIGHER SECONDARY (Class 11 & 12)
  // ==========================================================================
  else if (isClass11or12) {
    // 1. Calculus & Derivatives
    if (t.includes('calculus') || t.includes('derivative') || t.includes('differentiat')) {
      const p = Math.floor(Math.random() * 3) + 2;
      const xVal = 2;
      correct = p * Math.pow(xVal, p - 1);
      qText = `If f(x) = x^${p}, evaluate derivative f'(${xVal}):`;
      hint = `Power rule: d/dx(x^${p}) = ${p}x^${p - 1}. At x=2, it equals ${correct}.`;
    }
    // 2. Limits & Continuity
    else if (t.includes('limit') || t.includes('continuity')) {
      const a = Math.floor(Math.random() * 4) + 2;
      correct = 2 * a;
      qText = `Evaluate: lim (x → ${a}) [ (x² - ${a * a}) / (x - ${a}) ]:`;
      hint = `Factor as (x - ${a})(x + ${a}) / (x - ${a}) = x + ${a}. At x = ${a}, answer is ${2 * a}.`;
    }
    // 3. Complex Numbers
    else if (t.includes('complex')) {
      correct = -1;
      qText = `Evaluate the imaginary unit power: i² = ?`;
      hint = `By definition of imaginary unit, i = √(-1), so i² = -1.`;
      explicitDistractors = [-1, 1, 0, 'i'];
    }
    // 4. Relations & Functions
    else if (t.includes('relation') || t.includes('function')) {
      const n = Math.floor(Math.random() * 2) + 2;
      correct = Math.pow(2, n * n);
      qText = `If set A has ${n} elements, how many binary relations exist on A?`;
      hint = `Total relations on set with n elements is 2^(n²) = 2^${n * n} = ${correct}.`;
    }
    // Class 11/12 Fallback
    else {
      const a = Math.floor(Math.random() * 3) + 2;
      correct = a * a;
      qText = `If a vector has components (${a}, 0), what is its magnitude squared?`;
      hint = `Magnitude squared = (${a})² + 0² = ${correct}.`;
    }
  }

  // ==========================================================================
  // TIER 3: SECONDARY / HIGH SCHOOL (Class 9 & 10)
  // ==========================================================================
  else if (isClass9or10) {
    // 1. Similar Triangles & Area Theorems
    if (t.includes('triangle') || t.includes('similar') || t.includes('ত্ৰিভুজ')) {
      const sideRatio = Math.floor(Math.random() * 3) + 2;
      correct = sideRatio * sideRatio;
      qText = `If side ratio of two similar triangles is 1 : ${sideRatio}, what is their Area ratio?`;
      hint = `Area ratio equals square of side ratio: 1² : ${sideRatio}² = 1 : ${correct}.`;
    }
    // 2. Surface Areas & Volumes
    else if (t.includes('surface') || t.includes('volume') || t.includes('area') || t.includes('আয়তন')) {
      const factor = Math.floor(Math.random() * 2) + 2; // 2 or 3
      correct = Math.pow(factor, 3);
      qText = `If edge of a cube is scaled by ${factor}×, its volume increases by:`;
      hint = `Volume scales cubically: (${factor})³ = ${correct} times.`;
    }
    // 3. Permutations & Combinations
    else if (t.includes('permutation') || t.includes('combination') || t.includes('বিন্যাস')) {
      const n = Math.floor(Math.random() * 3) + 3; // 3, 4, 5
      const factorials = { 3: 6, 4: 24, 5: 120 };
      correct = factorials[n];
      qText = `Number of unique arrangements for ${n} distinct books on a shelf (${n}!):`;
      hint = `${n}! = ${Array.from({length: n}, (_, i) => n - i).join(' × ')} = ${correct}.`;
    }
    // 4. Quadratic Equations
    else if (t.includes('quadratic') || t.includes('সমীকৰণ')) {
      const r1 = Math.floor(Math.random() * 4) + 1;
      const r2 = Math.floor(Math.random() * 4) + 2;
      const sum = r1 + r2;
      const prod = r1 * r2;
      correct = prod;
      qText = `For quadratic x² - ${sum}x + ${prod} = 0, find product of roots (α·β):`;
      hint = `For x² - (sum)x + (prod) = 0, product of roots c/a = ${prod}.`;
    }
    // 5. Trigonometry
    else if (t.includes('trig') || t.includes('ত্রিকোণমিতি')) {
      correct = 1;
      qText = `Evaluate standard identity: sin²(30°) + cos²(30°) = ?`;
      hint = `Pythagorean trigonometric identity sin²θ + cos²θ = 1 for any angle θ.`;
      explicitDistractors = [1, 0, 0.5, 2];
    }
    // 6. Circles & Tangents
    else if (t.includes('circle') || t.includes('বৃত্ত') || t.includes('tangent')) {
      correct = 90;
      qText = `What is the angle between a tangent to a circle and the radius at point of contact?`;
      hint = `The tangent at any point of a circle is perpendicular (90°) to the radius.`;
      explicitDistractors = [90, 45, 60, 180];
    }
    // 7. Coordinate Geometry
    else if (t.includes('coordinate') || t.includes('line') || t.includes('geometry') || t.includes('জ্যামিতি')) {
      const m = Math.floor(Math.random() * 3) + 2;
      const c = Math.floor(Math.random() * 4) + 1;
      const x = 3;
      correct = (m * x) + c;
      qText = `For line y = ${m}x + ${c}, evaluate y when x = ${x}:`;
      hint = `y = (${m} × ${x}) + ${c} = ${correct}.`;
    }
    // 8. Real Numbers & Euclid's Lemma
    else if (t.includes('euclid') || t.includes('real number')) {
      const base = Math.floor(Math.random() * 4) + 2;
      correct = base;
      qText = `Find HCF of ${base * 3} and ${base * 5}:`;
      hint = `The greatest common factor dividing both ${base * 3} and ${base * 5} is ${base}.`;
    }
    // 9. Probability
    else if (t.includes('probab') || t.includes('সম্ভাৱিতা')) {
      correct = 3;
      qText = `A standard 6-sided die is rolled. How many outcomes give a prime number (2, 3, 5)?`;
      hint = `The prime outcomes are 2, 3, and 5 (total 3 outcomes).`;
      explicitDistractors = [3, 2, 4, 1];
    }
    // Class 9/10 Fallback: Algebraic Identity
    else {
      const a = Math.floor(Math.random() * 4) + 3;
      const b = 2;
      correct = (a * a) - (b * b);
      qText = `Evaluate (${a} + ${b})(${a} - ${b}) using identity a² - b²:`;
      hint = `(${a})² - (${b})² = ${a * a} - ${b * b} = ${correct}.`;
    }
  }

  // ==========================================================================
  // TIER 4: MIDDLE SCHOOL (Class 6, 7, 8)
  // ==========================================================================
  else if (isMiddleSchool) {
    // 1. Fractions, Decimals, Percentages
    if (t.includes('fraction') || t.includes('ভগ্নাংশ') || t.includes('decimal')) {
      correct = 75;
      qText = `Convert the fraction 3/4 into a percentage (%):`;
      hint = `(3 / 4) × 100% = 75%.`;
      explicitDistractors = [75, 25, 50, 80];
    }
    // 2. Integers (Signed Math)
    else if (t.includes('integer') || t.includes('অখণ্ড সংখ্যা') || t.includes('negative')) {
      const a = Math.floor(Math.random() * 5) + 3;
      const b = Math.floor(Math.random() * 5) + 8;
      correct = a - b;
      qText = `Calculate: ${a} - ${b} = ?`;
      hint = `Subtracting a larger number leaves a negative result: ${a} - ${b} = ${correct}.`;
    }
    // 3. Exponents & Powers
    else if (t.includes('exponent') || t.includes('power') || t.includes('সূচক')) {
      const p = Math.floor(Math.random() * 2) + 3; // 3 or 4
      correct = Math.pow(2, p);
      qText = `Evaluate: 2^${p} = ?`;
      hint = `Multiply 2 by itself ${p} times: ${correct}.`;
    }
    // 4. Perimeter & Area
    else if (t.includes('perimeter') || t.includes('পৰিসীমা') || t.includes('area') || t.includes('কালি')) {
      const l = Math.floor(Math.random() * 5) + 4;
      const w = Math.floor(Math.random() * 3) + 2;
      correct = 2 * (l + w);
      qText = `Perimeter of a rectangle with length ${l} cm and width ${w} cm:`;
      hint = `Perimeter = 2 × (${l} + ${w}) = ${correct} cm.`;
    }
    // 5. Ratio & Proportion
    else if (t.includes('ratio') || t.includes('proportion') || t.includes('অনুপাত')) {
      const k = Math.floor(Math.random() * 3) + 2;
      correct = 5 * k;
      qText = `If 2 : 5 = ${2 * k} : x, solve for x:`;
      hint = `Cross-multiply: x = 5 × ${k} = ${correct}.`;
    }
    // 6. Linear Equations in 1 Variable
    else if (t.includes('equation') || t.includes('সমীকৰণ') || t.includes('variable')) {
      const ans = Math.floor(Math.random() * 6) + 2;
      const add = Math.floor(Math.random() * 5) + 3;
      correct = ans;
      qText = `Solve for x: x + ${add} = ${ans + add}:`;
      hint = `Subtract ${add} from both sides: x = ${ans + add} - ${add} = ${correct}.`;
    }
    // Middle School Fallback
    else {
      const a = Math.floor(Math.random() * 8) + 3;
      const b = Math.floor(Math.random() * 7) + 3;
      correct = a * b;
      qText = `Evaluate: ${a} × ${b} = ?`;
      hint = `Multiply ${a} by ${b}.`;
    }
  }

  // ==========================================================================
  // TIER 5: UPPER PRIMARY (Class 3, 4, 5)
  // ==========================================================================
  else if (isUpperPrimary) {
    // 1. Division & Remainders
    if (t.includes('divis') || t.includes('ভাগ') || t.includes('divide')) {
      const div = Math.floor(Math.random() * 5) + 3;
      correct = Math.floor(Math.random() * 7) + 2;
      qText = `Solve: ${div * correct} ÷ ${div} = ?`;
      hint = `How many times does ${div} fit into ${div * correct}? Answer is ${correct}.`;
    }
    // 2. Subtraction
    else if (t.includes('sub') || t.includes('বিয়োগ') || t.includes('minus')) {
      const a = Math.floor(Math.random() * 40) + 25;
      const b = Math.floor(Math.random() * 15) + 5;
      correct = a - b;
      qText = `Solve: ${a} - ${b} = ?`;
      hint = `Subtract ${b} from ${a}.`;
    }
    // 3. Shapes & Geometry
    else if (t.includes('shape') || t.includes('geometry') || t.includes('জ্যামিতি')) {
      correct = 3;
      qText = `How many sides does a triangle have?`;
      hint = `Tri = 3 sides.`;
      explicitDistractors = [3, 4, 5, 6];
    }
    // Upper Primary Fallback: Times Tables
    else {
      const a = Math.floor(Math.random() * 7) + 3;
      const b = Math.floor(Math.random() * 6) + 3;
      correct = a * b;
      qText = `Solve: ${a} × ${b} = ?`;
      hint = `Multiply ${a} by ${b}.`;
    }
  }

  // ==========================================================================
  // TIER 6: FOUNDATIONAL PRIMARY (Class 1 & 2)
  // ==========================================================================
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
      hint = `Start with ${bigger} apples, take away ${smaller}.`;
    } else {
      correct = a + b;
      qText = `${a} + ${b} = ?`;
      opA = a;
      opB = b;
      op = '+';
      hint = `Count ${a} red apples, then add ${b} green apples!`;
    }
  }

  // ----------------------------------------------------
  // SMART OPTION CHIP GENERATOR (4 Distinct Options)
  // ----------------------------------------------------
  let finalOptions = [];
  if (explicitDistractors && explicitDistractors.length === 4) {
    finalOptions = [...explicitDistractors].sort(() => Math.random() - 0.5);
  } else {
    const optionsSet = new Set([correct]);
    while (optionsSet.size < 4) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + 1);
      const candidate = correct + delta;
      optionsSet.add(candidate);
    }
    finalOptions = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  }

  return {
    questionText: qText,
    correctAnswer: correct,
    options: finalOptions,
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
  if (!problem.showTokens || problem.operandA == null || problem.operandB == null) return '';
  let tokens = '';
  for (let i = 0; i < problem.operandA; i++) {
    tokens += '<span class="inline-block w-6 h-6 bg-amber-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍎</span>';
  }
  tokens += `<span class="font-black text-amber-800 mx-2 text-sm">${problem.operator}</span>`;
  for (let j = 0; j < problem.operandB; j++) {
    tokens += '<span class="inline-block w-6 h-6 bg-emerald-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍏</span>';
  }
  return tokens;
}

function renderPracticeArena(container) {
  const isAs = window.currentLang === 'as';
  currentPracticeProblem = generateArithmeticProblem(activeTopicContext.title, activeTopicContext.standard);

  const displayQuestion = window.toDigits ? window.toDigits(currentPracticeProblem.questionText) : currentPracticeProblem.questionText;

  // Build 4 large tactile choice buttons with safe argument escaping
  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-5">';
  currentPracticeProblem.options.forEach(opt => {
    const displayOpt = window.toDigits ? window.toDigits(opt) : opt;
    const optArg = typeof opt === 'string' ? `'${opt.replace(/'/g, "\\'")}'` : opt;
    optionsHtml += `
      <button onclick="handleOptionSelect(${optArg}, this)" class="option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-xl font-black text-slate-800 shadow-sm active:scale-95 transition">
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

  // Disable all choice buttons immediately to prevent duplicate triggers
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

  if (String(selectedVal) === String(currentPracticeProblem.correctAnswer)) {
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
