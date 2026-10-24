// Multilingual translations for humanitarian field responders and families
// Supports English, Hindi (हिन्दी), Bengali (বাংলা), Gujarati (ગુજરાતી), Marathi (मराठी), and Tamil (தமிழ்)

export type LanguageCode = "en" | "hi" | "bn" | "gu" | "mr" | "ta";

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  quickScan: string;
  registerPerson: string;
  dashboard: string;
  scanner: string;
  home: string;
  emergencyContacts: string;
  callGuardian: string;
  sendWhatsApp: string;
  medicalAlert: string;
  statusSafe: string;
  statusMissing: string;
  statusFound: string;
  statusReunited: string;
  offlineMode: string;
  onlineMode: string;
  highContrast: string;
  safeHandoff: string;
  twoPersonRule: string;
  assistedMatching: string;
  noSmartphone: string;
  consentWithdrawal: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: "JanRaksha ID",
    tagline: "Connecting people when they need help the most",
    quickScan: "Quick Scan",
    registerPerson: "Register Person",
    dashboard: "Operations Dashboard",
    scanner: "Volunteer Scanner",
    home: "Home",
    emergencyContacts: "Emergency Guardian Contact",
    callGuardian: "Call Guardian Now",
    sendWhatsApp: "Send WhatsApp",
    medicalAlert: "Medical Alert & First-Aid Instructions",
    statusSafe: "Safe / Active",
    statusMissing: "Reported Missing",
    statusFound: "Located at Camp",
    statusReunited: "Safely Reunited",
    offlineMode: "Offline Mode (Sync Queued)",
    onlineMode: "Live Online",
    highContrast: "High-Contrast Field Mode",
    safeHandoff: "Safe Reunification Handoff",
    twoPersonRule: "Dual-Staff Sign-off Required",
    assistedMatching: "Assisted Case Matching",
    noSmartphone: "Paper Intake (No Smartphone)",
    consentWithdrawal: "Withdraw Consent & Purge",
  },
  hi: {
    appName: "जनरक्षा आईडी",
    tagline: "संकट के समय परिवारों को आपस में जोड़ना",
    quickScan: "त्वरित स्कैन",
    registerPerson: "व्यक्ति पंजीकरण",
    dashboard: "नियंत्रण केंद्र (डैशबोर्ड)",
    scanner: "स्वयंसेवक स्कैनर",
    home: "मुख्य पृष्ठ",
    emergencyContacts: "आपातकालीन अभिभावक संपर्क",
    callGuardian: "अभिभावक को तुरंत कॉल करें",
    sendWhatsApp: "व्हाट्सएप संदेश भेजें",
    medicalAlert: "चिकित्सा चेतावनी एवं प्राथमिक उपचार",
    statusSafe: "सुरक्षित / सक्रिय",
    statusMissing: "लापता दर्ज",
    statusFound: "सहायता केंद्र पर मौजूद",
    statusReunited: "सकुशल मिलन संपन्न",
    offlineMode: "ऑफ़लाइन मोड (कतारबद्ध)",
    onlineMode: "ऑनलाइन सक्रिय",
    highContrast: "उच्च-कंट्रास्ट फील्ड मोड",
    safeHandoff: "सुरक्षित पुनर्मिलन सुपुर्दगी",
    twoPersonRule: "दो कर्मचारियों का सत्यापन अनिवार्य",
    assistedMatching: "सहायक मिलान सुझाव",
    noSmartphone: "कागजी पर्ची (बिना फोन)",
    consentWithdrawal: "सहमति वापस लें व डेटा हटाएं",
  },
  bn: {
    appName: "জনরক্ষা আইডি",
    tagline: "জরুরী পরিস্থিতিতে পরিবার পুনর্মিলন ব্যবস্থা",
    quickScan: "দ্রুত স্ক্যান",
    registerPerson: "নিবন্ধন করুন",
    dashboard: "নিয়ন্ত্রণ ড্যাশবোর্ড",
    scanner: "স্বেচ্ছাসেবক স্ক্যানার",
    home: "হোম",
    emergencyContacts: "জরুরী অভিভাবক যোগাযোগ",
    callGuardian: "এখনই কল করুন",
    sendWhatsApp: "হোয়াটসঅ্যাপ পাঠান",
    medicalAlert: "চিকিৎসা সতর্কতা ও প্রাথমিক চিকিৎসা",
    statusSafe: "নিরাপদ",
    statusMissing: "নিখোঁজ",
    statusFound: "ক্যাম্পে উপস্থিত",
    statusReunited: "পরিবারে পুনর্মিলিত",
    offlineMode: "অফলাইন মোড",
    onlineMode: "অনলাইন সক্রিয়",
    highContrast: "উচ্চ-কনট্রাস্ট ফিল্ড মোড",
    safeHandoff: "নিরাপদ হস্তান্তর যাচাইকরণ",
    twoPersonRule: "দ্বৈত কর্মী স্বাক্ষর বাধ্যতামূলক",
    assistedMatching: "সহযোগী কেস মিলান",
    noSmartphone: "কাগজের নথি (স্মার্টফোন ছাড়া)",
    consentWithdrawal: "সম্মতি প্রত্যাহার ও তথ্য মোছা",
  },
  gu: {
    appName: "જનરક્ષા આઈડી",
    tagline: "આપત્તિ સમયમાં પરિવારોનું પુનર્મિલન",
    quickScan: "ઝડપી સ્કેન",
    registerPerson: "નોંધણી કરો",
    dashboard: "કંટ્રોલ ડેશબોર્ડ",
    scanner: "સ્વયંસેવક સ્કેનર",
    home: "મુખ્ય પૃષ્ઠ",
    emergencyContacts: "કટોકટી વાલી સંપર્ક",
    callGuardian: "તરત જ કોલ કરો",
    sendWhatsApp: "વોટ્સએપ મોકલો",
    medicalAlert: "તબીબી ચેતવણી અને પ્રાથમિક સારવાર",
    statusSafe: "સુરક્ષિત",
    statusMissing: "ગુમ થયેલ",
    statusFound: "કેમ્પ ખાતે મળેલ",
    statusReunited: "સફળ પુનર્મિલન",
    offlineMode: "ઓફલાઇન મોડ",
    onlineMode: "ઓનલાઇન",
    highContrast: "હાઇ-કોન્ટ્રાસ્ટ ફિલ્ડ મોડ",
    safeHandoff: "સુરક્ષિત સોંપણી ચકાસણી",
    twoPersonRule: "બે અધિકારીઓની સહી ફરજિયાત",
    assistedMatching: "સહાયક કેસ મેળવણી",
    noSmartphone: "કાગળ રસીદ (ફોન વગર)",
    consentWithdrawal: "સંમતિ રદ કરો અને ડેટા કાઢી નાખો",
  },
  mr: {
    appName: "जनरक्षा आयडी",
    tagline: "आपत्कालीन परिस्थितीत कुटुंब पुनर्मिलन",
    quickScan: "त्वरित स्कॅन",
    registerPerson: "नोंदणी करा",
    dashboard: "ऑपरेशन्स डॅशबोर्ड",
    scanner: "स्वयंसेवक स्कॅनर",
    home: "मुख्य पान",
    emergencyContacts: "आपत्कालीन पालक संपर्क",
    callGuardian: "पालकांना लगेच कॉल करा",
    sendWhatsApp: "व्हॉट्सॲप पाठवा",
    medicalAlert: "वैद्यकीय सूचना व प्रथमोपचार",
    statusSafe: "सुरक्षित",
    statusMissing: "बेपत्ता नोंद",
    statusFound: "मदत केंद्रावर उपस्थित",
    statusReunited: "कुटुंबात पुनर्मिलन",
    offlineMode: "ऑफलाइन मोड",
    onlineMode: "ऑनलाइन",
    highContrast: "हाय-कॉन्ट्रास्ट फील्ड मोड",
    safeHandoff: "सुरक्षित हस्तांतरण पडताळणी",
    twoPersonRule: "दोन कर्मचाऱ्यांची स्वाक्षरी आवश्यक",
    assistedMatching: "सहाय्यक केस जुळवणी",
    noSmartphone: "कागदी नोंद (स्मार्टफोनशिवाय)",
    consentWithdrawal: "संमती मागे घ्या व डेटा हटवा",
  },
  ta: {
    appName: "ஜன்ரக்ஷா ஐடி",
    tagline: "பேரிடர் காலங்களில் குடும்ப மறுஇணைப்பு",
    quickScan: "விரைவு ஸ்கேன்",
    registerPerson: "பதிவு செய்க",
    dashboard: "செயல்பாட்டு பலகை",
    scanner: "தன்னார்வலர் ஸ்கேனர்",
    home: "முகப்பு",
    emergencyContacts: "அவசர பாதுகாவலர் தொடர்பு",
    callGuardian: "உடனே அழைக்கவும்",
    sendWhatsApp: "வாட்ஸ்அப் அனுப்பவும்",
    medicalAlert: "மருத்துவ எச்சரிக்கை & முதலுதவி",
    statusSafe: "பாதுகாப்பானது",
    statusMissing: "காணவில்லை",
    statusFound: "முகாமில் உள்ளார்",
    statusReunited: "குடும்பத்துடன் இணைந்தார்",
    offlineMode: "ஆஃப்லைன் முறை",
    onlineMode: "ஆன்லைன்",
    highContrast: "உயர் மாறுபட்ட பார்வை முறை",
    safeHandoff: "பாதுகாப்பான ஒப்படைப்பு சரிபார்ப்பு",
    twoPersonRule: "இரு அலுவலர் ஒப்புதல் கட்டாயம்",
    assistedMatching: "வழக்கு ஒப்பீட்டு உதவி",
    noSmartphone: "காகித சீட்டு (ஸ்மார்ட்போன் இன்றி)",
    consentWithdrawal: "ஒப்புதலைத் திரும்பப் பெறுக",
  },
};

export function getTranslation(lang: LanguageCode = "en"): TranslationDictionary {
  return translations[lang] || translations.en;
}
