// src/hooks/useRecipe.js
import { useState, useRef } from "react";
import { OpenAIService } from "../services/openaiService";
import { RecipeParser } from "../utils/recipeParser";

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
  const [allSteps, setAllSteps] = useState([]);
  const [bufferedSteps, setBufferedSteps] = useState([]); // ✅ Buffer for steps 2+
  const [ingredientsComplete, setIngredientsComplete] = useState(false); // ✅ Track when ingredients done
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [nutritionInfo, setNutritionInfo] = useState("");
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

  const openAIService = new OpenAIService();
  const parseBufferRef = useRef("");

  const fetchRecipeSteps = async (dish, people, extraNotes, language, userPreferences = {}) => {
    setIsLoading(true);
    setAllSteps([]);
    setBufferedSteps([]);
    setIngredientsComplete(false);
    setCurrentStepIndex(0);
    parseBufferRef.current = "";

    try {
      const response = await openAIService.fetchRecipeSteps(
        dish,
        people,
        extraNotes,
        language,
        userPreferences
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                parseBufferRef.current += parsed.content;

                const { steps: extracted, remaining } = RecipeParser.extractStreamSteps(
                  parseBufferRef.current,
                  language
                );

                parseBufferRef.current = remaining;

                if (extracted.length > 0) {
                  // ✅ Add to allSteps for tracking
                  setAllSteps((prev) => {
                    const updated = dedupeByText([...prev, ...extracted]);
                    
                    // ✅ If we now have ingredients (step 1), mark as complete
                    if (updated.length >= 1 && !ingredientsComplete) {
                      setIngredientsComplete(true);
                      
                      // ✅ Release buffered steps (steps 2+)
                      if (updated.length > 1) {
                        setBufferedSteps(updated.slice(1));
                      }
                    } else if (ingredientsComplete && updated.length > 1) {
                      // ✅ If ingredients already loaded, update cooking steps directly
                      setBufferedSteps(updated.slice(1));
                    }
                    
                    return updated;
                  });
                }
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      // Final flush
      if (parseBufferRef.current.trim()) {
        const finalSteps = RecipeParser.parseSteps(parseBufferRef.current, language);
        setAllSteps((prev) => {
          const updated = dedupeByText([...prev, ...finalSteps]);
          
          if (updated.length >= 1) {
            setIngredientsComplete(true);
          }
          if (updated.length > 1) {
            setBufferedSteps(updated.slice(1));
          }
          
          return updated;
        });
      }

    } catch (err) {
      console.error("fetchRecipeSteps error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNutritionInfo = async (dish, people, extraNotes, language, userPreferences = {}) => {
    setIsLoadingNutrition(true);
    setNutritionInfo("");

    try {
      const response = await openAIService.fetchNutritionInfo(
        dish,
        people,
        extraNotes,
        language,
        userPreferences
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                buffer += parsed.content;
                setNutritionInfo(buffer);
              }
            } catch (e) {
              console.error("Nutrition parse error:", e);
            }
          }
        }
      }

    } catch (err) {
      console.error("fetchNutritionInfo error:", err);
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  // ✅ Extract ingredients (first step)
  const ingredients = allSteps.length > 0 ? allSteps[0].text : "";
  const hasIngredients = ingredients.trim().length > 0;
  
  // ✅ Return buffered cooking steps (only shown after ingredients complete)
  const steps = ingredientsComplete ? bufferedSteps : [];

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
    steps, // ✅ Only cooking steps, only after ingredients complete
    ingredients, // ✅ First step text
    hasIngredients, // ✅ Check if ingredients text exists
    ingredientsComplete, // ✅ NEW: Check if ingredients fully loaded
    currentStepIndex,
    isLoading,
    isLoadingIngredients: isLoading && !ingredientsComplete, // ✅ True until ingredients done
    nutritionInfo,
    isLoadingNutrition,
    fetchRecipeSteps,
    fetchNutritionInfo,
    navigateToStep,
    handleNext,
    handleBack,
  };
}
