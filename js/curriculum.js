
// js/curriculum.js
export const stages = [
  {
    id: "foundation",
    title: { as: "প্ৰাথমিক (১–২)", en: "Classes 1–2" },
    icon: "🥭",
    isTactile: true,
    chapters: [
      {
        id: "count_mangoes",
        title: { as: "স্পৰ্শ কৰি গণনা কৰা", en: "Tactile Counting" },
        desc: { as: "আমবোৰ চুই চুই খৰাহীত থোৱা আৰু সংখ্যা শিকা।", en: "Tap or drag mangoes to the basket to master numbers." },
        formula: "১, ২, ৩, ৪, ৫..."
      },
      {
        id: "basic_add",
        title: { as: "সহজ যোগ আৰু বিয়োগ", en: "Basic Addition & Subtraction" },
        desc: { as: "বস্তু একত্ৰিত কৰা আৰু আঁতৰাই গণনা কৰা।", en: "Combining and separating tangible items." },
        formula: "৩ + ২ = ৫"
      }
    ]
  },
  {
    id: "primary",
    title: { as: "উচ্চ প্ৰাথমিক (৩–৫)", en: "Classes 3–5" },
    icon: "🍰",
    isTactile: false,
    chapters: [
      {
        id: "fractions",
        title: { as: "ভগ্নাংশৰ পৰিচয়", en: "Visual Fractions" },
        desc: { as: "পিঠা বা কেক কাটি অংশ উলিওৱাৰ কৌশল।", en: "Slicing wholes into equal parts." },
        formula: "\\frac{১}{২} + \\frac{১}{৪} = \\frac{৩}{৪}"
      },
      {
        id: "lcm_hcf",
        title: { as: "ল.সা.গু. আৰু গ.সা.উ.", en: "LCM & HCF" },
        desc: { as: "উমৈহতীয়া গুণিতক আৰু উৎপাদক নিৰ্ণয়।", en: "Multiples and prime factorizations." },
        formula: "\\text{LCM}(১২, ১৮) = ৩৬"
      }
    ]
  },
  {
    id: "middle",
    title: { as: "মধ্য ইংৰাজী (৬–৮)", en: "Classes 6–8" },
    icon: "📐",
    isTactile: false,
    chapters: [
      {
        id: "integers",
        title: { as: "অখণ্ড সংখ্যা আৰু সংখ্যোৰেখা", en: "Integers & Number Lines" },
        desc: { as: "ধনাত্মক আৰু ঋণাত্মক মানৰ প্ৰয়োগ।", en: "Operations with signed numbers." },
        formula: "(-৮) \\times (-৫) = +৪০"
      },
      {
        id: "linear_eq",
        title: { as: "সৰল সমীকৰণ", en: "Linear Equations" },
        desc: { as: "অজ্ঞাত চলক $x$ ৰ মান নিৰ্ণয়।", en: "Solving for unknown variables." },
        formula: "৩x + ৫ = ২০ \\implies x = ৫"
      }
    ]
  },
  {
    id: "secondary",
    title: { as: "মাধ্যমিক (৯–১০)", en: "Classes 9–10" },
    icon: "📈",
    isTactile: false,
    chapters: [
      {
        id: "quadratics",
        title: { as: "দ্বিঘাত সমীকৰণ", en: "Quadratic Equations" },
        desc: { as: "শ্ৰীধৰ আচাৰ্যৰ সূত্ৰ আৰু মূল নিৰূপণ।", en: "Roots and discriminant analysis." },
        formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
      },
      {
        id: "trig",
        title: { as: "ত্ৰিকোণমিতি", en: "Trigonometry" },
        desc: { as: "সমকোণী ত্ৰিভুজৰ অনুপাতসমূহ।", en: "Sine, Cosine, Tangent identities." },
        formula: "\\sin^2\\theta + \\cos^2\\theta = ১"
      }
    ]
  },
  {
    id: "higher_ug",
    title: { as: "১১–১২ আৰু স্নাতক", en: "11–12 & Undergrad" },
    icon: "∫",
    isTactile: false,
    chapters: [
      {
        id: "calculus",
        title: { as: "কলন গণিত (Calculus)", en: "Calculus & Limits" },
        desc: { as: "অৱকলন আৰু অনুকলনৰ গভীৰ ধাৰণা।", en: "Derivatives, integrals and rates of change." },
        formula: "\\frac{d}{dx}(\\sin x) = \\cos x, \\quad \\int x^n dx = \\frac{x^{n+1}}{n+1} + C"
      },
      {
        id: "analysis",
        title: { as: "বাস্তৱ বিশ্লেষণ (Analysis)", en: "Real Analysis" },
        desc: { as: "এপছিলন-ডেল্টা প্ৰমাণ আৰু কচি অনুক্ৰম।", en: "Epsilon-delta proofs and metric spaces." },
        formula: "\\forall \\varepsilon > 0, \\; \\exists \\delta > 0"
      }
    ]
  }
];
