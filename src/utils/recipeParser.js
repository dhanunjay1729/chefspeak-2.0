// src/utils/recipeParser.js
export class RecipeParser {
  // Boundary like: "1. ", "1) ", "Step 1: "
  static STEP_BOUNDARY = /(^|\n)\s*(?:Step\s+)?(\d+)[\.\)]\s*:?[\s]+/gmi;

  // Supports English + a few Indic terms you already had
  static TIME_REGEX =
    /(\d+)\s*(hours?|hrs?|hour|minutes?|mins?|min|seconds?|secs?|sec|నిమిషాలు|నిమిషం|గంటలు|గంట|सेकंड|मिनट|घंटा|நிமிடங்கள்|மணி|സെക്കൻഡ്|മിനിറ്റ്|മണിക്കൂർ)/i;

  // NEW: parse final text by reusing the streaming extractor with a forced trailing newline
  static parseSteps(fullText) {
    const src = fullText.endsWith("\n") ? fullText : fullText + "\n";
    const { steps } = this.extractStreamSteps(src);
    return steps;
  }

  // NEW: emit steps only when a full line is available (boundary … newline)
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
      const nl = buffer.indexOf("\n", start);
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

    const valueRaw = parseInt(m[1], 10);
    const unit = (m[2] || "").toLowerCase();
    if (Number.isNaN(valueRaw)) return null;

    if (
      unit.includes("hour") ||
      unit.includes("hr") ||
      unit.includes("గంట") ||
      unit.includes("घंट") ||
      unit.includes("மணி") ||
      unit.includes("മണിക്കൂർ")
    ) {
      return valueRaw * 3600;
    }
    if (
      unit.includes("min") ||
      unit.includes("నిమిష") ||
      unit.includes("मिनट") ||
      unit.includes("நிமிட") ||
      unit.includes("മിനിറ്റ്")
    ) {
      return valueRaw * 60;
    }
    return valueRaw; // seconds
  }

  static _flags(re) {
    let flags = "";
    if (re.ignoreCase) flags += "i";
    if (re.global) flags += "g";
    if (re.multiline) flags += "m";
    return flags;
  }
}
