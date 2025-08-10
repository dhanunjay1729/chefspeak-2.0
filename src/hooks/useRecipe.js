// src/hooks/useRecipe.js
import { useRef, useState } from "react";
import { OpenAIService } from "../services/openaiService";
import { RecipeParser } from "../utils/recipeParser";

// De-dupe steps by their trimmed text (guards against stream + final double-adds)
const dedupeByText = (arr) => {
  const seen = new Set();
  return arr.filter((s) => {
    const key = (s.text || "").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function useRecipe() {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [nutritionInfo, setNutritionInfo] = useState("");
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

  const openAIService = new OpenAIService(import.meta.env.VITE_OPENAI_API_KEY);

  // buffer that holds the tail of the stream that may not yet contain a full step
  const parseBufferRef = useRef("");

  const fetchRecipeSteps = async (dish, people, extraNotes, language) => {
    setIsLoading(true);
    setSteps([]);
    setCurrentStepIndex(0);
    parseBufferRef.current = "";

    try {
      const fullText = await openAIService.fetchRecipeSteps(
        dish,
        people,
        extraNotes,
        language,
        {
          onText: (token) => {
            parseBufferRef.current += token;

            const { steps: newOnes, remaining } = RecipeParser.extractStreamSteps(
              parseBufferRef.current
            );

            if (newOnes.length) {
              setSteps((prev) => dedupeByText([...prev, ...newOnes]));
            }
            parseBufferRef.current = remaining;
          },
          onDone: (finalText) => {
            // Flush & dedupe once more at completion
            const finalParsed = RecipeParser.parseSteps(finalText);
            setSteps((prev) => dedupeByText([...prev, ...finalParsed]));
          },
        }
      );

      // Return final steps for compatibility
      return RecipeParser.parseSteps(fullText);
    } catch (err) {
      console.error("❌ Error fetching recipe steps:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNutritionInfo = async (dish, people, extraNotes, language) => {
    try {
      setIsLoadingNutrition(true);
      const nutritionText = await openAIService.fetchNutritionInfo(
        dish,
        people,
        extraNotes,
        language
      );
      setNutritionInfo(nutritionText);
      return nutritionText;
    } catch (err) {
      console.error("❌ Error fetching nutrition info:", err);
      setNutritionInfo("Unable to fetch nutrition information at this time.");
      return "";
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  const navigateToStep = (index) => {
    const newIndex = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStepIndex(newIndex);
    return steps[newIndex];
  };

  const handleNext = () => {
    const next = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStepIndex(next);
    return steps[next];
  };

  const handleBack = () => {
    const prev = Math.max(currentStepIndex - 1, 0);
    setCurrentStepIndex(prev);
    return steps[prev];
  };

  return {
    steps,
    currentStepIndex,
    isLoading,
    nutritionInfo,
    isLoadingNutrition,
    fetchRecipeSteps,
    fetchNutritionInfo,
    navigateToStep,
    handleNext,
    handleBack,
  };
}
