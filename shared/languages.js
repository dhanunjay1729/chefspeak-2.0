export const DEFAULT_LANGUAGE = 'indian_english';

export const LANGUAGES = [
  { code: 'indian_english', name: 'Indian English', promptName: 'Indian English', voice: 'en-IN-Chirp-HD-O' },
  { code: 'hindi', name: 'Hindi', promptName: 'Hindi in Devanagari script', voice: 'hi-IN-Chirp3-HD-Leda' },
  { code: 'telugu', name: 'Telugu', promptName: 'Telugu in Telugu script', voice: 'te-IN-Chirp3-HD-Leda' },
  { code: 'tamil', name: 'Tamil', promptName: 'Tamil in Tamil script', voice: 'ta-IN-Chirp3-HD-Leda' },
  { code: 'kannada', name: 'Kannada', promptName: 'Kannada in Kannada script', voice: 'kn-IN-Chirp3-HD-Leda' },
  { code: 'malayalam', name: 'Malayalam', promptName: 'Malayalam in Malayalam script', voice: 'ml-IN-Chirp3-HD-Leda' },
  { code: 'marathi', name: 'Marathi', promptName: 'Marathi in Devanagari script', voice: 'mr-IN-Chirp3-HD-Leda' },
  { code: 'gujarati', name: 'Gujarati', promptName: 'Gujarati in Gujarati script', voice: 'gu-IN-Chirp3-HD-Leda' },
  { code: 'bengali', name: 'Bengali', promptName: 'Bengali in Bengali script', voice: 'bn-IN-Chirp3-HD-Leda' },
  { code: 'punjabi', name: 'Punjabi', promptName: 'Punjabi in Gurmukhi script', voice: 'pa-IN-Chirp3-HD-Leda' },
  { code: 'us_english', name: 'US English', promptName: 'American English', voice: 'en-US-Chirp3-HD-Aoede' },
  { code: 'uk_english', name: 'UK English', promptName: 'British English', voice: 'en-GB-Chirp3-HD-Leda' },
  { code: 'spanish', name: 'Spanish', promptName: 'Spanish', voice: 'es-ES-Chirp3-HD-Leda' },
  { code: 'french', name: 'French', promptName: 'French', voice: 'fr-FR-Chirp3-HD-Leda' },
  { code: 'german', name: 'German', promptName: 'German', voice: 'de-DE-Chirp3-HD-Leda' },
  { code: 'italian', name: 'Italian', promptName: 'Italian', voice: 'it-IT-Chirp3-HD-Leda' },
  { code: 'japanese', name: 'Japanese', promptName: 'Japanese in Japanese script', voice: 'ja-JP-Chirp3-HD-Achernar' },
  { code: 'chinese', name: 'Chinese (Mandarin)', promptName: 'Mandarin Chinese in Simplified Chinese characters', voice: 'cmn-CN-Chirp3-HD-Leda' },
  { code: 'russian', name: 'Russian', promptName: 'Russian in Cyrillic script', voice: 'ru-RU-Chirp3-HD-Leda' },
];

const byCode = new Map(LANGUAGES.map(language => [language.code, language]));
const NON_LATIN_LANGUAGES = new Set([
  'hindi', 'telugu', 'tamil', 'kannada', 'malayalam', 'marathi',
  'gujarati', 'bengali', 'punjabi', 'japanese', 'chinese', 'russian',
]);

export function getLanguage(value) {
  if (value == null || value === '') return byCode.get(DEFAULT_LANGUAGE);
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  return byCode.get(code === 'english' ? DEFAULT_LANGUAGE : code) || null;
}

export function languageInstruction(language) {
  const avoidEnglish = language.code.endsWith('_english') ? '' : ' Do not answer in English.';
  const nativeScript = NON_LATIN_LANGUAGES.has(language.code) ? ' Use the specified native script rather than Latin transliteration.' : '';
  return `Write all human-readable recipe content in ${language.promptName}.${avoidEnglish}${nativeScript} Keep JSON property names, type values and ingredient IDs in English. Do not copy English example text into the answer.`;
}

export function languageForNewRecipe(preferredLanguage, urlLanguage) {
  return (urlLanguage ? getLanguage(urlLanguage)?.code : null) || getLanguage(preferredLanguage)?.code || DEFAULT_LANGUAGE;
}
