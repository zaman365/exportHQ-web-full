export const supportedLocales = ["bn", "en"] as const;
export type ExportHqLocale = typeof supportedLocales[number];

const english = {
  "language.name": "English",
  "language.switch": "Language",
  "data.low_mode": "Low-data mode",
  "data.standard_mode": "Standard data mode",
  "workspace.home": "Home",
  "workspace.passport": "Business Passport",
  "workspace.lane": "Export Lane",
  "workspace.readiness": "Readiness plan",
  "workspace.evidence": "Evidence vault",
  "workspace.tasks": "Tasks",
  "workspace.verification": "Business verification",
  "action.save": "Save",
  "action.continue": "Continue",
  "action.print": "Print action pack",
  "action.retry": "Try again",
  "state.saved": "Saved securely",
  "state.conflict": "This record changed elsewhere. Review the latest version before saving again.",
  "state.offline": "Connection interrupted. Your file was not marked uploaded.",
  "pilot.title": "Private Alpha",
  "pilot.scope": "Passport, one Export Lane, readiness, evidence, tasks, verification and clearly scoped managed work.",
  "pilot.no_unlimited": "Managed work has a named owner, scope and service level; it is not unlimited specialist access.",
  "pilot.internal_only": "Internal/synthetic Alpha only. Real customer data and public checkout remain disabled.",
  "pilot.not_enrolled": "This organization is not enrolled in the invitation-only Alpha.",
  "pilot.agreement": "Participation agreement",
  "pilot.agreement_exact": "Only this exact version and content hash can be accepted.",
  "pilot.agreement_confirm": "I have read this exact agreement and accept it for this organization.",
  "pilot.agreement_accept": "Accept exact agreement",
  "pilot.activation_pending": "Export HQ operations must activate the accepted participation and assign a named support owner.",
  "pilot.pass": "First Shipment Pass",
  "pilot.price_hypothesis": "Manual Alpha price hypothesis",
  "pilot.no_checkout": "There is no public checkout. Grants, extensions and conversion credits are applied manually and audited.",
  "pilot.support": "Named support cases",
  "pilot.support_empty": "No managed-work case has been assigned.",
  "pilot.support_owner": "Named owner",
  "pilot.support_scope": "Written scope",
  "pilot.support_sla": "Response target",
  "pilot.support_minutes": "Recorded support",
  "pilot.action_pack": "Alpha action pack",
  "pilot.outcomes_pending": "Cohort outcome thresholds remain unverified until real participant evidence exists.",
  "plain.hs_code": "Product classification code (HS code)",
  "plain.incoterm": "Delivery responsibility term (Incoterm)",
  "plain.rls": "Tenant database isolation",
  "evidence.quarantine": "Private scan waiting area",
  "evidence.clean": "Scan passed",
  "evidence.rejected": "File rejected safely"
} as const;

export type TranslationKey = keyof typeof english;

const bangla: Record<TranslationKey, string> = {
  "language.name": "বাংলা",
  "language.switch": "ভাষা",
  "data.low_mode": "কম-ডেটা মোড",
  "data.standard_mode": "স্ট্যান্ডার্ড ডেটা মোড",
  "workspace.home": "হোম",
  "workspace.passport": "ব্যবসা পাসপোর্ট",
  "workspace.lane": "রপ্তানি লেন",
  "workspace.readiness": "প্রস্তুতি পরিকল্পনা",
  "workspace.evidence": "প্রমাণ ভল্ট",
  "workspace.tasks": "কাজ",
  "workspace.verification": "ব্যবসা যাচাই",
  "action.save": "সংরক্ষণ করুন",
  "action.continue": "এগিয়ে যান",
  "action.print": "কর্মপরিকল্পনা প্রিন্ট করুন",
  "action.retry": "আবার চেষ্টা করুন",
  "state.saved": "নিরাপদে সংরক্ষিত",
  "state.conflict": "রেকর্ডটি অন্য জায়গায় পরিবর্তিত হয়েছে। আবার সংরক্ষণের আগে সর্বশেষ সংস্করণ দেখুন।",
  "state.offline": "সংযোগ বিচ্ছিন্ন হয়েছে। ফাইলটি আপলোড হয়েছে বলে চিহ্নিত করা হয়নি।",
  "pilot.title": "প্রাইভেট আলফা",
  "pilot.scope": "ব্যবসা পাসপোর্ট, একটি রপ্তানি লেন, প্রস্তুতি, প্রমাণ, কাজ, যাচাই এবং স্পষ্টভাবে নির্ধারিত ম্যানেজড কাজ।",
  "pilot.no_unlimited": "ম্যানেজড কাজের নির্দিষ্ট দায়িত্বশীল ব্যক্তি, পরিধি ও সেবা-সময়সীমা থাকে; এটি সীমাহীন বিশেষজ্ঞ সহায়তা নয়।",
  "pilot.internal_only": "শুধু অভ্যন্তরীণ/সিন্থেটিক আলফা। বাস্তব গ্রাহক ডেটা ও পাবলিক চেকআউট বন্ধ আছে।",
  "pilot.not_enrolled": "এই প্রতিষ্ঠানটি আমন্ত্রণ-ভিত্তিক আলফায় অন্তর্ভুক্ত নয়।",
  "pilot.agreement": "অংশগ্রহণ চুক্তি",
  "pilot.agreement_exact": "শুধু এই নির্দিষ্ট সংস্করণ ও কনটেন্ট হ্যাশ গ্রহণ করা যাবে।",
  "pilot.agreement_confirm": "আমি এই নির্দিষ্ট চুক্তিটি পড়েছি এবং এই প্রতিষ্ঠানের পক্ষে গ্রহণ করছি।",
  "pilot.agreement_accept": "নির্দিষ্ট চুক্তি গ্রহণ করুন",
  "pilot.activation_pending": "Export HQ অপারেশনসকে গৃহীত অংশগ্রহণ সক্রিয় করে একজন দায়িত্বশীল সহায়তা মালিক নিয়োগ করতে হবে।",
  "pilot.pass": "ফার্স্ট শিপমেন্ট পাস",
  "pilot.price_hypothesis": "ম্যানুয়াল আলফা মূল্য ধারণা",
  "pilot.no_checkout": "কোনো পাবলিক চেকআউট নেই। গ্রান্ট, মেয়াদ বৃদ্ধি ও রূপান্তর ক্রেডিট ম্যানুয়ালি এবং অডিটসহ প্রয়োগ করা হয়।",
  "pilot.support": "দায়িত্বশীল সহায়তা কেস",
  "pilot.support_empty": "কোনো ম্যানেজড-ওয়ার্ক কেস নিয়োগ করা হয়নি।",
  "pilot.support_owner": "দায়িত্বশীল ব্যক্তি",
  "pilot.support_scope": "লিখিত পরিধি",
  "pilot.support_sla": "সাড়া দেওয়ার লক্ষ্য",
  "pilot.support_minutes": "রেকর্ড করা সহায়তা",
  "pilot.action_pack": "আলফা কর্মপরিকল্পনা",
  "pilot.outcomes_pending": "বাস্তব অংশগ্রহণকারীর প্রমাণ না পাওয়া পর্যন্ত কোহর্ট ফলাফলের সীমাগুলো যাচাই হয়নি।",
  "plain.hs_code": "পণ্যের শ্রেণিবিন্যাস কোড (HS কোড)",
  "plain.incoterm": "ডেলিভারি দায়িত্বের শর্ত (Incoterm)",
  "plain.rls": "প্রতিষ্ঠানভিত্তিক ডেটাবেস সুরক্ষা",
  "evidence.quarantine": "ব্যক্তিগত স্ক্যান অপেক্ষা এলাকা",
  "evidence.clean": "স্ক্যান সফল",
  "evidence.rejected": "ফাইল নিরাপদে প্রত্যাখ্যাত"
};

const catalogs: Record<ExportHqLocale, Readonly<Record<TranslationKey, string>>> = { bn: bangla, en: english };

export function resolveLocale(value: string | null | undefined, originCountryCode?: string | null): ExportHqLocale {
  if (value === "bn" || value === "en") return value;
  return originCountryCode?.toUpperCase() === "BD" ? "bn" : "en";
}

export function translate(locale: ExportHqLocale, key: TranslationKey): string {
  return catalogs[locale][key];
}

export function translationCatalog(locale: ExportHqLocale): Readonly<Record<TranslationKey, string>> {
  return catalogs[locale];
}
