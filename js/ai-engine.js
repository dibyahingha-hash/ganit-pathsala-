// ============================================================================
// GANIT PATHSHALA - AI & DYNAMIC PRACTICE / TEST ENGINE
// ============================================================================

let currentPracticeProblem = null;
let practiceStreak = 0;

// Test Engine State
let testQuestions = [];
let currentTestIndex = 0;
let testScore = 0;

// ----------------------------------------------------
// 1. GEMINI API RUNNER (Dynamic AI Queries)
// ----------------------------------------------------
async function callGeminiDynamic(promptText, returnJson = false) {
  const apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '');
  if (!apiKey) {
    return returnJson ? null : 'API key not configured. Please check your setup.';
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: returnJson ? { responseMimeType: "application/json" } : {}
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (returnJson) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    return raw;
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return null;
  }
}

// ----------------------------------------------------
// 2. COMPREHENSIVE CURRICULUM-AWARE QUESTION GENERATOR
// ----------------------------------------------------
function generateArithmeticProblem(topicTitle, standard) {
  const t = (topicTitle || '').toLowerCase();
  const rawStd = (standard || '').toLowerCase().trim();

  // Accurate Grade Classification
  const isUndergrad = rawStd.includes('undergraduate') || rawStd.includes('b.sc') || rawStd.includes('b.tech') || rawStd.includes('degree');
  const isClass11or12 = rawStd.includes('class xi') || rawStd.includes('class xii') || rawStd.includes('11') || rawStd.includes('12');
  const isClass9or10 = rawStd.includes('class ix') || rawStd.includes('class x') || rawStd.includes('9') || rawStd.includes('10');
  const isMiddleSchool = rawStd.includes('class vi') || rawStd.includes('class vii') || rawStd.includes('class viii') ||
                         rawStd.includes('class 6') || rawStd.includes('class 7') || rawStd.includes('class 8');
  const isUpperPrimary = rawStd.includes('class iii') || rawStd.includes('class iv') || rawStd.includes('class v') ||
                         rawStd.includes('class 3') || rawStd.includes('class 4') || rawStd.includes('class 5');
  const isClass1 = rawStd === 'class i' || rawStd.includes('class 1') || rawStd === '1';

  let qText = '';
  let correct = 0;
  let hint = '';
  let showTokens = false;
  let opA = null;
  let opB = null;
  let op = '';
  let explicitDistractors = null;

  // --------------------------------------------------
  // TIER 1: UNDERGRADUATE / UNIVERSITY
  // --------------------------------------------------
  if (isUndergrad) {
    if (t.includes('real analysis') || t.includes('sequence') || t.includes('series') || t.includes('riemann') || t.includes('cauchy')) {
      const p = Math.floor(Math.random() * 3) + 2;
      correct = 0;
      qText = `Evaluate the limit as n → ∞ for sequence aₙ = 1 / n^${p}:`;
      hint = `As n grows infinitely large, 1/n^${p} converges to 0.`;
      explicitDistractors = [0, 1, '∞', p];
    } else if (t.includes('matrix') || t.includes('linear algebra') || t.includes('determinant') || t.includes('eigen')) {
      const a = Math.floor(Math.random() * 3) + 2;
      const d = Math.floor(Math.random() * 3) + 2;
      const b = 1;
      const c = 2;
      correct = (a * d) - (b * c);
      qText = `For matrix [[${a}, ${b}], [${c}, ${d}]], calculate determinant |A|:`;
      hint = `|A| = (${a} × ${d}) - (${b} × ${c}) = ${correct}.`;
    } else if (t.includes('differential') || t.includes('ode') || t.includes('pde')) {
      correct = 2;
      qText = `State the order of the ODE: (d²y/dx²) + 4(dy/dx)³ + y = 0:`;
      hint = `Order is determined by the highest derivative present (d²y/dx² = order 2).`;
      explicitDistractors = [1, 2, 3, 4];
    } else if (t.includes('group') || t.includes('ring') || t.includes('field') || t.includes('algebra')) {
      correct = 0;
      qText = `In the additive group of integers (ℤ, +), what is the identity element?`;
      hint = `For any integer a, a + 0 = a. The identity is 0.`;
      explicitDistractors = [0, 1, -1, 'None'];
    } else if (t.includes('vector') || t.includes('curl') || t.includes('gradient')) {
      const x = Math.floor(Math.random() * 3) + 1;
      const y = Math.floor(Math.random() * 3) + 1;
      correct = (2 * x) + (2 * y);
      qText = `For f(x, y) = x² + y², find sum of gradient components ∇f at (${x}, ${y}):`;
      hint = `∇f = (2x, 2y). Sum = 2(${x}) + 2(${y}) = ${correct}.`;
    } else {
      const k = Math.floor(Math.random() * 3) + 2;
      correct = k * 2;
      qText = `Evaluate definite integral: ∫₀² (${k}) dx:`;
      hint = `Area under constant ${k} from 0 to 2 is ${k} × 2 = ${correct}.`;
    }
  }

  // --------------------------------------------------
  // TIER 2: HIGHER SECONDARY (Class 11 & 12)
  // --------------------------------------------------
  else if (isClass11or12) {
    if (t.includes('calculus') || t.includes('derivative') || t.includes('differentiat')) {
      const p = Math.floor(Math.random() * 3) + 2;
      const xVal = 2;
      correct = p * Math.pow(xVal, p - 1);
      qText = `If f(x) = x^${p}, evaluate derivative f'(${xVal}):`;
      hint = `Power rule: d/dx(x^${p}) = ${p}x^${p - 1}. At x=2, it equals ${correct}.`;
    } else if (t.includes('limit') || t.includes('continuity')) {
      const a = Math.floor(Math.random() * 4) + 2;
      correct = 2 * a;
      qText = `Evaluate: lim (x → ${a}) [ (x² - ${a * a}) / (x - ${a}) ]:`;
      hint = `Factor as (x - ${a})(x + ${a}) / (x - ${a}) = x + ${a}. At x = ${a}, answer is ${2 * a}.`;
    } else if (t.includes('complex')) {
      correct = -1;
      qText = `Evaluate the imaginary unit power: i² = ?`;
      hint = `By definition of imaginary unit, i = √(-1), so i² = -1.`;
      explicitDistractors = [-1, 1, 0, 'i'];
    } else {
      const a = Math.floor(Math.random() * 3) + 2;
      correct = a * a;
      qText = `If a 2D vector is (${a}, 0), what is its magnitude squared?`;
      hint = `Magnitude squared = (${a})² + 0² = ${correct}.`;
    }
  }

  // --------------------------------------------------
  // TIER 3: HIGH SCHOOL (Class 9 & 10)
  // --------------------------------------------------
  else if (isClass9or10) {
    if (t.includes('triangle') || t.includes('similar') || t.includes('ত্ৰিভুজ')) {
      const sideRatio = Math.floor(Math.random() * 3) + 2;
      correct = sideRatio * sideRatio;
      qText = `If the side ratio of two similar triangles is 1 : ${sideRatio}, what is their Area ratio?`;
      hint = `Area ratio equals square of side ratio: 1² : ${sideRatio}² = 1 : ${correct}.`;
    } else if (t.includes('surface') || t.includes('volume') || t.includes('area') || t.includes('আয়তন')) {
      const factor = Math.floor(Math.random() * 2) + 2;
      correct = Math.pow(factor, 3);
      qText = `If each edge of a cube is multiplied by ${factor}, its volume increases by:`;
      hint = `Volume scales cubically: (${factor})³ = ${correct} times.`;
    } else if (t.includes('permutation') || t.includes('combination') || t.includes('বিন্যাস')) {
      const n = Math.floor(Math.random() * 3) + 3;
      const factorials = { 3: 6, 4: 24, 5: 120 };
      correct = factorials[n];
      qText = `Find the number of ways to arrange ${n} distinct items in a row (${n}!):`;
      hint = `${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' × ')} = ${correct}.`;
    } else if (t.includes('quadratic') || t.includes('সমীকৰণ')) {
      const r1 = Math.floor(Math.random() * 4) + 1;
      const r2 = Math.floor(Math.random() * 4) + 2;
      const sum = r1 + r2;
      const prod = r1 * r2;
      correct = prod;
      qText = `For quadratic x² - ${sum}x + ${prod} = 0, find product of roots (α·β):`;
      hint = `For x² - (sum)x + (product) = 0, product of roots c/a = ${prod}.`;
    } else if (t.includes('trig') || t.includes('ত্রিকোণমিতি')) {
      correct = 1;
      qText = `Evaluate standard identity: sin²(45°) + cos²(45°) = ?`;
      hint = `Pythagorean identity sin²θ + cos²θ = 1 for any angle.`;
      explicitDistractors = [1, 0, 0.5, 2];
    } else if (t.includes('circle') || t.includes('বৃত্ত') || t.includes('tangent')) {
      correct = 90;
      qText = `Angle between a tangent and the radius at the point of contact is:`;
      hint = `The tangent at any point of a circle is perpendicular (90°) to the radius.`;
      explicitDistractors = [90, 45, 60, 180];
    } else if (t.includes('coordinate') || t.includes('line') || t.includes('geometry') || t.includes('জ্যামিতি')) {
      const m = Math.floor(Math.random() * 3) + 2;
      const c = Math.floor(Math.random() * 4) + 1;
      const x = 3;
      correct = (m * x) + c;
      qText = `For line y = ${m}x + ${c}, evaluate y when x = ${x}:`;
      hint = `y = (${m} × ${x}) + ${c} = ${correct}.`;
    } else if (t.includes('probab') || t.includes('সম্ভাৱিতা')) {
      correct = 3;
      qText = `A standard 6-sided die is rolled. How many outcomes are prime numbers (2, 3, 5)?`;
      hint = `The primes are 2, 3, and 5 (total 3 outcomes).`;
      explicitDistractors = [3, 2, 4, 1];
    } else {
      const a = Math.floor(Math.random() * 4) + 3;
      const b = 2;
      correct = (a * a) - (b * b);
      qText = `Evaluate (${a} + ${b})(${a} - ${b}) using identity a² - b²:`;
      hint = `(${a})² - (${b})² = ${a * a} - ${b * b} = ${correct}.`;
    }
  }

  // --------------------------------------------------
  // TIER 4: MIDDLE SCHOOL (Class 6, 7, 8)
  // --------------------------------------------------
  else if (isMiddleSchool) {
    if (t.includes('fraction') || t.includes('ভগ্নাংশ') || t.includes('decimal')) {
      correct = 75;
      qText = `Convert the fraction 3/4 into a percentage (%):`;
      hint = `(3 / 4) × 100% = 75%.`;
      explicitDistractors = [75, 25, 50, 80];
    } else if (t.includes('integer') || t.includes('অখণ্ড সংখ্যা') || t.includes('negative')) {
      const a = Math.floor(Math.random() * 5) + 3;
      const b = Math.floor(Math.random() * 5) + 8;
      correct = a - b;
      qText = `Calculate: ${a} - ${b} = ?`;
      hint = `Subtracting a larger number leaves a negative result: ${a} - ${b} = ${correct}.`;
    } else if (t.includes('exponent') || t.includes('power') || t.includes('সূচক')) {
      const p = Math.floor(Math.random() * 2) + 3;
      correct = Math.pow(2, p);
      qText = `Evaluate: 2^${p} = ?`;
      hint = `Multiply 2 by itself ${p} times = ${correct}.`;
    } else if (t.includes('perimeter') || t.includes('পৰিসীমা') || t.includes('area') || t.includes('কালি')) {
      const l = Math.floor(Math.random() * 5) + 4;
      const w = Math.floor(Math.random() * 3) + 2;
      correct = 2 * (l + w);
      qText = `Perimeter of a rectangle with length ${l} cm and width ${w} cm:`;
      hint = `Perimeter = 2 × (${l} + ${w}) = ${correct} cm.`;
    } else if (t.includes('equation') || t.includes('সমীকৰণ') || t.includes('variable')) {
      const ans = Math.floor(Math.random() * 6) + 2;
      const add = Math.floor(Math.random() * 5) + 3;
      correct = ans;
      qText = `Solve for x: x + ${add} = ${ans + add}:`;
      hint = `Subtract ${add} from both sides: x = ${correct}.`;
    } else {
      const a = Math.floor(Math.random() * 8) + 3;
      const b = Math.floor(Math.random() * 7) + 3;
      correct = a * b;
      qText = `Evaluate: ${a} × ${b} = ?`;
      hint = `Multiply ${a} by ${b}.`;
    }
  }

  // --------------------------------------------------
  // TIER 5: UPPER PRIMARY (Class 3, 4, 5)
  // --------------------------------------------------
  else if (isUpperPrimary) {
    if (t.includes('divis') || t.includes('ভাগ') || t.includes('divide')) {
      const div = Math.floor(Math.random() * 5) + 3;
      correct = Math.floor(Math.random() * 7) + 2;
      qText = `Solve: ${div * correct} ÷ ${div} = ?`;
      hint = `How many times does ${div} fit into ${div * correct}? Answer is ${correct}.`;
    } else if (t.includes('sub') || t.includes('বিয়োগ') || t.includes('minus')) {
      const a = Math.floor(Math.random() * 40) + 25;
      const b = Math.floor(Math.random() * 15) + 5;
      correct = a - b;
      qText = `Solve: ${a} - ${b} = ?`;
      hint = `Subtract ${b} from ${a}.`;
    } else {
      const a = Math.floor(Math.random() * 7) + 3;
      const b = Math.floor(Math.random() * 6) + 3;
      correct = a * b;
      qText = `Solve: ${a} × ${b} = ?`;
      hint = `Multiply ${a} by ${b}.`;
    }
  }

  // --------------------------------------------------
  // TIER 6: FOUNDATIONAL PRIMARY (Class 1 & 2)
  // --------------------------------------------------
  else {
    // 1. 2D & 3D Shapes Identification
    if (t.includes('shape') || t.includes('আকৃতি') || t.includes('জ্যামিতি')) {
      const shapes = [
        { q: 'How many sides does a Triangle have? 🔺', ans: 3, opts: [3, 4, 0, 5], h: 'A triangle has 3 sides.' },
        { q: 'How many sides does a Square have? ⬛', ans: 4, opts: [4, 3, 5, 6], h: 'A square has 4 equal sides.' },
        { q: 'How many corners does a Circle have? ⚪', ans: 0, opts: [0, 1, 3, 4], h: 'A circle is round and has 0 corners.' },
        { q: 'How many faces does a Cube have? 🧊', ans: 6, opts: [6, 4, 8, 12], h: 'A cube has 6 square faces.' }
      ];
      const pick = shapes[Math.floor(Math.random() * shapes.length)];
      correct = pick.ans;
      qText = pick.q;
      hint = pick.h;
      explicitDistractors = pick.opts;
      showTokens = false;
    }
    // 2. Patterns & Sequencing
    else if (t.includes('pattern') || t.includes('sequence') || t.includes('ক্ৰম')) {
      const start = Math.floor(Math.random() * 4) + 1;
      const step = Math.random() > 0.5 ? 1 : 2;
      correct = start + (step * 3);
      qText = `Find the next number: ${start}, ${start + step}, ${start + step * 2}, ___ ?`;
      hint = `Notice the pattern: adding ${step} each time! Next is ${correct}.`;
      showTokens = false;
    }
    // 3. Counting & Number Sense
    else if (t.includes('counting') || t.includes('sense') || t.includes('গণনা') || t.includes('(1-9)')) {
      const count = Math.floor(Math.random() * 6) + 3;
      correct = count;
      qText = `How many apples are there in total?`;
      opA = count;
      opB = 0;
      op = '';
      hint = `Count them one by one: total is ${correct}!`;
      showTokens = true;
    }
    // 4. Subtraction
    else if (t.includes('sub') || t.includes('বিয়োগ') || t.includes('minus')) {
      const a = Math.floor(Math.random() * 5) + 4;
      const b = Math.floor(Math.random() * 3) + 1;
      correct = a - b;
      qText = `${a} - ${b} = ?`;
      opA = a;
      opB = b;
      op = '-';
      hint = `Start with ${a} apples, remove ${b}. You have ${correct} remaining.`;
      showTokens = true;
    }
    // 5. Addition
    else {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      correct = a + b;
      qText = `${a} + ${b} = ?`;
      opA = a;
      opB = b;
      op = '+';
      hint = `Count ${a} red apples, then add ${b} green apples! Total is ${correct}.`;
      showTokens = true;
    }
  }

  // Generate 4 randomized options
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
// 3. PRIMARY VISUAL TOKEN RENDERER (Apples / Counters)
// ----------------------------------------------------
function renderVisualTokens(problem) {
  if (!problem.showTokens || problem.operandA == null) return '';
  let tokens = '';
  for (let i = 0; i < problem.operandA; i++) {
    tokens += '<span class="inline-block w-6 h-6 bg-amber-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍎</span>';
  }
  if (problem.operator && problem.operandB != null && problem.operandB > 0) {
    tokens += `<span class="font-black text-amber-800 mx-2 text-sm">${problem.operator}</span>`;
    for (let j = 0; j < problem.operandB; j++) {
      tokens += '<span class="inline-block w-6 h-6 bg-emerald-500 rounded-full text-white text-[10px] font-bold leading-6 text-center select-none shadow-xs">🍏</span>';
    }
  }
  return tokens;
}

// ----------------------------------------------------
// 4. PRACTICE ARENA UI & TAP HANDLERS
// ----------------------------------------------------
function renderPracticeArena(container) {
  const isAs = window.currentLang === 'as';
  currentPracticeProblem = generateArithmeticProblem(activeTopicContext.title, activeTopicContext.standard);

  const displayQuestion = window.toDigits ? window.toDigits(currentPracticeProblem.questionText) : currentPracticeProblem.questionText;

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

// ----------------------------------------------------
// 5. TEST MODE ENGINE & HANDLERS
// ----------------------------------------------------
function renderTestSetup(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="p-5 text-center space-y-4">
      <h3 class="text-base font-bold text-slate-800">${isAs ? 'পৰীক্ষাৰ প্ৰশ্ন সংখ্যা বাছক:' : 'Select Question Count'}</h3>
      <p class="text-xs text-slate-500">${isAs ? 'কোনো ইংগিত পোৱা নাযাব। সময় নিৰ্ধাৰিত পৰীক্ষা।' : 'Strict timed test. No hints allowed.'}</p>
      
      <div class="grid grid-cols-3 gap-3 max-w-xs mx-auto pt-2">
        <button onclick="startTestMode(10)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          10 Qs
        </button>
        <button onclick="startTestMode(15)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          15 Qs
        </button>
        <button onclick="startTestMode(20)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          20 Qs
        </button>
      </div>
    </div>
  `;
}

window.startTestMode = function(count) {
  testQuestions = [];
  currentTestIndex = 0;
  testScore = 0;

  for (let i = 0; i < count; i++) {
    testQuestions.push(generateArithmeticProblem(activeTopicContext.title, activeTopicContext.standard));
  }

  const container = document.getElementById('arenaBody') || document.querySelector('.arena-container');
  if (container) renderTestQuestion(container);
};

function renderTestQuestion(container) {
  const q = testQuestions[currentTestIndex];
  const isAs = window.currentLang === 'as';
  const total = testQuestions.length;

  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4">';
  q.options.forEach(opt => {
    const displayOpt = window.toDigits ? window.toDigits(opt) : opt;
    const optArg = typeof opt === 'string' ? `'${opt.replace(/'/g, "\\'")}'` : opt;
    optionsHtml += `
      <button onclick="handleTestSelect(${optArg})" class="option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-xl font-black text-slate-800 shadow-sm active:scale-95 transition">
        ${displayOpt}
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
        <div class="text-2xl font-black text-slate-800 tracking-wider mb-4">
          ${window.toDigits ? window.toDigits(q.questionText) : q.questionText}
        </div>
        ${optionsHtml}
      </div>
    </div>
  `;
}

window.handleTestSelect = function(val) {
  const q = testQuestions[currentTestIndex];
  if (String(val) === String(q.correctAnswer)) {
    testScore++;
  }

  currentTestIndex++;
  const container = document.getElementById('arenaBody') || document.querySelector('.arena-container');

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
          <button onclick="renderTestSetup(document.getElementById('arenaBody') || document.querySelector('.arena-container'))" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition">
            ${isAs ? 'পুনৰ পৰীক্ষা দিয়ক' : 'Take Another Test'}
          </button>
        </div>
      `;
    }
  }
};

// ----------------------------------------------------
// 6. GURU CONCEPT Q&A HANDLER
// ----------------------------------------------------
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

