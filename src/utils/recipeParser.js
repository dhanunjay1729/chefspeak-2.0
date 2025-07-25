// src/utils/recipeParser.js
export class RecipeParser {
  static parseSteps(fullText) {
    console.log("📝 Full recipe text received:", fullText.substring(0, 200) + "...");
    
    const timeRegex = /(\d+)\s*(minutes|min|minute|seconds|secs|second|hours|hrs|hour|నిమిషాలు|నిమిషం|గంటలు|గంట|सेकंड|मिनट|घंटा|நிமிடங்கள்|மணி|സെക്കൻഡ്|മിനിറ്റ്|മണിക്കൂർ)/i;
    console.log("⏱️ Time regex pattern:", timeRegex);

    const parsedSteps = fullText
      .split(/\n+/)
      .filter((line) => line.trim().match(/^\d+[\).]/))
      .map((step) => step.trim());

    console.log("📋 Parsed steps count:", parsedSteps.length);
    console.log("📋 Raw parsed steps:", parsedSteps);

    const enrichedSteps = parsedSteps.map((step, index) => {
      console.log(`🔍 Processing step ${index + 1}:`, step);
      
      const match = step.match(timeRegex);
      console.log(`⏱️ Time regex match for step ${index + 1}:`, match);
      
      let timeInSeconds = null;
      if (match) {
        let value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        console.log(`⏱️ Found time in step ${index + 1}:`, { value, unit });
        
        if (unit.includes("hour") || unit.includes("hr") || 
            unit.includes("గంట") || unit.includes("घंटा") || 
            unit.includes("மணி") || unit.includes("മണിക്കൂർ")) {
          value = value * 3600;
          console.log(`⏱️ Converted hours to seconds:`, value);
        } else if (unit.includes("min") || unit.includes("నిమిష") || 
                   unit.includes("मिनट") || unit.includes("நிமிட") || 
                   unit.includes("മിനിറ്റ്")) {
          value = value * 60;
          console.log(`⏱️ Converted minutes to seconds:`, value);
        } else {
          console.log(`⏱️ Keeping seconds as is:`, value);
        }
        timeInSeconds = value;
      } else {
        console.log(`❌ No time found in step ${index + 1}`);
      }
      
      const enrichedStep = { text: step, time: timeInSeconds };
      console.log(`✅ Enriched step ${index + 1}:`, enrichedStep);
      return enrichedStep;
    });

    console.log("🎯 Final enriched steps:", enrichedSteps);
    console.log("🎯 Steps with timers:", enrichedSteps.filter(step => step.time !== null));

    return enrichedSteps;
  }
}