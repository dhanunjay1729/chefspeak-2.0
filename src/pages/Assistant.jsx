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
import { IngredientsInfo } from "../components/IngredientsInfo"; // ✅ New import
import { FavoriteButton } from "../components/FavoriteButton";
import { NonVegWarningDialog } from "../components/NonVegWarningDialog";
import { DishAnalysisService } from "../services/dishAnalysisService";
import { addRecentDish } from "../services/userService";
import Header from "../components/Header"; 
import { useSearchParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ChefHat, Sparkles } from "lucide-react";

export default function Assistant() {
  const { user } = useAuth();
  const { preferredLanguage, dietType, allergies, dislikes, skillLevel, refreshProfile } = useUserProfile();
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
    steps, // ✅ Only available after ingredients complete
    ingredients,
    hasIngredients,
    ingredientsComplete, // ✅ NEW: Flag for when ingredients are done
    currentStepIndex,
    isLoading,
    isLoadingIngredients,
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

  const [stateRestored, setStateRestored] = useState(false); // ✅ Track restoration

  // Use profile language as default
  useEffect(() => {
    setLanguage(preferredLanguage);
  }, [preferredLanguage]);

  // Extract URL parameters on component mount
  useEffect(() => {
    const dishFromUrl = searchParams.get('dish');
    const peopleFromUrl = searchParams.get('people');
    const languageFromUrl = searchParams.get('language');
    const ingredientsFromUrl = searchParams.get('ingredients');
    
    if (dishFromUrl) {
      const notes = ingredientsFromUrl 
        ? `Use these ingredients: ${ingredientsFromUrl}`
        : '';
      
      setPrefilledData({
        dishName: dishFromUrl,
        servings: peopleFromUrl ? parseInt(peopleFromUrl, 10) : 2,
        notes: notes
      });
      setSelectedDish(dishFromUrl);
      
      // URL language overrides profile language
      if (languageFromUrl) {
        setLanguage(languageFromUrl);
      }
    }
  }, [searchParams]);

  // ✅ MODIFIED: Only speak first cooking step after ingredients complete
  useEffect(() => {
    if (!firstStepSpokenRef.current && ingredientsComplete && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, ingredientsComplete, language, ttsService]);

  // ✅ MODIFIED: Save recipe only when ingredients complete AND steps exist
  useEffect(() => {
    const saveCompleteRecipe = async () => {
      if (
        user?.uid &&
        selectedDish &&
        ingredientsComplete && // ✅ Check ingredients complete
        steps.length > 0 &&
        !isLoading &&
        !isLoadingNutrition
      ) {
        try {
          await addRecentDish(user.uid, {
            dishName: selectedDish,
            imageUrl: undefined,
            language,
            people: prefilledData?.servings || 2,
            notes: prefilledData?.notes || '',
            ingredients: ingredients,
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
    ingredientsComplete, // ✅ Use ingredientsComplete instead of hasIngredients
    steps,
    ingredients,
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
    sessionStorage.removeItem('chefspeak_assistant_state'); // Clear old state
    
    // Prepare user preferences for OpenAI service
    const userPreferences = {
      dietType,
      allergies,
      dislikes,
      skillLevel
    };

    // Check if user is vegetarian/vegan but requesting non-veg dish
    if ((dietType === 'veg' || dietType === 'vegan') && DishAnalysisService.isNonVegDish(dishName)) {
      const detected = DishAnalysisService.getDetectedNonVegIngredients(dishName);
      setDetectedIngredients(detected);
      setPendingFormData({ dishName, servings, notes });
      setShowNonVegWarning(true);
      return; // Stop here and wait for user decision
    }

    // If no conflict, proceed normally
    await processRecipeRequest({ dishName, servings, notes }, userPreferences);
  };

  const updateUserDietPreference = async (newDietType) => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        diet: newDietType,
        updatedAt: Date.now()
      });
      
      // Refresh the profile hook to get updated preferences
      if (refreshProfile) {
        await refreshProfile();
      }
      
      console.log(`Updated user diet preference to: ${newDietType}`);
    } catch (error) {
      console.error("Failed to update diet preference:", error);
      throw error;
    }
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
      // Update user's diet preference in database to 'nonveg'
      try {
        await updateUserDietPreference('nonveg');
        
        // Now use the updated preference (nonveg) for this request
        const updatedPreferences = {
          ...userPreferences,
          dietType: 'nonveg'
        };
        
        await processRecipeRequest(pendingFormData, updatedPreferences);
        
        // Show success message
        console.log("Your diet preference has been updated to Non-Vegetarian");
      } catch (error) {
        console.error("Failed to update diet preference:", error);
        // Still proceed with the recipe using overridden preference
        const overriddenPreferences = {
          ...userPreferences,
          dietType: 'nonveg'
        };
        await processRecipeRequest(pendingFormData, overriddenPreferences);
      }
    }

    // Close dialog and clear pending data
    setShowNonVegWarning(false);
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

  // ✅ MODIFIED: Recipe object only exists when ingredients complete
  const currentRecipe = selectedDish && ingredientsComplete && steps.length > 0 ? {
    dishName: selectedDish,
    language,
    people: prefilledData?.servings || 2,
    notes: prefilledData?.notes || '',
    ingredients: ingredients,
    recipeSteps: steps,
    nutritionInfo: nutritionInfo || null,
  } : null;

  // ✅ Restore state on mount
  useEffect(() => {
    if (stateRestored) return; // Only restore once

    const savedState = sessionStorage.getItem('chefspeak_assistant_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        // Only restore if no URL params (URL params take priority)
        const dishFromUrl = searchParams.get('dish');
        if (!dishFromUrl && state.selectedDish) {
          setSelectedDish(state.selectedDish);
          setLanguage(state.language || preferredLanguage);
          setPrefilledData(state.prefilledData || null);
          
          // Note: You might want to refetch the recipe instead of restoring old steps
          // This ensures fresh data from the API
        }
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
    setStateRestored(true);
  }, [stateRestored, searchParams, preferredLanguage]);

  // ✅ Save state whenever relevant data changes
  useEffect(() => {
    if (!stateRestored) return; // Don't save during initial load

    const stateToPersist = {
      selectedDish,
      language,
      prefilledData,
      timestamp: Date.now(), // For cache invalidation
    };

    sessionStorage.setItem('chefspeak_assistant_state', JSON.stringify(stateToPersist));
  }, [selectedDish, language, prefilledData, stateRestored]);

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
        <IngredientsInfo ingredients={ingredients} isLoading={isLoadingIngredients} />
        
        {currentRecipe && !isLoading && !isLoadingNutrition && (
          <div className="w-full max-w-md mb-4">
            <FavoriteButton 
              recipe={currentRecipe}
              className="w-full justify-center"
              onFavoriteChange={(favorited) => {}}
            />
          </div>
        )}

        {/* ✅ SEXY WAITING MESSAGE */}
        {isLoading && !ingredientsComplete && (
          <div className="w-full max-w-md mb-6">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-rose-50/80 backdrop-blur p-6 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                {/* Animated cooking icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center animate-pulse">
                    <ChefHat className="w-10 h-10 text-white animate-bounce" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 animate-ping opacity-20" />
                </div>

                {/* Loading text */}
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-zinc-900">
                    Preparing your recipe...
                  </p>
                  <p className="text-sm text-zinc-600">
                    Gathering ingredients first
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '100ms' }} />
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Show cooking steps ONLY after ingredients complete */}
        <div className="space-y-3 w-full max-w-md">
          {ingredientsComplete && steps.map((step, index) => (
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
        </div>

        {/* ✅ MODIFIED: Disable navigation until ingredients complete */}
        <NavigationControls
          onBack={handleNavigateBack}
          onRepeat={handleRepeat}
          onNext={handleNavigateNext}
          hasSteps={ingredientsComplete && steps.length > 0}
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
