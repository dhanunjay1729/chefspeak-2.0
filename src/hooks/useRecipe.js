// src/hooks/useRecipe.js
import { useState } from "react";
import { OpenAIService } from "../services/openaiService";
import { RecipeParser } from "../utils/recipeParser";

export function useRecipe() {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const openAIService = new OpenAIService(import.meta.env.VITE_OPENAI_API_KEY);

  const fetchRecipeSteps = async (dish, people, extraNotes, language) => {
    try {
      setIsLoading(true);
      setSteps([]);
      setCurrentStepIndex(0);

      const fullText = await openAIService.fetchRecipeSteps(dish, people, extraNotes, language);
      const enrichedSteps = RecipeParser.parseSteps(fullText);

      setSteps(enrichedSteps);
      setCurrentStepIndex(0);

      return enrichedSteps;
    } catch (err) {
      console.error("❌ Error fetching recipe steps:", err);
      throw err;
    } finally {
      setIsLoading(false);
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
    fetchRecipeSteps,
    navigateToStep,
    handleNext,
    handleBack,
  };
}