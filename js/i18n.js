// js/i18n.js

export const strings = {
  as: {
    brandTitle: "গণিত পাঠশালা",
    brandTagline: "স্পৰ্শ কৰা, খেলা আৰু শিকা",
    searchPlaceholder: "যিকোনো গাণিতিক ধাৰণা অনুসন্ধান কৰক (যেনে: ভগ্নাংশ, সমীকৰণ)...",
    selectClassLabel: "শ্ৰেণী বা পৰ্যায় বাছক:",
    hwNavText: "ঘৰুৱা কাম",
    learnBtn: "শিকক (Learn)",
    playBtn: "খেলক (Play)",
    testBtn: "পৰীক্ষা (Test)",
    portalKeyTitle: "Google Gemini Key প্ৰয়োজন",
    portalKeyDesc: "গণিত পাঠশালা ব্যৱহাৰ কৰিবলৈ আপোনাক এতিয়া Google ৰ বিনামূলীয়া Gemini Key পৃষ্ঠালৈ লৈ যোৱা হ’ব। তাত Key টো বনাই কপি কৰি পুনৰ ইয়ালৈ ঘূৰি আহক।",
    redirectBtnText: "মোক Key পৃষ্ঠালৈ লৈ যাওক",
    portalPasteTitle: "Key পেষ্ট কৰক",
    portalPasteDesc: "Google AI Studio ৰ পৰা কপি কৰি অনা Key টো তলৰ বাকচত পেষ্ট কৰক:",
    launchBtnText: "পৰীক্ষা কৰি এপ আৰম্ভ কৰক",
    reopenGoogleBtnText: "↺ পুনৰ Google AI Studio লৈ যাওক",
    keyInvalid: "ভুল Key! Gemini Key সাধাৰণতে 'AIza' ৰে আৰম্ভ হয়।",
    verifyingKey: "Key পৰীক্ষা কৰি থকা হৈছে...",
    keyValid: "✓ সংযোগ সফল হ’ল! গণিত পাঠশালালৈ স্বাগতম!",
    keyFailed: "সংযোগ বিফল হ’ল। অনুগ্ৰহ কৰি সঠিক Key দিয়ক।",
    hwTitle: "ঘৰুৱা কামৰ সহায়ক (Homework Helper)",
    captureBtn: "ফটো তোলক",
    uploadBtn: "ফটো বাছক",
    hwPlaceholder: "বা ইয়াত আপোনাৰ অংকটো টাইপ কৰক...",
    hwModeLabel: "সহায়ৰ ধৰণ বাছক:",
    hwHint: "ইংগিত (Hint)",
    hwStep: "স্তৰে স্তৰে (Steps)",
    hwCheck: "পৰীক্ষা (Check)",
    askBtn: "সহায় বিচাৰক",
    analyzingHw: "AI গুৰুৱে অংকটো বিশ্লেষণ কৰি আছে...",
    rescueTitle: "বাঃ, আপুনি প্ৰায় সমাধানৰ ওচৰ পাইছিলগৈ!",
    tryAgainGuidance: "আহকচোন, এই খোজটো একেলগে পুনৰ পৰীক্ষা কৰোঁ:"
  },
  en: {
    brandTitle: "Gonit Pathshala",
    brandTagline: "Touch, Play and Master Mathematics",
    searchPlaceholder: "Search any math concept (e.g., Fractions, Linear Equations)...",
    selectClassLabel: "Select Grade / Level:",
    hwNavText: "Homework Help",
    learnBtn: "Learn",
    playBtn: "Play",
    testBtn: "Test",
    portalKeyTitle: "Google Gemini Key Required",
    portalKeyDesc: "To experience Gonit Pathshala, you will now be taken directly to Google to create your free Gemini API Key. Copy your key there and return to this tab.",
    redirectBtnText: "Take me to my Key Page",
    portalPasteTitle: "Paste Your Key",
    portalPasteDesc: "Paste the key you copied from Google AI Studio below:",
    launchBtnText: "Verify Key & Launch App",
    reopenGoogleBtnText: "↺ Open Google AI Studio again",
    keyInvalid: "Invalid Key format. Gemini keys begin with 'AIza'.",
    verifyingKey: "Verifying connection...",
    keyValid: "✓ Success! Welcome to Gonit Pathshala!",
    keyFailed: "Verification failed. Please check your key.",
    hwTitle: "Homework Helper",
    captureBtn: "Take Photo",
    uploadBtn: "Upload Photo",
    hwPlaceholder: "Or type your math problem here...",
    hwModeLabel: "Choose Assistance Level:",
    hwHint: "Hint",
    hwStep: "Step-by-Step",
    hwCheck: "Check My Work",
    askBtn: "Get Assistance",
    analyzingHw: "AI Guru is analyzing the problem...",
    rescueTitle: "Great try! You were super close!",
    tryAgainGuidance: "Let's examine this specific step together:"
  }
};

const asDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const i18n = {
  currentLang: localStorage.getItem('omnimath_lang') || 'as',

  t(key) {
    return strings[this.currentLang][key] || key;
  },

  toDigits(num) {
    if (this.currentLang === 'en') return num.toString();
    return num.toString().replace(/\d/g, d => asDigits[d]);
  },

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('omnimath_lang', lang);
    document.documentElement.lang = lang;
  }
};
