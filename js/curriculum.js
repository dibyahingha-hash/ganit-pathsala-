// js/curriculum.js
const classesData = [
  {
    id: "cls_primary_1_2",
    title: { as: "প্ৰাথমিক (১–২ শ্ৰেণী)", en: "Primary (Classes 1–2)" },
    chapters: [
      {
        id: "tactile_counting",
        title: { as: "বস্তু গণন আৰু স্থানমান", en: "Object Counting & Place Value" },
        desc: { as: "বস্তু চুই চুই গণনা কৰা আৰু ১০ ৰ দল গঠন।", en: "Touch counting and grouping by 10s." },
        formula: "১ + ১ = ২",
        learnHtml: {
          as: "<p>গণনা হ'ল প্ৰকৃতিৰ আটাইতকৈ সহজ খেল। বস্তু এটা এটাকৈ একত্ৰিত কৰিলে মুঠ সংখ্যা বাঢ়ি যায়।</p>",
          en: "<p>Counting is the bedrock of all math. Grouping individual items increases the total sum.</p>"
        }
      },
      {
        id: "basic_addition",
        title: { as: "সহজ যোগ আৰু বিয়োগ", en: "Basic Addition & Subtraction" },
        desc: { as: "বস্তু একেলগ কৰা আৰু আঁতৰাই নতুন সংখ্যা পোৱা।", en: "Combining and removing items to find new totals." },
        formula: "৩ + ৪ = ৭",
        learnHtml: {
          as: "<p>যোগ মানে একত্ৰিত কৰা ($+$) আৰু বিয়োগ মানে আঁতৰোৱা ($-$)।</p>",
          en: "<p>Addition means bringing together ($+$); subtraction means taking away ($-$).</p>"
        }
      }
    ]
  },
  {
    id: "cls_upper_3_5",
    title: { as: "উচ্চ প্ৰাথমিক (৩–৫ শ্ৰেণী)", en: "Upper Primary (Classes 3–5)" },
    chapters: [
      {
        id: "fractions_slice",
        title: { as: "ভগ্নাংশৰ পৰিচয়", en: "Visual Fractions" },
        desc: { as: "এডাল গোটা বস্তুক সমান ভাগত ভাগ কৰাৰ কৌশল।", en: "Splitting wholes into equal proportional slices." },
        formula: "\\frac{১}{২} + \\frac{১}{৪} = \\frac{৩}{৪}",
        learnHtml: {
          as: "<p>যেতিয়া এটা বস্তুক সমান সমান অংশত কটা হয়, প্ৰতিটো অংশক ভগ্নাংশ বোলা হয়। ওপৰৰ সংখ্যাটো লৱ (Numerator) আৰু তলৰটো হৰ (Denominator)।</p>",
          en: "<p>A fraction represents a part of a whole. The top number is the numerator; the bottom is the denominator.</p>"
        }
      },
      {
        id: "factors_multiples",
        title: { as: "গ.সা.উ. আৰু ল.সা.গু.", en: "HCF & LCM" },
        desc: { as: "উমৈহতীয়া উৎপাদক আৰু গুণিতকৰ সন্ধান।", en: "Greatest common divisors and least common multiples." },
        formula: "\\text{LCM}(৪, ৬) = ১২",
        learnHtml: {
          as: "<p>ল.সা.গু. (LCM) হ'ল দুটা সংখ্যাৰ আটাইতকৈ সৰু উমৈহতীয়া গুণিতক।</p>",
          en: "<p>LCM is the smallest positive number divisible by both values.</p>"
        }
      }
    ]
  },
  {
    id: "cls_middle_6_8",
    title: { as: "মধ্য পৰ্যায় (৬–৮ শ্ৰেণী)", en: "Middle Stage (Classes 6–8)" },
    chapters: [
      {
        id: "integers_line",
        title: { as: "অখণ্ড সংখ্যা আৰু সংখ্যোৰেখা", en: "Integers & The Number Line" },
        desc: { as: "শূন্যৰ তলৰ ঋণাত্মক সংখ্যাৰ জগত।", en: "Understanding signed values below and above zero." },
        formula: "(-৫) + (+৮) = +৩",
        learnHtml: {
          as: "<p>শূন্যৰ সোঁফালে ধনাত্মক ($+$) আৰু বাওঁফালে ঋণাত্মক ($-$) সংখ্যা থাকে।</p>",
          en: "<p>Values right of zero are positive ($+$); values left of zero are negative ($-$).</p>"
        }
      },
      {
        id: "linear_equations",
        title: { as: "সৰল সমীকৰণ", en: "Linear Equations" },
        desc: { as: "তুলাচনীৰ দৰে দুয়োপাল্লা সমান ৰাখি চলকৰ মান উলিওৱা।", en: "Balancing equations to determine the unknown variable." },
        formula: "২x + ৩ = ১১ \\implies x = ৪",
        learnHtml: {
          as: "<p>সমীকৰণ এটা এখন তুলাচনীৰ দৰে। সমান চিনৰ দুয়োফালে একেই কাৰ্য কৰিলে সমতা অটুট থাকে।</p>",
          en: "<p>An equation is like a balanced scale. Performing identical operations on both sides preserves equilibrium.</p>"
        }
      }
    ]
  },
  {
    id: "cls_secondary_9_10",
    title: { as: "মাধ্যমিক (৯–১০ শ্ৰেণী)", en: "Secondary (Classes 9–10)" },
    chapters: [
      {
        id: "quadratic_eq",
        title: { as: "দ্বিঘাত সমীকৰণ", en: "Quadratic Equations" },
        desc: { as: "শ্ৰীধৰ আচাৰ্যৰ সূত্ৰ আৰু মূলৰ প্ৰকৃতি।", en: "Roots, parabolas, and discriminant analysis." },
        formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        learnHtml: {
          as: "<p>দ্বিঘাত সমীকৰণৰ সাধাৰণ ৰূপ হ'ল $ax^2 + bx + c = 0$। ইয়াৰ ভেদ নিৰূপক $D = b^2 - 4ac$।</p>",
          en: "<p>The standard form is $ax^2 + bx + c = 0$. The discriminant is $D = b^2 - 4ac$.</p>"
        }
      },
      {
        id: "trigonometry",
        title: { as: "ত্ৰিকোণমিতিৰ সূচনা", en: "Introduction to Trigonometry" },
        desc: { as: "সমকোণী ত্ৰিভুজৰ বাহু আৰু কোণৰ অনুপাত।", en: "Sine, Cosine, and Tangent geometric ratios." },
        formula: "\\sin^2\\theta + \\cos^2\\theta = ১",
        learnHtml: {
          as: "<p>ত্ৰিকোণমিতিয়ে সূক্ষ্মকোণ আৰু বাহুৰ অনুপাত ব্যাখ্যা কৰে: $\\sin\\theta = \\frac{\\text{লম্ব}}{\\text{অতিভুজ}}$।</p>",
          en: "<p>Trigonometric ratios relate angles to side lengths: $\\sin\\theta = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}$.</p>"
        }
      }
    ]
  },
  {
    id: "cls_higher_ug",
    title: { as: "উচ্চতৰ আৰু স্নাতক", en: "Higher & Undergraduate" },
    chapters: [
      {
        id: "calculus_diff",
        title: { as: "কলন গণিত (অৱকলন)", en: "Differential Calculus" },
        desc: { as: "পৰিৱৰ্তনৰ তাৎক্ষণিক হাৰ আৰু স্পৰ্শক।", en: "Instantaneous rate of change and tangents." },
        formula: "\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
        learnHtml: {
          as: "<p>অৱকলজে যিকোনো বক্ৰৰেখাৰ নিৰ্দিষ্ট বিন্দুত স্পৰ্শকৰ নতি বা ঢাল সূচায়।</p>",
          en: "<p>The derivative calculates the instantaneous slope of a tangent line to a curve.</p>"
        }
      }
    ]
  }
];
