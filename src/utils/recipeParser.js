// src/utils/recipeParser.js

// Indic + ASCII digit character class (used in step boundary regex)
// Covers: ASCII 0-9, Gujarati ૦-૯, Devanagari (Hindi/Marathi) ०-९,
//         Bengali ০-৯, Tamil ௦-௯, Telugu ౦-౯, Kannada ೦-೯,
//         Malayalam ൦-൯, Arabic-Indic ٠-٩
const INDIC_DIGIT_CLASS =
  '[\\d\u0AE6-\u0AEF\u0966-\u096F\u09E6-\u09EF\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0660-\u0669]';

export class RecipeParser {
  // Matches: "1. ", "1) ", "Step 1:", "૧. ", "१. ", "১. ", "①. " etc.
  static STEP_BOUNDARY = new RegExp(
    `(^|\\n)\\s*(?:Step\\s+)?(${INDIC_DIGIT_CLASS}+)[\\.\\)]\\s*:?[\\s]+`,
    'gmi'
  );

  // TIME_REGEX: Supports English + all 19 supported languages
  static TIME_REGEX =
    new RegExp(
      `(${INDIC_DIGIT_CLASS}+)\\s*(` +
      // Hours
      'hours?|hrs?|hour|घंटा|घंटे|గంట|గంటలు|மணி|மணிநேரம்|ಗಂಟೆ|ಗಂಟೆಗಳು|മണിക്കൂർ|तास|કલાક|ঘণ্টা|ਘੰਟਾ|ਘੰਟੇ|hora|horas|heure|heures|stunde|stunden|ora|ore|時間|小时|鐘頭|час|часа|часов|' +
      // Minutes
      'minutes?|mins?|min|मिनट|నిమిషం|నిమిషాలు|நிமிடம்|நிமிடங்கள்|ನಿಮಿಷ|ನಿಮಿಷಗಳು|മിനിറ്റ്|मिनिट|मिनिटे|મિનિટ|মিনিট|ਮਿੰਟ|minuto|minutos|minute|minutes|minuten|minuti|分|分钟|минута|минуты|минут|' +
      // Seconds
      'seconds?|secs?|sec|सेकंड|సెకను|సెకన్లు|வினாடி|வினாடிகள்|ಸೆಕೆಂಡ್|ಸೆಕೆಂಡುಗಳು|സെക്കൻഡ്|सेकंद|સેકન્ડ|সেকেন্ড|ਸਕਿੰਟ|segundo|segundos|seconde|secondes|sekunde|sekunden|secondi|secondo|秒|секунд|секунды|секунда' +
      ')',
      'i'
    );

  // Parse final text by reusing the streaming extractor with a forced trailing newline
  static parseSteps(fullText) {
    const src = fullText.endsWith('\n') ? fullText : fullText + '\n';
    const { steps } = this.extractStreamSteps(src);
    return steps;
  }

  // Emit steps only when a full line is available (boundary … newline)
  static extractStreamSteps(buffer) {
    const steps = [];
    let cursor = 0;

    while (true) {
      const re = new RegExp(this.STEP_BOUNDARY.source, this._flags(this.STEP_BOUNDARY));
      re.lastIndex = cursor;
      const m = re.exec(buffer);
      if (!m) break;

      // text starts after the matched boundary
      const start = m.index + m[0].length;
      // we only emit when a newline closes the step
      const nl = buffer.indexOf('\n', start);
      if (nl === -1) {
        // no newline yet → keep from boundary; don't emit partials
        return { steps, remaining: buffer.slice(m.index) };
      }

      const line = buffer.slice(start, nl).trim();
      if (line) steps.push(this._enrich(line));
      cursor = nl + 1; // continue after this line
    }

    // anything after the last processed point remains for next chunks
    return { steps, remaining: buffer.slice(cursor) };
  }

  static _enrich(stepText) {
    const time = this._extractTimeSeconds(stepText);
    return { text: stepText, time: time ?? null };
  }

  static _extractTimeSeconds(text) {
    const m = text.match(this.TIME_REGEX);
    if (!m) return null;

    // Parse Indic numerals to Arabic for arithmetic
    const valueRaw = this._indicToInt(m[1]);
    const unit = (m[2] || '').toLowerCase();
    if (Number.isNaN(valueRaw) || valueRaw === null) return null;

    // Hours
    if (/^(hour|hr|घंट|గంట|மணி|ಗಂಟೆ|മണിക്കൂർ|तास|કલાક|ঘণ্টা|ਘੰਟ|hora|heure|stunde|or[ae]|時間|小时|鐘頭|час)/i.test(unit)) {
      return valueRaw * 3600;
    }
    
    // Minutes
    if (/^(min|मिनट|నిమిష|நிமிட|ನಿಮಿಷ|മിനിറ്റ്|मिनिट|મિનિટ|মিনিট|ਮਿੰਟ|分|минут)/i.test(unit)) {
      return valueRaw * 60;
    }
    
    // Seconds (default fallback if matched by TIME_REGEX but not hour/min)
    return valueRaw; 
  }

  // Convert Indic digit strings to an integer
  static _indicToInt(str) {
    if (!str) return null;
    // Try direct parseInt first (handles ASCII digits)
    const direct = parseInt(str, 10);
    if (!isNaN(direct)) return direct;

    // Map each Indic digit to ASCII equivalent
    const normalized = [...str].map(ch => {
      const cp = ch.codePointAt(0);
      // Gujarati ૦–૯
      if (cp >= 0x0AE6 && cp <= 0x0AEF) return cp - 0x0AE6;
      // Devanagari ०–९
      if (cp >= 0x0966 && cp <= 0x096F) return cp - 0x0966;
      // Bengali ০–৯
      if (cp >= 0x09E6 && cp <= 0x09EF) return cp - 0x09E6;
      // Tamil ௦–௯
      if (cp >= 0x0BE6 && cp <= 0x0BEF) return cp - 0x0BE6;
      // Telugu ౦–౯
      if (cp >= 0x0C66 && cp <= 0x0C6F) return cp - 0x0C66;
      // Kannada ೦–೯
      if (cp >= 0x0CE6 && cp <= 0x0CEF) return cp - 0x0CE6;
      // Malayalam ൦–൯
      if (cp >= 0x0D66 && cp <= 0x0D6F) return cp - 0x0D66;
      // Arabic-Indic ٠–٩
      if (cp >= 0x0660 && cp <= 0x0669) return cp - 0x0660;
      return ch;
    }).join('');

    const parsed = parseInt(normalized, 10);
    return isNaN(parsed) ? null : parsed;
  }

  static _flags(re) {
    let flags = '';
    if (re.ignoreCase) flags += 'i';
    if (re.global) flags += 'g';
    if (re.multiline) flags += 'm';
    return flags;
  }
}
