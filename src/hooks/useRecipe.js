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

  const openAIService = new OpenAIService();
  const parseBufferRef = useRef("");

  const fetchRecipeSteps = async (dish, people, extraNotes, language, userPreferences = {}) => {
    setIsLoading(true);
    setSteps([]);
    setCurrentStepIndex(0);
    parseBufferRef.current = "";

    try {
      // Get the response object
      const response = await openAIService.fetchRecipeSteps(
        dish,
        people,
        extraNotes,
        language,
        userPreferences
      );

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Parse the streaming response
      const fullText = await openAIService.parseStreamingResponse(response, {
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
          const finalParsed = RecipeParser.parseSteps(finalText);
          setSteps((prev) => dedupeByText([...prev, ...finalParsed]));
        },
      });

      return RecipeParser.parseSteps(fullText);
    } catch (err) {
      console.error("❌ Error fetching recipe steps:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNutritionInfo = async (dish, people, extraNotes, language, userPreferences = {}) => {
    try {
      setIsLoadingNutrition(true);
      setNutritionInfo(""); // Clear previous
      
      // Get the response
      const response = await openAIService.fetchNutritionInfo(
        dish,
        people,
        extraNotes,
        language,
        userPreferences
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Parse as streaming response (same as recipe steps)
      const fullText = await openAIService.parseStreamingResponse(response, {
        onText: (token) => {
          // Update nutrition info progressively as it streams
          setNutritionInfo((prev) => prev + token);
        },
        onDone: (finalText) => {
          setNutritionInfo(finalText);
        },
      });

      return fullText;
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
