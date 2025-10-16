// src/pages/Assistant.jsx
import { useEffect, useRef, useState, Fragment } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { TTSService } from "../services/ttsService";
import { UserService } from "../services/userService";
import { useRecipe } from "../hooks/useRecipe";
import { useTimer } from "../hooks/useTimer";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeStep } from "../components/RecipeStep";
import { TimerDisplay } from "../components/TimerDisplay";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo";
import { FavoriteButton } from "../components/FavoriteButton";
import { NonVegWarningDialog } from "../components/NonVegWarningDialog";
import { DishAnalysisService } from "../services/dishAnalysisService";
import { addRecentDish } from "../services/userService";
import Header from "../components/Header"; 
import { useSearchParams } from "react-router-dom";

export default function Assistant() {
  const { user } = useAuth();
  const { preferredLanguage, dietType, allergies, dislikes, skillLevel } = useUserProfile();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState("English");
  const [selectedDish, setSelectedDish] = useState("");
  
  // Pre-filled form data from URL params
  const [prefilledData, setPrefilledData] = useState(null);
  
  // Non-veg warning dialog state
  const [showNonVegWarning, setShowNonVegWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [detectedIngredients, setDetectedIngredients] = useState([]);

  const {
    steps,
    currentStepIndex,
    isLoading,
    nutritionInfo,
    isLoadingNutrition,
    fetchRecipeSteps,
    fetchNutritionInfo,
    handleNext,
    handleBack,
  } = useRecipe();

  const { remaining, startTimer } = useTimer();
  const ttsService = new TTSService();

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);

  // Use profile language as default
  useEffect(() => {
    setLanguage(preferredLanguage);
  }, [preferredLanguage]);

  // Extract URL parameters on component mount
  useEffect(() => {
    const dishFromUrl = searchParams.get('dish');
    const peopleFromUrl = searchParams.get('people');
    const languageFromUrl = searchParams.get('language');
    
    if (dishFromUrl) {
      setPrefilledData({
        dishName: dishFromUrl,
        servings: peopleFromUrl ? parseInt(peopleFromUrl, 10) : 2,
        notes: ''
      });
      setSelectedDish(dishFromUrl);
      
      // URL language overrides profile language
      if (languageFromUrl) {
        setLanguage(languageFromUrl);
      }
    }
  }, [searchParams]);

  // Speak as soon as the first step appears (don't block UI)
  useEffect(() => {
    if (!firstStepSpokenRef.current && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, language, ttsService]);

  // Add this new useEffect to save complete recipe when both steps and nutrition are loaded
  useEffect(() => {
    const saveCompleteRecipe = async () => {
      // Only save if we have a user, selected dish, steps, and nutrition info is loaded (success or failure)
      if (
        user?.uid &&
        selectedDish &&
        steps.length > 0 &&
        !isLoading &&
        !isLoadingNutrition
      ) {
        try {
          await addRecentDish(user.uid, {
            dishName: selectedDish,
            imageUrl: undefined,
            language,
            people: prefilledData?.servings || 2, // Use the servings from form
            notes: prefilledData?.notes || '',   // Use notes from form
            recipeSteps: steps,
            nutritionInfo: nutritionInfo || null,
          });
        } catch (error) {
          console.error("Failed to save complete recipe:", error);
        }
      }
    };

    saveCompleteRecipe();
  }, [
    user?.uid,
    selectedDish,
    steps,
    nutritionInfo,
    isLoading,
    isLoadingNutrition,
    language,
    prefilledData?.servings,
    prefilledData?.notes
  ]);

  const processRecipeRequest = async (formData, userPreferences) => {
    const { dishName, servings, notes } = formData;
    
    setSelectedDish(dishName);
    firstStepSpokenRef.current = false;
    setTimerOwnerIndex(null);

    // Update prefilled data to store current form values for recipe saving
    setPrefilledData({ dishName, servings, notes });

    // Fire both, but do NOT await nutrition; steps stream to UI
    fetchNutritionInfo(dishName, servings, notes, language, userPreferences).catch(() => {});
    fetchRecipeSteps(dishName, servings, notes, language, userPreferences).catch(() => {});
  };

  const handleFormSubmit = async ({ dishName, servings, notes }) => {
    // Prepare user preferences for OpenAI service
    const userPreferences = {
      dietType,
      allergies,
      dislikes,
      skillLevel
    };

    // Check if user is vegetarian but requesting non-veg dish
    if (dietType === 'veg' && DishAnalysisService.isNonVegDish(dishName)) {
      const detected = DishAnalysisService.getDetectedNonVegIngredients(dishName);
      setDetectedIngredients(detected);
      setPendingFormData({ dishName, servings, notes });
      setShowNonVegWarning(true);
      return; // Stop here and wait for user decision
    }

    // If no conflict, proceed normally
    await processRecipeRequest({ dishName, servings, notes }, userPreferences);
  };

  const handleNonVegWarningResponse = async (action) => {
    if (!pendingFormData) return;

    const userPreferences = {
      dietType,
      allergies,
      dislikes,
      skillLevel
    };

    if (action === 'vegetarian') {
      // Modify the dish name to request vegetarian version
      const vegDishName = `vegetarian ${pendingFormData.dishName}`;
      await processRecipeRequest({
        ...pendingFormData,
        dishName: vegDishName
      }, userPreferences);
    } else if (action === 'continue') {
      // Override diet preference for this request
      const overriddenPreferences = {
        ...userPreferences,
        dietType: 'nonveg' // Override diet preference
      };
      await processRecipeRequest(pendingFormData, overriddenPreferences);
    }

    // Clear pending data
    setPendingFormData(null);
  };

  const handleSpeak = (text) => {
    ttsService.speak(text, language).catch(() => {});
  };

  const handleNavigateNext = () => {
    const nextStep = handleNext();
    if (nextStep) ttsService.speak(nextStep.text, language).catch(() => {});
  };

  const handleNavigateBack = () => {
    const prevStep = handleBack();
    if (prevStep) ttsService.speak(prevStep.text, language).catch(() => {});
  };

  const handleRepeat = () => {
    if (steps[currentStepIndex]) {
      ttsService.speak(steps[currentStepIndex].text, language).catch(() => {});
    }
  };

  // Start a timer and remember which step owns it
  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  // Create recipe object for FavoriteButton
  const currentRecipe = selectedDish && steps.length > 0 ? {
    dishName: selectedDish,
    language,
    people: prefilledData?.servings || 2,
    notes: prefilledData?.notes || '',
    recipeSteps: steps,
    nutritionInfo: nutritionInfo || null,
  } : null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">ChefSpeak Assistant</h1>

        <RecipeForm 
          onSubmit={handleFormSubmit} 
          isLoading={isLoading}
          initialData={prefilledData}
        />

        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={isLoadingNutrition} />

        {/* Show favorite button when recipe is loaded */}
        {currentRecipe && !isLoading && !isLoadingNutrition && (
          <div className="w-full max-w-md mb-4">
            <FavoriteButton 
              recipe={currentRecipe}
              className="w-full justify-center"
              onFavoriteChange={() => {
                // Recipe favorited/unfavorited - could add notifications here
              }}
            />
          </div>
        )}

        <div className="space-y-3 w-full max-w-md">
          {steps.map((step, index) => (
            <Fragment key={index}>
              <RecipeStep
                step={step}
                index={index}
                isActive={index === currentStepIndex}
                onSpeak={handleSpeak}
                onStartTimer={handleStartTimerForStep(index)}
              />
              {timerOwnerIndex === index && remaining > 0 && (
                <div className="pl-3">
                  <TimerDisplay remaining={remaining} />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        startTimer(0);
                        setTimerOwnerIndex(null);
                      }}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={() => startTimer(remaining + 60)}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200"
                    >
                      +1 min
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          ))}

          {isLoading && steps.length === 0 && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          )}
        </div>

        <NavigationControls
          onBack={handleNavigateBack}
          onRepeat={handleRepeat}
          onNext={handleNavigateNext}
          hasSteps={steps.length > 0}
        />

        {/* Non-Veg Warning Dialog */}
        <NonVegWarningDialog
          isOpen={showNonVegWarning}
          onClose={() => {
            setShowNonVegWarning(false);
            setPendingFormData(null);
          }}
          onContinue={handleNonVegWarningResponse}
          dishName={pendingFormData?.dishName}
          detectedIngredients={detectedIngredients}
        />
      </div>
    </>
  );
}
