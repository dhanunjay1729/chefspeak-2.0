// src/hooks/useRecipe.js
import { useState } from "react";
import { OpenAIService } from "../services/openaiService";
import { RecipeParser } from "../utils/recipeParser";

export function useRecipe() {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionInfo, setNutritionInfo] = useState(""); // Add nutrition state
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false); // Add loading state

  const openAIService = new OpenAIService(import.meta.env.VITE_OPENAI_API_KEY);

  const fetchRecipeSteps = async (dish, people, extraNotes, language) => {
    try {
      setIsLoading(true);
      setSteps([]);
      setCurrentStepIndex(0);
      setNutritionInfo(""); // Reset nutrition info

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

  // Add nutrition fetching function
  const fetchNutritionInfo = async (dish, people, extraNotes, language) => {
    try {
      setIsLoadingNutrition(true);
      console.log("🥗 Fetching nutrition info for:", dish);
      
      const nutritionText = await openAIService.fetchNutritionInfo(dish, people, extraNotes, language);
      setNutritionInfo(nutritionText);
      
      console.log("✅ Nutrition info received:", nutritionText);
      return nutritionText;
    } catch (err) {
      console.error("❌ Error fetching nutrition info:", err);
      setNutritionInfo("Unable to fetch nutrition information at this time.");
      throw err;
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