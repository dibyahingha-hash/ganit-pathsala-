
// ============================================================================
// GANIT PATHSHALA - PEDAGOGICAL CORE & TOPIC REGISTRY ENGINE
// ============================================================================

window.activeTopicContext = { title: '', standard: '', mode: 'learn', topicId: '' };
let currentPracticeProblem = null;
let practiceStreak = 0;

// Test Engine State
let testQuestions = [];
let currentTestIndex = 0;
let testScore = 0;

// ----------------------------------------------------
// 1. TOPIC REGISTRY (Structured Pedagogy)
// ----------------------------------------------------
window.TopicRegistry = {
  // CLASS 1 - 2: PLACE VALUE
  'place_value_tens_ones': {
    title: { en: 'Place Value: Tens and Ones', as: 'স্থানীয় মান: দহক আৰু একক' },
    standards: ['class 1', 'class 2'],
    lesson: {
      concept: {
        en: 'A 2-digit number is made of **Tens** (bundles of 10) and **Ones** (single units). For example, 24 is 2 Tens and 4 Ones.',
        as: 'দুটীয়া সংখ্যাবোৰ **দহক** (১০ টাৰ থুপ) আৰু **একক** (এটা এটাকৈ) ৰে গঠিত। যেনে: ২৪ মানে ২ টা দহক আৰু ৪ টা একক।'
      },
      visual: (tens = 2, ones = 4) => `
        <div class="flex flex-col items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200">
          <div class="flex gap-4 items-end">
            <div class="text-center">
              <div class="flex gap-1">${'<div class="w-4 h-16 bg-amber-500 rounded-sm border border-amber-700" title="10-Rod"></div>'.repeat(tens)}</div>
              <span class="text-xs font-bold text-amber-900 mt-1 block">${tens} Tens (${tens * 10})</span>
            </div>
            <div class="text-center">
              <div class="flex gap-1 flex-wrap max-w-[80px]">${'<div class="w-4 h-4 bg-emerald-500 rounded-sm border border-emerald-700" title="1-Unit"></div>'.repeat(ones)}</div>
              <span class="text-xs font-bold text-emerald-900 mt-1 block">${ones} Ones (${ones})</span>
            </div>
          </div>
          <div class="text-sm font-black text-slate-800">${tens * 10} + ${ones} = ${tens * 10 + ones}</div>
        </div>
      `,
      example: {
        question: { en: 'How many tens and ones are in 35?', as: '৩৫ সংখ্যাটোত কেইটা দহক আৰু কেইটা একক আছে?' },
        steps: {
          en: ['The first digit 3 is in the Tens place = 3 Tens (30).', 'The second digit 5 is in the Ones place = 5 Ones (5).'],
          as: ['প্ৰথম অংক ৩ হ’ল দহকৰ ঘৰত = ৩ টা দহক (৩০)।', 'দ্বিতীয় অংক ৫ হ’ল এককৰ ঘৰত = ৫ টা একক (৫)।']
        },
        answer: '3 Tens + 5 Ones'
      }
    },
    generate: function() {
      const tens = Math.floor(Math.random() * 8) + 1; // 1 to 8
      const ones = Math.floor(Math.random() * 9) + 1; // 1 to 9
      const num = tens * 10 + ones;
      const isAs = window.currentLang === 'as';

      return {
        questionText: isAs 
          ? `${window.toDigits(num)} সংখ্যাটোত কিমানটা দহক আৰু একক আছে?`
          : `In the number ${num}, what is the place value?`,
        visualHtml: this.lesson.visual(tens, ones),
        correctAnswer: isAs ? `${window.toDigits(tens)} দহক + ${window.toDigits(ones)} একক` : `${tens} Tens + ${ones} Ones`,
        options: window.shuffleArray([
          isAs ? `${window.toDigits(tens)} দহক + ${window.toDigits(ones)} একক` : `${tens} Tens + ${ones} Ones`,
          isAs ? `${window.toDigits(ones)} দহক + ${window.toDigits(tens)} একক` : `${ones} Tens + ${tens} Ones`,
          isAs ? `${window.toDigits(tens + 1)} দহক + ${window.toDigits(ones)} একক` : `${tens + 1} Tens + ${ones} Ones`,
          isAs ? `${window.toDigits(tens)} দহক + ${window.toDigits(Math.max(0, ones - 1))} একক` : `${tens} Tens + ${Math.max(0, ones - 1)} Ones`
        ]),
        hint: isAs ? `প্ৰথম অংকটো দহক (${tens}) আৰু দ্বিতীয় অংকটো একক (${ones})।` : `First digit is Tens (${tens}), second digit is Ones (${ones}).`
      };
    }
  },

  // CLASS 2: 2-DIGIT SUBTRACTION WITH BORROWING
  'subtraction_borrowing': {
    title: { en: '2-Digit Subtraction with Borrowing', as: 'ধাৰ কৰা দুটকীয়া বিয়োগ' },
    standards: ['class 2', 'class 3'],
    lesson: {
      concept: {
        en: 'When the top ones digit is smaller than the bottom ones digit, **borrow 1 Ten (10 ones)** from the tens column!',
        as: 'যেতিয়া ওপৰৰ এককৰ সংখ্যাটো তলৰ সংখ্যাটোতকৈ সৰু হয়, তেতিয়া দহকৰ ঘৰৰ পৰা **১ টা দহক (১০ টা একক) ধাৰ কৰি** লওক!'
      },
      example: {
        question: { en: 'Solve: 52 - 17 = ?', as: 'সমাধান কৰক: ৫২ - ১৭ = ?' },
        steps: {
          en: [
            'In Ones place: 2 is smaller than 7. Borrow 1 Ten from 5. Tens becomes 4, and Ones becomes 12 (10 + 2).',
            'Subtract Ones: 12 - 7 = 5.',
            'Subtract Tens: 4 - 1 = 3.',
            'Combine: 35.'
          ],
          as: [
            'এককৰ ঘৰত: ২ সংখ্যাটো ৭ তকৈ সৰু। গতিকে ৫ ৰ পৰা ১ দহক ধাৰ কৰক। দহক হ’ল ৪, আৰু একক হ’ল ১২ (১০ + ২)।',
            'একক বিয়োগ কৰক: ১২ - ৭ = ৫।',
            'দহক বিয়োগ কৰক: ৪ - ১ = ৩।',
            'মুঠ ফলাফল: ৩৫।'
          ]
        },
        answer: '35'
      }
    },
    generate: function() {
      const tensA = Math.floor(Math.random() * 5) + 3; // 3 to 7
      const onesA = Math.floor(Math.random() * 5) + 1; // 1 to 5
      const numA = tensA * 10 + onesA;

      const tensB = Math.floor(Math.random() * (tensA - 1)) + 1;
      const onesB = Math.floor(Math.random() * 4) + (onesA + 1); // strictly bigger to force borrow
      const numB = tensB * 10 + onesB;

      const correct = numA - numB;
      const distractorNoBorrow = (tensA - tensB) * 10 + (onesB - onesA); // common mistake: subtracting smaller from larger

      return {
        questionText: `${window.toDigits ? window.toDigits(numA) : numA} - ${window.toDigits ? window.toDigits(numB) : numB} = ?`,
        correctAnswer: `${correct}`,
        options: window.shuffleArray([
          `${correct}`,
          `${distractorNoBorrow}`,
          `${correct + 10}`,
          `${Math.max(1, correct - 2)}`
        ]),
        hint: window.currentLang === 'as'
          ? `এককৰ পৰা বিয়োগ কৰিবলৈ দহকৰ পৰা ১ ধাৰ লওক (${onesA + 10} - ${onesB} = ${onesA + 10 - onesB})।`
          : `Borrow 1 ten into ones column: (${onesA + 10} - ${onesB} = ${onesA + 10 - onesB}).`
      };
    }
  },

  // CLASS 3: READING CLOCK & TIME
  'reading_clock': {
    title: { en: 'Reading Clock & Time', as: 'ঘড়ী আৰু সময় নিৰ্ণয়' },
    standards: ['class 3', 'class 4'],
    lesson: {
      concept: {
        en: 'The **short hand** shows the **Hour**. The **long hand** shows the **Minutes** (multiply the number by 5).',
        as: '**চুটি কাঁটাডালে** **ঘণ্টা** আৰু **দীঘল কাঁটাডালে** **মিনিট** দেখুৱায় (সংখ্যাটোক ৫ ৰে পূৰণ কৰক)।'
      },
      example: {
        question: { en: 'Short hand is at 4, long hand is at 6. What time is it?', as: 'চুটি কাঁটাডাল ৪ ত আৰু দীঘল কাঁটাডাল ৬ ত আছে। এতিয়া সময় কিমান?' },
        steps: {
          en: ['Hour hand at 4 = 4 o\'clock.', 'Minute hand at 6 = 6 × 5 = 30 minutes.', 'Time = 4:30.'],
          as: ['ঘণ্টাৰ কাঁটা ৪ ত = ৪ বাজিছে।', 'মিনিটৰ কাঁটা ৬ ত = ৬ × ৫ = ৩০ মিনিট।', 'সময় = ৪:৩০।']
        },
        answer: '4:30'
      }
    },
    generate: function() {
      const hour = Math.floor(Math.random() * 12) + 1;
      const minIndex = Math.floor(Math.random() * 4) * 3; // 0, 15, 30, 45
      const minStr = minIndex === 0 ? '00' : `${minIndex}`;
      const isAs = window.currentLang === 'as';

      return {
        questionText: isAs
          ? `ঘড়ীৰ চুটি কাঁটাডাল ${window.toDigits(hour)} ত আৰু দীঘল কাঁটাডাল ${window.toDigits(minIndex / 5 || 12)} ত থাকিলে সময় কিমান হ’ব?`
          : `If the short hand is on ${hour} and the long hand is on ${minIndex / 5 || 12}, what is the time?`,
        correctAnswer: `${hour}:${minStr}`,
        options: window.shuffleArray([
          `${hour}:${minStr}`,
          `${hour === 12 ? 1 : hour + 1}:${minStr}`,
          `${hour}:${minIndex === 30 ? '15' : '30'}`,
          `${minIndex / 5 || 12}:${hour < 10 ? '0' + hour : hour}`
        ]),
        hint: isAs ? `দীঘল কাঁটাডালৰ সংখ্যাটোক ৫ ৰে পূৰণ কৰি মিনিট উলিয়াওক।` : `Multiply the minute hand position by 5 to find minutes.`
      };
    }
  },

  // CLASS 9 - 10: REAL NUMBER SYSTEM
  'real_numbers': {
    title: { en: 'Real Number System', as: 'বাস্তৱ সংখ্যা প্ৰণালী' },
    standards: ['class 9', 'class 10'],
    lesson: {
      concept: {
        en: 'Real numbers include both **Rational numbers** (fractions $p/q$) and **Irrational numbers** (non-repeating decimals like $\\sqrt{2}, \\pi$).',
        as: 'বাস্তৱ সংখ্যাৰ ভিতৰত **পৰিমেয় সংখ্যা** ($p/q$ আকাৰৰ) আৰু **অপৰিমেয় সংখ্যা** (অসীম পৌনঃপুনিক নোহোৱা যেনে: $\\sqrt{2}, \\pi$) দুয়োটাই অন্তৰ্ভুক্ত।'
      },
      example: {
        question: { en: 'Which of the following is an irrational number?', as: 'তলৰ কোনটো এটা অপৰিমেয় সংখ্যা?' },
        steps: {
          en: ['$\\sqrt{4} = 2$ (rational)', '$3/5$ is a ratio of integers (rational)', '$\\sqrt{5}$ cannot be written as $p/q$ (irrational).'],
          as: ['$\\sqrt{4} = ২$ (পৰিমেয়)', '$৩/৫$ হ’ল দুটা অখণ্ড সংখ্যাৰ অনুপাত (পৰিমেয়)', '$\\sqrt{৫}$ ক $p/q$ ৰূপত লিখিব নোৱাৰি (অপৰিমেয়)।']
        },
        answer: '√5'
      }
    },
    generate: function() {
      const isAs = window.currentLang === 'as';
      const irrationals = ['√2', '√3', '√5', '√7', 'π'];
      const rationals = ['3/4', '0.25', '√9', '√16', '7/2', '5'];
      
      const pickIrr = irrationals[Math.floor(Math.random() * irrationals.length)];
      const pickRats = window.shuffleArray(rationals).slice(0, 3);

      return {
        questionText: isAs ? 'তলৰ কোনটো এটা অপৰিমেয় সংখ্যা?' : 'Which of the following is an IRRATIONAL number?',
        correctAnswer: pickIrr,
        options: window.shuffleArray([pickIrr, ...pickRats]),
        hint: isAs ? 'যিবোৰ সংখ্যাৰ বৰ্গমূল সম্পূৰ্ণ নহয়, সেইবোৰ অপৰিমেয়।' : 'Numbers that cannot be expressed as a perfect fraction or square are irrational.'
      };
    }
  }
};

// ----------------------------------------------------
// 2. HELPER: TOPIC MATCHER
// ----------------------------------------------------
function findRegisteredTopic(title, standard) {
  const t = (title || '').toLowerCase();
  
  if (t.includes('place value') || t.includes('tens') || t.includes('স্থানীয় মান')) return window.TopicRegistry['place_value_tens_ones'];
  if (t.includes('borrow') || t.includes('subtraction') || t.includes('বিয়োগ')) return window.TopicRegistry['subtraction_borrowing'];
  if (t.includes('clock') || t.includes('calendar') || t.includes('time') || t.includes('ঘড়ী')) return window.TopicRegistry['reading_clock'];
  if (t.includes('real number') || t.includes('বাস্তৱ সংখ্যা')) return window.TopicRegistry['real_numbers'];

  return null;
}

window.shuffleArray = function(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ----------------------------------------------------
// 3. WORKSPACE CONTROLLER (Learn / Practice / Test)
// ----------------------------------------------------
window.openWorkspaceForTopic = function(title, standard, mode, topicId) {
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
// 4. LEARN MODE SCREEN (The Pedagogical Core)
// ----------------------------------------------------
window.renderLearnMode = function(container) {
  const isAs = window.currentLang === 'as';
  const topic = findRegisteredTopic(activeTopicContext.title, activeTopicContext.standard);

  if (!topic || !topic.lesson) {
    container.innerHTML = `
      <div class="p-6 text-center space-y-4">
        <p class="text-sm font-bold text-slate-600">
          ${isAs ? 'এই পাঠটোৰ বাবে বিস্তৃত ধাৰণা প্ৰস্তুত কৰা হৈ আছে।' : 'Lesson notes for this specific chapter are being prepared.'}
        </p>
        <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition">
          ${isAs ? 'অনুশীলন আৰম্ভ কৰক' : 'Jump to Practice'}
        </button>
      </div>
    `;
    return;
  }

  const lesson = topic.lesson;
  const conceptText = lesson.concept[isAs ? 'as' : 'en'] || lesson.concept.en;
  const ex = lesson.example;

  container.innerHTML = `
    <div class="space-y-4 text-slate-800">
      
      <!-- 1. The Concept Card -->
      <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl">
        <h4 class="text-xs uppercase tracking-wider font-black text-amber-800 mb-1">
          💡 ${isAs ? 'ধাৰণা / বুজি লওঁ আহক' : 'Concept Explanation'}
        </h4>
        <p class="text-sm font-bold text-slate-800 leading-relaxed">${conceptText}</p>
      </div>

      <!-- 2. Visual Demonstration (if present) -->
      ${lesson.visual ? `<div class="my-2">${lesson.visual()}</div>` : ''}

      <!-- 3. Worked Step-by-Step Example -->
      ${ex ? `
        <div class="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
          <div class="text-xs font-black text-indigo-900 uppercase mb-1">
            📝 ${isAs ? 'সমাধান কৰা উদাহৰণ' : 'Step-by-Step Example'}
          </div>
          <div class="text-sm font-bold text-slate-900 mb-2">${ex.question[isAs ? 'as' : 'en']}</div>
          <div class="text-xs space-y-1.5 text-slate-700">
            ${(ex.steps[isAs ? 'as' : 'en'] || ex.steps.en).map(s => `<div>• ${s}</div>`).join('')}
          </div>
          <div class="mt-3 text-xs font-black text-emerald-700 bg-emerald-100/60 inline-block px-3 py-1 rounded-lg">
            ${isAs ? 'শুদ্ধ উত্তৰ' : 'Answer'}: ${ex.answer}
          </div>
        </div>
      ` : ''}

      <!-- 4. Next: Practice Button -->
      <button onclick="window.renderPracticeArena(document.getElementById('wsBody'))" 
              class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition active:scale-95 text-sm flex items-center justify-center gap-2">
        <span>${isAs ? 'এতিয়া নিজে অনুশীলন কৰক' : 'Ready to Practice!'}</span>
        <span>➔</span>
      </button>

    </div>
  `;

  if (window.renderMathInElement) {
    window.renderMathInElement(container, { delimiters: [{ left: '$', right: '$', display: false }] });
  }
};

// ----------------------------------------------------
// 5. PRACTICE ARENA
// ----------------------------------------------------
window.renderPracticeArena = function(container) {
  const isAs = window.currentLang === 'as';
  const topic = findRegisteredTopic(activeTopicContext.title, activeTopicContext.standard);

  let problem = null;
  if (topic && typeof topic.generate === 'function') {
    problem = topic.generate();
  } else {
    // Arithmetic Fallback with meaningful positive distractors
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    problem = {
      questionText: `Solve: ${a} × ${b} = ?`,
      correctAnswer: `${a * b}`,
      options: window.shuffleArray([`${a * b}`, `${a * b + 2}`, `${Math.max(1, a * b - 3)}`, `${a * b + 4}`]),
      hint: `Multiply ${a} by ${b}.`
    };
  }

  currentPracticeProblem = problem;

  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4">';
  problem.options.forEach(opt => {
    const optArg = typeof opt === 'string' ? `'${opt.replace(/'/g, "\\'")}'` : opt;
    optionsHtml += `
      <button onclick="window.handleOptionSelect(${optArg}, this)" class="option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base sm:text-lg font-black text-slate-800 shadow-sm active:scale-95 transition">
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
          ${problem.questionText}
        </div>

        ${problem.visualHtml ? `<div class="my-2">${problem.visualHtml}</div>` : ''}

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
    window.renderMathInElement(container, { delimiters: [{ left: '$', right: '$', display: false }] });
  }
};

window.handleOptionSelect = function(selectedVal, btnElement) {
  const fb = document.getElementById('practiceFeedback');
  const isAs = window.currentLang === 'as';

  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

  if (String(selectedVal) === String(currentPracticeProblem.correctAnswer)) {
    practiceStreak++;
    btnElement.className = 'option-btn py-4 bg-emerald-500 border-2 border-emerald-600 rounded-2xl text-base sm:text-lg font-black text-white shadow-md scale-105 transition';
    if (fb) fb.innerHTML = `<span class="text-emerald-600 text-base animate-bounce">🎉 ${isAs ? 'শুদ্ধ হৈছে! বহুত ভাল!' : 'Correct! Awesome job!'}</span>`;

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      const arena = document.getElementById('wsBody');
      if (arena) window.renderPracticeArena(arena);
    }, 1000);
  } else {
    practiceStreak = 0;
    btnElement.className = 'option-btn py-4 bg-rose-500 border-2 border-rose-600 rounded-2xl text-base sm:text-lg font-black text-white shadow-sm transition';
    if (fb) fb.innerHTML = `<span class="text-rose-600">${isAs ? 'ভুল হৈছে, পুনৰ চেষ্টা কৰক!' : 'Oops! Try again!'}</span>`;

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = practiceStreak;

    setTimeout(() => {
      document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = false;
        b.className = 'option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-base sm:text-lg font-black text-slate-800 shadow-sm active:scale-95 transition';
      });
    }, 700);
  }
};

window.askPracticeHint = function() {
  const hintBox = document.getElementById('practiceHintBox');
  if (!hintBox || !currentPracticeProblem) return;
  hintBox.classList.remove('hidden');
  hintBox.innerHTML = `<div class="font-medium">${currentPracticeProblem.hint}</div>`;
};

// ----------------------------------------------------
// 6. TEST MODE ENGINE
// ----------------------------------------------------
window.renderTestSetup = function(container) {
  const isAs = window.currentLang === 'as';
  container.innerHTML = `
    <div class="p-5 text-center space-y-4">
      <h3 class="text-base font-bold text-slate-800">${isAs ? 'পৰীক্ষাৰ প্ৰশ্ন সংখ্যা বাছক:' : 'Select Question Count'}</h3>
      <p class="text-xs text-slate-500">${isAs ? 'কোনো ইংগিত পোৱা নাযাব। সময় নিৰ্ধাৰিত পৰীক্ষা।' : 'Strict timed test. No hints allowed.'}</p>
      
      <div class="grid grid-cols-3 gap-3 max-w-xs mx-auto pt-2">
        <button onclick="window.startTestMode(10)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          10 Qs
        </button>
        <button onclick="window.startTestMode(15)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          15 Qs
        </button>
        <button onclick="window.startTestMode(20)" class="p-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-amber-900 text-sm transition active:scale-95 shadow-sm">
          20 Qs
        </button>
      </div>
    </div>
  `;
};

window.startTestMode = function(count) {
  testQuestions = [];
  currentTestIndex = 0;
  testScore = 0;

  const topic = findRegisteredTopic(activeTopicContext.title, activeTopicContext.standard);
  for (let i = 0; i < count; i++) {
    testQuestions.push(topic && typeof topic.generate === 'function' ? topic.generate() : {
      questionText: `Solve: ${Math.floor(Math.random()*8)+2} × ${Math.floor(Math.random()*8)+2} = ?`,
      correctAnswer: '12',
      options: ['12', '14', '10', '16']
    });
  }

  const container = document.getElementById('wsBody');
  if (container) renderTestQuestion(container);
};

function renderTestQuestion(container) {
  const q = testQuestions[currentTestIndex];
  const isAs = window.currentLang === 'as';
  const total = testQuestions.length;

  let optionsHtml = '<div class="grid grid-cols-2 gap-3 max-w-xs mx-auto my-4">';
  q.options.forEach(opt => {
    const optArg = typeof opt === 'string' ? `'${opt.replace(/'/g, "\\'")}'` : opt;
    optionsHtml += `
      <button onclick="window.handleTestSelect(${optArg})" class="option-btn py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-2xl text-lg font-black text-slate-800 shadow-sm active:scale-95 transition">
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
        <div class="text-xl font-black text-slate-800 tracking-wider mb-4">
          ${q.questionText}
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
