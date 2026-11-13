export type Locale = "en" | "bn";

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    // Brand & App
    appName: "AstroGuard",
    appSubtitle: "Space Health Access Gateway",
    astronautConsole: "Astronaut Console",
    missionConsole: "Mission Console",
    medicalOpsHub: "Medical Operations Hub",
    flightSurgeon: "Flight Surgeon",
    missionControl: "Mission Control",
    missionOpsDirector: "Mission Operations Director",
    continuousMonitoring: "Continuous physiological monitoring, nutrition telemetry & flight surgeon uplink",
    signOut: "Sign Out",
    emergencySos: "EMERGENCY SOS",
    tlsCertified: "TLS 1.3 Certified Session Gateway",
    credentials: "Demo Credentials",

    // Gateway / Login
    gatewayTitle: "AstroGuard Space Health Access Gateway",
    gatewaySubtitle: "Select a demo role or sign in with exposed credentials",
    oneClickProfiles: "1-CLICK DEMO PROFILES (CREDENTIALS PRE-LOADED)",
    operatorEmail: "OPERATOR EMAIL",
    accessPasskey: "ACCESS PASSKEY",
    signInTo: "SIGN IN TO",
    emailPlaceholder: "operator@ares.nasa.gov",
    passkeyPlaceholder: "••••••••••••",
    loginError: "Invalid credentials. Please select one of the exposed demo profiles above.",
    authenticating: "AUTHENTICATING SECURE SESSION...",

    // Roles & Titles
    cdrAmara: "Cdr. Amara Okafor",
    drLin: "Dr. Lin Zhao",
    engRafi: "Eng. Rafi Ahmed",
    drEvelyn: "Dr. Evelyn Vance",
    flightDirector: "Flight Director",
    commanderRole: "Mission Commander",
    surgeonRole: "Flight Surgeon & Science Specialist",
    engineerRole: "Systems & Avionics Engineer",
    chiefSurgeonRole: "Chief Flight Surgeon",
    flightDirectorRole: "Mission Operations Director",

    // Vitals & Metrics
    heartRate: "Heart Rate",
    bloodOxygen: "Blood Oxygen",
    sleepAvg: "Sleep Avg",
    stressIndex: "Stress Index",
    dose30d: "30D Dose",
    rate: "Rate",
    bpm: "BPM",
    baseline: "Baseline",
    restingBaseline: "Resting Baseline",
    elevatedWatch: "Elevated Watch",
    mildExertion: "Mild Exertion",
    tachycardiaAlert: "Tachycardia Alert",
    optimalDiffusion: "Optimal Diffusion",
    marginalDiffusion: "Marginal Diffusion",
    hypoxicAlert: "Hypoxic Alert",
    deficitWatch: "Deficit Watch",
    optimalRest: "Optimal Rest",
    rollingNight: "3-Night Rolling",
    elevatedStrain: "Elevated Strain",
    autonomicBalance: "Autonomic Balance",
    speSurgeWatch: "SPE Surge Watch",
    gcrBaseline: "Nominal GCR Baseline",
    bloodPressure: "Blood Pressure",
    respirationTemp: "Respiration / Temp",
    normothermic: "Normothermic",
    thermalDrift: "Thermal Drift",

    // ECG & Scope
    ecgLead2: "ECG · LEAD II (50 mm/s)",
    normalSinusRhythm: "Normal Sinus Rhythm",
    sinusTachycardia: "Sinus Tachycardia",
    sinusBradycardia: "Sinus Bradycardia",

    // Tabs & Navigation
    navTelemetry: "Mission Telemetry",
    navAiCopilot: "AI Health Copilot",
    navTeleHealth: "Doctor Tele-Health",
    navBioLink: "Bio-Link (IoT Wearables)",
    tabMedical: "Clinical Telemetry",
    tabChat: "Tele-Health",
    tabFleet: "IoT Wearables",

    // Macro & Metabolic HUD
    macroHudTitle: "02 Macro & Metabolic Energy HUD",
    macroHudSubtitle: "Target vs Consumed (24H Window)",
    protein: "Protein",
    healthyFats: "Healthy Fats",
    fiber: "Fiber",
    water: "Water",
    energyReserve: "Energy · Basal Metabolic Reserve",
    remaining: "Remaining",
    hydrationIndex: "Tissue Hydration Index",
    metabolicNominal: "METABOLIC NOMINAL",
    calorieDeficit: "CALORIE DEFICIT",
    metabolicPeak: "METABOLIC PEAK",

    // Micro-Array Assay
    biomarkerTitle: "03 Micro-Array Assay · Biomarker Profiling",
    biomarkerSubtitle: "Mass Spectrometry · Nominal",
    keyVitamins: "Key Vitamins (A, B, C, D3, E, K)",
    essentialMinerals: "Essential Minerals (Fe, Ca, Mg, Zn, K)",
    statusActive: "ACTIVE",
    statusOptimal: "OPTIMAL",
    statusDeficit: "DEFICIT",
    statusWatch: "WATCH",
    statusActiveDefense: "ACTIVE DEFENSE",
    statusOk: "OK",

    // RFID Galley Scanner
    rfidScannerTitle: "04 RFID Space-Meal Scanner",
    rfidScannerSubtitle: "Galley Nutrition Automation Stream",
    packsScanned: "packs scanned today",
    triggerRfid: "TRIGGER RFID",
    scanning: "LOGGING RFID...",
    nutrientStream: "Autonomous Nutrient Stream",

    // 24H Timeline
    timelineTitle: "24H Telemetry Timeline · Heart Rate & Glucose",
    glucose: "Glucose (mg/dL)",
    mealEvents: "Meal Events",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",

    // BioScan 2D Anatomical
    bioScanTitle: "Bio-Scan 2D Anatomical Telemetry",
    activeSensorTelemetry: "Active Sensor Telemetry",
    scoping: "Scoping",
    neuroNode: "Neuro / Cranial Activity",
    pulmonaryNode: "Pulmonary & SpO₂ Exchange",
    cardiacNode: "Cardiac & Hemodynamics",
    metabolicNode: "Metabolic / Interstitial Glucose",
    dosimetryNode: "Dosimetry & Cellular Radiation",
    rightLimbNode: "Right Limb Actigraphy & Tone",
    leftLimbNode: "Left Limb Actigraphy & Tone",

    // Notifications
    notificationsTitle: "Notifications & Alarms",
    surgeonTransmissions: "Surgeon Transmissions",
    noNotifications: "No medical transmissions or telemetry alarms. Status nominal.",
    criticalAlarm: "CRITICAL ALARM",
    telemetryWatch: "TELEMETRY WATCH",
    live: "Live",

    // Doctor Hub
    assignedAstronauts: "Assigned Astronauts",
    advisoryWatchCount: "Advisory Watch",
    criticalTriageCount: "Critical Triage",
    activeSignalsCount: "Active Signals",
    fleetRoster: "Ares-1 Flight Roster",
    physiologicalDrift: "Physiological Drift",
    immediateReview: "Immediate Review",
    ruleSosAlarms: "Rule + SOS Alarms",
    assignedRoster: "Assigned Astronaut Roster",
    selectToScope: "Select to Scope",
    liveCardioTelemetry: "Live Cardiovascular Telemetry",
    clinicalTriageTitle: "Clinical Triage & Anomaly Signals",
    clinicalTriageSubtitle: "Prioritized telemetry alarms and astronaut emergency signals",
    filterAll: "All",
    filterCritical: "Critical",
    filterWarning: "Warning",
    voiceCall: "Voice Call",
    videoUplink: "Video Uplink",
    flagToControl: "Flag to Control",
    flaggedToControl: "✓ Flagged to Control",
    encryptedChannelActive: "Encrypted Hab-Station Channel Active",
    noConsultMessages: "No consultation messages logged yet with",
    assignedTeleHealthChannels: "Assigned Tele-Health Channels",
    directFlightSurgeonChannel: "Direct Flight Surgeon Channel",
    sendAdvisory: "Send Advisory",
    newMsg: "new",

    // Tele-Health Consultations
    startVoiceCall: "Voice Call",
    startVideoUplink: "Video Uplink",
    sosDispatch: "SOS",
    voiceNote: "Voice Note",
    typeConsultPlaceholder: "Type consultation message to Flight Surgeon...",
    send: "Send",
    medicalChannelOpenWith: "Medical Tele-Health channel open with",
    sendVoiceToConsult: "Send a message or voice note below to consult the Flight Surgeon.",
    voiceDispatch: "Voice Dispatch",
    playingAudio: "PLAYING AUDIO",

    // AI Health Copilot
    aiCopilotTitle: "AstroGuard Physiological Copilot",
    aiCopilotSubtitle: "Synthesizing verified telemetry snapshot. Rules decide, AI advises.",
    generateHealthBrief: "Generate Health Brief",
    briefGenerating: "Synthesizing...",
    askAboutVitals: "ASK MEDICAL ASSISTANT ABOUT YOUR VITALS",
    askPlaceholder: "Ask about your vitals, sleep deficit, or exercise protocol...",
    noBriefYet: "No brief generated yet. Click \"Generate Health Brief\" above to synthesize current telemetry.",
    you: "YOU",
    medicalAssistant: "MEDICAL ASSISTANT",

    // Call Modal
    encryptedMedicalConsult: "ENCRYPTED MEDICAL TELE-PRESENCE",
    recActive: "REC · 14.8 Mbps",
    videoMuted: "VIDEO MUTED BY OPERATOR",
    cameraActive: "ENCRYPTED HD CAMERA STREAM ACTIVE",
    unmuteMic: "Unmute Mic",
    muteMic: "Mute Mic",
    enableVideo: "Enable Video",
    disableVideo: "Disable Video",
    terminateCall: "Terminate Call",

    // Bio-Link IoT Wearables
    bioLinkTitle: "Bio-Link IoT Wearable Mesh Network",
    bioLinkSubtitle: "Continuous Medical Telemetry & Sensor Integration",
    connectedSensors: "Connected Sensors",
    aggregateSampling: "Aggregate Sampling Rate",
    meshIntegrity: "BLE / USB Mesh Integrity",
    pinPairingActive: "PIN Pairing & Auth Active",
    statusOnline: "ONLINE",
    statusOffline: "OFFLINE",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    samplingRate: "Sampling Rate:",
    battery: "Battery:",
    protocol: "Protocol:",
    latency: "Latency:",

    // SOS Banner
    sosBannerMsg: "CRITICAL EMERGENCY SOS DISPATCHED TO FLIGHT SURGEON & MISSION CONTROL! Telemetry priority elevated.",

    // Language
    language: "Language",
    english: "English",
    bengali: "বাংলা",
  },
  bn: {
    // Brand & App
    appName: "অ্যাস্ট্রোগার্ড",
    appSubtitle: "স্পেস হেলথ অ্যাক্সেস গেটওয়ে",
    astronautConsole: "মহাকাশচারী কনসোল",
    missionConsole: "মিশন কনসোল",
    medicalOpsHub: "মেডিকেল অপারেশন হাব",
    flightSurgeon: "ফ্লাইট সার্জন",
    missionControl: "মিশন কন্ট্রোল",
    missionOpsDirector: "মিশন অপারেশনস ডিরেক্টর",
    continuousMonitoring: "ক্রমাগত শারীরবৃত্তীয় পর্যবেক্ষণ, পুষ্টি টেলিমেট্রি এবং ফ্লাইট সার্জন সংযোগ",
    signOut: "সাইন আউট",
    emergencySos: "জরুরি এসওএস",
    tlsCertified: "TLS ১.৩ সার্টিফাইড সেশন গেটওয়ে",
    credentials: "লগইন তথ্য",

    // Gateway / Login
    gatewayTitle: "অ্যাস্ট্রোগার্ড স্পেস হেলথ অ্যাক্সেস গেটওয়ে",
    gatewaySubtitle: "একটি ডেমো ভূমিকা নির্বাচন করুন অথবা নির্ধারিত লগইন তথ্য ব্যবহার করুন",
    oneClickProfiles: "১-ক্লিকে ডেমো প্রোফাইল (তথ্য স্বয়ংক্রিয় লোড)",
    operatorEmail: "অপারেটর ইমেইল",
    accessPasskey: "অ্যাক্সেস পাসকি",
    signInTo: "লগইন করুন:",
    emailPlaceholder: "operator@ares.nasa.gov",
    passkeyPlaceholder: "••••••••••••",
    loginError: "ভুল তথ্য প্রদান করা হয়েছে। অনুগ্রহ করে উপরের ডেমো প্রোফাইল নির্বাচন করুন।",
    authenticating: "নিরাপদ সেশন যাচাই করা হচ্ছে...",

    // Roles & Titles
    cdrAmara: "কমান্ডার আমারা ওকাফোর",
    drLin: "ড. লিন ঝাও",
    engRafi: "ইঞ্জিনিয়ার রাফি আহমেদ",
    drEvelyn: "ড. এভলিন ভ্যান্স",
    flightDirector: "ফ্লাইট ডিরেক্টর",
    commanderRole: "মিশন কমান্ডার",
    surgeonRole: "ফ্লাইট সার্জন ও বিজ্ঞান বিশেষজ্ঞ",
    engineerRole: "সিস্টেমস ও অ্যাভিওনিক্স ইঞ্জিনিয়ার",
    chiefSurgeonRole: "প্রধান ফ্লাইট সার্জন",
    flightDirectorRole: "মিশন অপারেশনস ডিরেক্টর",

    // Vitals & Metrics
    heartRate: "হৃদস্পন্দন",
    bloodOxygen: "রক্তের অক্সিজেন",
    sleepAvg: "গড় ঘুম",
    stressIndex: "স্ট্রেস সূচক",
    dose30d: "৩০ দিনের ডোজ",
    rate: "হার",
    bpm: "বিপিএম",
    baseline: "বেসলাইন",
    restingBaseline: "বিশ্রামরত বেসলাইন",
    elevatedWatch: "উচ্চ নজরদারি",
    mildExertion: "হালকা শারীরিক চাপ",
    tachycardiaAlert: "ট্যাকিকার্ডিয়া সতর্কতা",
    optimalDiffusion: "অনুকূল ব্যাপন",
    marginalDiffusion: "প্রান্তিক ব্যাপন",
    hypoxicAlert: "হাইপোক্সিক সতর্কতা",
    deficitWatch: "ঘাটতি নজরদারি",
    optimalRest: "পর্যাপ্ত বিশ্রাম",
    rollingNight: "৩-রাতের গড়",
    elevatedStrain: "উচ্চ চাপ",
    autonomicBalance: "স্বয়ংক্রিয় ভারসাম্য",
    speSurgeWatch: "সৌর বিকিরণ বৃদ্ধি",
    gcrBaseline: "স্বাভাবিক বিকিরণ বেসলাইন",
    bloodPressure: "রক্তচাপ",
    respirationTemp: "শ্বাসপ্রশ্বাস / তাপমাত্রা",
    normothermic: "স্বাভাবিক তাপমাত্রা",
    thermalDrift: "তাপমাত্রার তারতম্য",

    // ECG & Scope
    ecgLead2: "ইসিজি · লিড II (৫০ মিমি/সেকেন্ড)",
    normalSinusRhythm: "স্বাভাবিক সাইনাস ছন্দ",
    sinusTachycardia: "সাইনাস ট্যাকিকার্ডিয়া",
    sinusBradycardia: "সাইনাস ব্র্যাডিকার্ডিয়া",

    // Tabs & Navigation
    navTelemetry: "মিশন টেলিমেট্রি",
    navAiCopilot: "এআই স্বাস্থ্য সহকারী",
    navTeleHealth: "ডাক্তার টেলি-হেলথ",
    navBioLink: "বায়ো-লিংক (আইওটি ডিভাইস)",
    tabMedical: "ক্লিনিক্যাল টেলিমেট্রি",
    tabChat: "টেলি-হেলথ",
    tabFleet: "আইওটি পরিধানযোগ্য",

    // Macro & Metabolic HUD
    macroHudTitle: "০২ ম্যাক্রো ও বিপাকীয় শক্তি পর্যবেক্ষণ",
    macroHudSubtitle: "লক্ষ্য বনাম গ্রহণ (২৪ ঘণ্টার সময়সীমা)",
    protein: "প্রোটিন",
    healthyFats: "স্বাস্থ্যকর ফ্যাট",
    fiber: "ফাইবার",
    water: "পানি",
    energyReserve: "শক্তি · মৌলিক বিপাকীয় সঞ্চয়",
    remaining: "অবশিষ্ট",
    hydrationIndex: "টিস্যু হাইড্রেশন সূচক",
    metabolicNominal: "বিপাকীয় স্বাভাবিক",
    calorieDeficit: "ক্যালোরি ঘাটতি",
    metabolicPeak: "শীর্ষ বিপাকীয় অবস্থা",

    // Micro-Array Assay
    biomarkerTitle: "০৩ মাইক্রো-অ্যারে পরীক্ষা · বায়োমার্কার প্রোফাইলিং",
    biomarkerSubtitle: "ম্যাস স্পেকট্রোমেট্রি · স্বাভাবিক",
    keyVitamins: "প্রধান ভিটামিনসমূহ (A, B, C, D3, E, K)",
    essentialMinerals: "অত্যাবশ্যকীয় খনিজসমূহ (Fe, Ca, Mg, Zn, K)",
    statusActive: "সক্রিয়",
    statusOptimal: "অনুকূল",
    statusDeficit: "ঘাটতি",
    statusWatch: "নজরদারি",
    statusActiveDefense: "প্রতিরোধ সক্রিয়",
    statusOk: "সঠিক",

    // RFID Galley Scanner
    rfidScannerTitle: "০৪ আরএফআইডি স্পেস-মিল স্ক্যানার",
    rfidScannerSubtitle: "গ্যালি পুষ্টি অটোমেশন স্ট্রিম",
    packsScanned: "টি প্যাক আজ স্ক্যান করা হয়েছে",
    triggerRfid: "আরএফআইডি স্ক্যান করুন",
    scanning: "আরএফআইডি লগ হচ্ছে...",
    nutrientStream: "স্বয়ংক্রিয় পুষ্টি স্ট্রিম",

    // 24H Timeline
    timelineTitle: "২৪ ঘণ্টার টেলিমেট্রি সময়রেখা · হৃদস্পন্দন ও গ্লুকোজ",
    glucose: "গ্লুকোজ (মিগ্রা/ডেসিলিটার)",
    mealEvents: "খাবারের সময়",
    breakfast: "সকালের নাস্তা",
    lunch: "দুপুরের খাবার",
    dinner: "রাতের খাবার",

    // BioScan 2D Anatomical
    bioScanTitle: "বায়ো-স্ক্যান ২ডি শারীরিক টেলিমেট্রি",
    activeSensorTelemetry: "সক্রিয় সেন্সর টেলিমেট্রি",
    scoping: "পর্যবেক্ষণে",
    neuroNode: "স্নায়ু ও মস্তিষ্কের কার্যকলাপ",
    pulmonaryNode: "ফুসফুস ও SpO₂ বিনিময়",
    cardiacNode: "হৃদযন্ত্র ও রক্তসংবহন",
    metabolicNode: "বিপাকীয় / আন্তঃকোষীয় গ্লুকোজ",
    dosimetryNode: "ডসিমেট্রি ও কোষীয় বিকিরণ",
    rightLimbNode: "ডান অঙ্গের গতিবিধি ও পেশির টান",
    leftLimbNode: "বাম অঙ্গের গতিবিধি ও পেশির টান",

    // Notifications
    notificationsTitle: "বিজ্ঞপ্তি ও অ্যালার্ম",
    surgeonTransmissions: "সার্জন বার্তা",
    noNotifications: "কোনো জরুরি বার্তা বা অ্যালার্ম নেই। অবস্থা স্বাভাবিক।",
    criticalAlarm: "জরুরি অ্যালার্ম",
    telemetryWatch: "টেলিমেট্রি নজরদারি",
    live: "সরাসরি",

    // Doctor Hub
    assignedAstronauts: "নির্ধারিত মহাকাশচারী",
    advisoryWatchCount: "পরামর্শমূলক নজরদারি",
    criticalTriageCount: "জরুরি ট্রায়াজ",
    activeSignalsCount: "সক্রিয় সংকেত",
    fleetRoster: "অ্যারিস-১ ফ্লাইট তালিকা",
    physiologicalDrift: "শারীরবৃত্তীয় পরিবর্তন",
    immediateReview: "অবিলম্বে পর্যালোচনা প্রয়োজন",
    ruleSosAlarms: "রুল + এসওএস অ্যালার্ম",
    assignedRoster: "মহাকাশচারীদের রোস্টার",
    selectToScope: "পর্যবেক্ষণের জন্য নির্বাচন করুন",
    liveCardioTelemetry: "সরাসরি কার্ডিওভাসকুলার টেলিমেট্রি",
    clinicalTriageTitle: "ক্লিনিক্যাল ট্রায়াজ ও অস্বাভাবিক সংকেতসমূহ",
    clinicalTriageSubtitle: "অগ্রাধিকারযুক্ত টেলিমেট্রি অ্যালার্ম ও মহাকাশচারীদের জরুরি সংকেত",
    filterAll: "সকল",
    filterCritical: "জরুরি",
    filterWarning: "সতর্কতা",
    voiceCall: "ভয়েস কল",
    videoUplink: "ভিডিও সংযোগ",
    flagToControl: "মিশন কন্ট্রোলে রিপোর্ট",
    flaggedToControl: "✓ কন্ট্রোলে রিপোর্ট সম্পন্ন",
    encryptedChannelActive: "সুরক্ষিত হাব-স্টেশন চ্যানেল সক্রিয়",
    noConsultMessages: "এর সাথে কোনো পরামর্শ বার্তা নেই",
    assignedTeleHealthChannels: "নির্ধারিত টেলি-হেলথ চ্যানেলসমূহ",
    directFlightSurgeonChannel: "সরাসরি ফ্লাইট সার্জন চ্যানেল",
    sendAdvisory: "পরামর্শ পাঠান",
    newMsg: "নতুন",

    // Tele-Health Consultations
    startVoiceCall: "ভয়েস কল",
    startVideoUplink: "ভিডিও সংযোগ",
    sosDispatch: "এসওএস",
    voiceNote: "ভয়েস নোট",
    typeConsultPlaceholder: "ফ্লাইট সার্জনের উদ্দেশ্যে বার্তা লিখুন...",
    send: "পাঠান",
    medicalChannelOpenWith: "মেডিকেল টেলি-হেলথ সংযোগ সক্রিয়:",
    sendVoiceToConsult: "পরামর্শের জন্য নিচের বক্সে বার্তা বা ভয়েস নোট পাঠান।",
    voiceDispatch: "ভয়েস বার্তা",
    playingAudio: "অডিও বাজছে",

    // AI Health Copilot
    aiCopilotTitle: "অ্যাস্ট্রোগার্ড শারীরবৃত্তীয় কো-পাইলট",
    aiCopilotSubtitle: "যাচাইকৃত টেলিমেট্রি বিশ্লেষণ। নিয়ম নির্ধারণ করে, এআই পরামর্শ দেয়।",
    generateHealthBrief: "স্বাস্থ্য বিবরণ তৈরি করুন",
    briefGenerating: "বিশ্লেষণ হচ্ছে...",
    askAboutVitals: "আপনার স্বাস্থ্য ও লক্ষণ সম্পর্কে জিজ্ঞাসা করুন",
    askPlaceholder: "আপনার হৃদস্পন্দন, ঘুম বা ব্যায়াম সম্পর্কে প্রশ্ন করুন...",
    noBriefYet: "এখনো কোনো বিবরণ তৈরি হয়নি। বর্তমান টেলিমেট্রি বিশ্লেষণ করতে \"স্বাস্থ্য বিবরণ তৈরি করুন\" বাটনে ক্লিক করুন।",
    you: "আপনি",
    medicalAssistant: "মেডিকেল সহকারী",

    // Call Modal
    encryptedMedicalConsult: "সুরক্ষিত মেডিকেল টেলি-কনফারেন্স",
    recActive: "রেকর্ড · ১৪.৮ এমবিপিএস",
    videoMuted: "অপারেটর ভিডিও বন্ধ রেখেছেন",
    cameraActive: "সুরক্ষিত এইচডি ক্যামেরা স্ট্রিম সক্রিয়",
    unmuteMic: "মাইক চালু করুন",
    muteMic: "মাইক বন্ধ করুন",
    enableVideo: "ভিডিও চালু করুন",
    disableVideo: "ভিডিও বন্ধ করুন",
    terminateCall: "কল সমাপ্ত করুন",

    // Bio-Link IoT Wearables
    bioLinkTitle: "বায়ো-লিংক আইওটি পরিধানযোগ্য নেটওয়ার্ক",
    bioLinkSubtitle: "ক্রমাগত মেডিকেল টেলিমেট্রি ও সেন্সর ইন্টিগ্রেশন",
    connectedSensors: "সংযুক্ত সেন্সরসমূহ",
    aggregateSampling: "মোট স্যাম্পলিং রেট",
    meshIntegrity: "BLE / USB মেশ অখণ্ডতা",
    pinPairingActive: "পিন পেয়ারিং ও নিরাপত্তা সক্রিয়",
    statusOnline: "অনলাইন",
    statusOffline: "অফলাইন",
    reconnect: "পুনরায় সংযুক্ত",
    disconnect: "বিচ্ছিন্ন করুন",
    samplingRate: "স্যাম্পলিং রেট:",
    battery: "ব্যাটারি:",
    protocol: "প্রোটোকল:",
    latency: "লেটেন্সি:",

    // SOS Banner
    sosBannerMsg: "জরুরি এসওএস সংকেত ফ্লাইট সার্জন ও মিশন কন্ট্রোলে পাঠানো হয়েছে! টেলিমেট্রি অগ্রাধিকার বাড়ানো হয়েছে।",

    // Language
    language: "ভাষা",
    english: "English",
    bengali: "বাংলা",
  },
};

/** Convert western digits to Bengali digits if locale is Bengali */
export function formatNumber(num: number | string, locale: Locale): string {
  const str = String(num);
  if (locale !== "bn") return str;
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}

/** Translate key to string with fallback */
export function translate(
  key: string,
  locale: Locale,
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      const valStr = typeof v === "number" ? formatNumber(v, locale) : String(v);
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), valStr);
    });
  }

  return text;
}
