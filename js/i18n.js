// js/i18n.js

const translations = {
  as: {
    brandTitle: "গণিত পাঠশালা",
    brandTagline: "স্পৰ্শ কৰা, খেলা আৰু শিকা",
    welcomeHeading: "গণিত পাঠশালালৈ স্বাগতম",
    welcomeSub: "প্ৰাথমিক গণনাৰ পৰা উচ্চ গণিতলৈ—প্ৰতিটো ধাৰণা স্পৰ্শ কৰক আৰু বুজি লওক।",
    keyModalTitle: "Google Gemini API সংযোগ",
    keyModalDesc: "এই এপটোত অংক সমাধান আৰু খোজবোৰ বুজিবলৈ Google Gemini AI ব্যৱহাৰ কৰা হয়। বিনামূলীয়াকৈ ব্যৱহাৰ কৰিবলৈ আপোনাৰ নিজা Google Gemini Key সংযোগ কৰক।",
    stepsTitle: "৩ টা সহজ খোজত Key লওক:",
    step1: "তলৰ বুটামত ক্লিক কৰি Google AI Studio খোলক।",
    step2: "Google একাউণ্টেৰে Sign In কৰি 'Create API Key' ত ক্লিক কৰক।",
    step3: "Key টো কপি কৰি তলৰ বাকচত পেষ্ট (Paste) কৰক।",
    studioBtnText: "বিনামূলীয়া Key লওক (Google AI Studio)",
    pasteKeyLabel: "Gemini API Key পেষ্ট কৰক:",
    saveKeyBtnText: "পৰীক্ষা কৰি সাঁচি থওক",
    cancelBtnText: "পাছত কৰিম",
    activeKeyStatus: "AI সক্ৰিয়",
    needKeyStatus: "AI Key নাই",
    testingKey: "পৰীক্ষা কৰি থকা হৈছে...",
    keyValid: "সফল হ’ল! আপোনাৰ Gemini Key সুৰক্ষিতভাৱে সাঁচি থোৱা হ’ল।",
    keyInvalid: "ভুল Key! অনুগ্ৰহ কৰি সঠিক Key দিয়ক।"
  },
  en: {
    brandTitle: "Gonit Pathshala",
    brandTagline: "Touch, Play & Master Mathematics",
    welcomeHeading: "Welcome to Gonit Pathshala",
    welcomeSub: "From early sensory counting to higher mathematics—touch and master every concept.",
    keyModalTitle: "Connect Google Gemini API",
    keyModalDesc: "Gonit Pathshala uses Google Gemini AI to explain mathematical reasoning step-by-step. Connect your free personal key for unlimited usage.",
    stepsTitle: "Get your key in 3 easy steps:",
    step1: "Click the button below to open Google AI Studio.",
    step2: "Sign in with your Google account and click 'Create API Key'.",
    step3: "Copy the key and paste it in the box below.",
    studioBtnText: "Get Free Key (Google AI Studio)",
    pasteKeyLabel: "Paste Gemini API Key:",
    saveKeyBtnText: "Test & Save Key",
    cancelBtnText: "Do it later",
    activeKeyStatus: "AI Active",
    needKeyStatus: "Need Key",
    testingKey: "Testing connection...",
    keyValid: "Success! Your Gemini key is active and securely saved.",
    keyInvalid: "Invalid Key format. Please verify and try again."
  }
};

const asDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const i18n = {
  currentLang: localStorage.getItem('omnimath_lang') || 'as',

  init() {
    this.applyTranslations();
  },

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('omnimath_lang', lang);
    this.applyTranslations();
  },

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'as' ? 'en' : 'as');
  },

  t(key) {
    return translations[this.currentLang][key] || key;
  },

  toAssameseDigits(num) {
    return num.toString().replace(/\d/g, d => asDigits[d]);
  },

  applyTranslations() {
    const isAs = this.currentLang === 'as';
    document.documentElement.lang = this.currentLang;

    // Toggle button label
    const langLabel = document.getElementById('currentLangLabel');
    if (langLabel) langLabel.innerText = isAs ? 'English' : 'অসমীয়া';

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[this.currentLang][key]) {
        el.innerHTML = translations[this.currentLang][key];
      }
    });
  }
};

