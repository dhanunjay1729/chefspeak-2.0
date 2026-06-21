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
  const [bufferedSteps, setBufferedSteps] = useState([]);
  const [ingredientsComplete, setIngredientsComplete] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [nutritionInfo, setNutritionInfo] = useState(null); // ✅ FIX: null not ""
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [error, setError] = useState(null);

  const openAIService = useRef(new OpenAIService()).current;
  const parseBufferRef = useRef("");
  const ingredientsCompleteRef = useRef(false); // ✅ FIX: ref mirror for use inside setState updaters

  const fetchRecipeSteps = async (dish, people, extraNotes, language, userPreferences = {}) => {
    setIsLoading(true);
    setAllSteps([]);
    setBufferedSteps([]);
    setIngredientsComplete(false);
    ingredientsCompleteRef.current = false; // ✅ reset ref too
    setCurrentStepIndex(0);
    setError(null);
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
                  setAllSteps((prev) => {
                    const updated = dedupeByText([...prev, ...extracted]);
                    
                    // ✅ FIX: Use the ref (not stale closure) to check
                    if (updated.length >= 1 && !ingredientsCompleteRef.current) {
                      ingredientsCompleteRef.current = true;
                      setIngredientsComplete(true);
                    }
                    
                    // ✅ Always update buffered steps when we have >1 step
                    if (updated.length > 1) {
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
          
          if (updated.length >= 1 && !ingredientsCompleteRef.current) {
            ingredientsCompleteRef.current = true;
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
      setError(err.message || "Failed to generate recipe. Please ensure the backend server is running.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNutritionInfo = async (dish, people, extraNotes, language, userPreferences = {}) => {
    setIsLoadingNutrition(true);
    setNutritionInfo(null); // ✅ FIX: null not ""

    try {
      const response = await openAIService.fetchNutritionInfo(
        dish,
        people,
        extraNotes,
        language,
        userPreferences
      );

      const data = await response.json();
      
      // ✅ FIX: Validate that we got actual nutrition data back
      if (data && typeof data === 'object' && !data.error) {
        setNutritionInfo(data);
      } else {
        console.error("Invalid nutrition response:", data);
        setNutritionInfo(null);
      }

    } catch (err) {
      console.error("fetchNutritionInfo error:", err);
      setNutritionInfo(null);
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  // Extract ingredients (first step)
  const ingredients = allSteps.length > 0 ? allSteps[0].text : "";
  const hasIngredients = ingredients.trim().length > 0;
  
  // Return buffered cooking steps (only shown after ingredients complete)
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
    steps,
    ingredients,
    hasIngredients,
    ingredientsComplete,
    currentStepIndex,
    isLoading,
    isLoadingIngredients: isLoading && !ingredientsComplete,
    nutritionInfo,
    isLoadingNutrition,
    error,
    fetchRecipeSteps,
    fetchNutritionInfo,
    navigateToStep,
    handleNext,
    handleBack,
  };
}

