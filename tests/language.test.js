import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, LANGUAGES, getLanguage, languageForNewRecipe, languageInstruction } from '../shared/languages.js';

test('each settings language has a unique code, readable prompt name and matching voice locale', () => {
  assert.equal(LANGUAGES.length, 19);
  assert.equal(new Set(LANGUAGES.map(language => language.code)).size, LANGUAGES.length);
  for (const language of LANGUAGES) {
    assert.equal(getLanguage(language.code), language);
    assert.match(language.promptName, /[A-Za-z]/);
    assert.match(language.voice, /^[a-z]{2,3}-[A-Z]{2}-Chirp(?:3)?-HD-/);
    assert.ok(languageInstruction(language).includes(language.promptName));
  }
});

test('legacy English and mixed-case saved settings resolve to the intended voice', () => {
  assert.equal(getLanguage('English')?.code, DEFAULT_LANGUAGE);
  assert.equal(getLanguage('Indian_english')?.code, DEFAULT_LANGUAGE);
  assert.equal(getLanguage('US_english')?.voice, 'en-US-Chirp3-HD-Aoede');
  assert.equal(getLanguage('UK_english')?.voice, 'en-GB-Chirp3-HD-Leda');
  assert.equal(getLanguage('hindi')?.voice, 'hi-IN-Chirp3-HD-Leda');
  assert.equal(getLanguage('nonsense'), null);
});

test('a new recipe uses the saved setting even when an older cooking session used Indian English', () => {
  assert.equal(languageForNewRecipe('spanish', null), 'spanish');
  assert.equal(languageForNewRecipe('hindi', 'telugu'), 'telugu');
  assert.equal(languageForNewRecipe('french', 'unknown'), 'french');
  assert.equal(languageForNewRecipe(null, null), DEFAULT_LANGUAGE);
  assert.match(languageInstruction(getLanguage('telugu')), /Telugu in Telugu script/);
  assert.match(languageInstruction(getLanguage('telugu')), /Do not answer in English/);
  assert.match(languageInstruction(getLanguage('telugu')), /native script/);
  assert.doesNotMatch(languageInstruction(getLanguage('spanish')), /native script|rather than Latin/);
});
