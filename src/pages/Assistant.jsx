import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TTSService } from "../services/ttsService";
import { UserService } from "../services/userService";
import { useRecipe } from "../hooks/useRecipe";
import { useTimer } from "../hooks/useTimer";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeStep } from "../components/RecipeStep";
import { TimerDisplay } from "../components/TimerDisplay";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo"; // Add import
import DishImage from "../components/DishImage";

export default function Assistant() {
  const { user } = useAuth();
  const [language, setLanguage] = useState("English");
  const [selectedDish, setSelectedDish] = useState("");
  
  const { 
    steps, 
    currentStepIndex, 
    isLoading, 
    nutritionInfo, 
    isLoadingNutrition,
    fetchRecipeSteps, 
    fetchNutritionInfo, // Add this
    handleNext, 
    handleBack 
  } = useRecipe();
  
  const { remaining, startTimer } = useTimer();
  
  const ttsService = new TTSService();

  useEffect(() => {
    const loadUserLanguage = async () => {
      const userLanguage = await UserService.getUserLanguage(user);
      setLanguage(userLanguage);
    };
    loadUserLanguage();
  }, [user]);

  const handleFormSubmit = async ({ dishName, servings, notes }) => {
    setSelectedDish(dishName);
    
    try {
      // Fetch both recipe steps and nutrition info simultaneously
      console.log("🔄 Fetching recipe and nutrition info...");
      
      const [enrichedSteps] = await Promise.all([
        fetchRecipeSteps(dishName, servings, notes, language),
        fetchNutritionInfo(dishName, servings, notes, language)
      ]);
      
      if (enrichedSteps.length > 0) {
        await ttsService.speak(enrichedSteps[0].text, language);
      }
    } catch (error) {
      console.error("Error fetching recipe data:", error);
    }
  };

  const handleSpeak = (text) => {
    ttsService.speak(text, language);
  };

  const handleNavigateNext = () => {
    const nextStep = handleNext();
    if (nextStep) {
      ttsService.speak(nextStep.text, language);
    }
  };

  const handleNavigateBack = () => {
    const prevStep = handleBack();
    if (prevStep) {
      ttsService.speak(prevStep.text, language);
    }
  };

  const handleRepeat = () => {
    if (steps[currentStepIndex]) {
      ttsService.speak(steps[currentStepIndex].text, language);
    }
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">ChefSpeak Assistant</h1>

      <RecipeForm onSubmit={handleFormSubmit} isLoading={isLoading} />

      {/* Dish Image */}
      {selectedDish && (
        <div className="mb-6">
          <DishImage dishName={selectedDish} />
        </div>
      )}

      {/* Nutrition Information */}
      <NutritionInfo 
        nutritionInfo={nutritionInfo} 
        isLoading={isLoadingNutrition} 
      />

      {/* Recipe Steps */}
      <div className="space-y-3 w-full max-w-md">
        {steps.map((step, index) => (
          <RecipeStep
            key={index}
            step={step}
            index={index}
            isActive={index === currentStepIndex}
            onSpeak={handleSpeak}
            onStartTimer={startTimer}
          />
        ))}
      </div>

      <TimerDisplay remaining={remaining} />

      <NavigationControls
        onBack={handleNavigateBack}
        onRepeat={handleRepeat}
        onNext={handleNavigateNext}
        hasSteps={steps.length > 0}
      />
    </div>
  );
}
