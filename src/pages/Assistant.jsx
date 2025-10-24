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
import { IngredientsInfo } from "../components/IngredientsInfo";
import { FavoriteButton } from "../components/FavoriteButton";
import { NonVegWarningDialog } from "../components/NonVegWarningDialog";
import { DishAnalysisService } from "../services/dishAnalysisService";
import { addRecentDish } from "../services/userService";
import Header from "../components/Header"; 
import { useSearchParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ChefHat, Sparkles } from "lucide-react";
import { AudioControls } from "../components/AudioControls";
import { LoadingSpinner } from "../components/LoadingSpinner"; // ✅ Import
import { AnalyticsService } from "../services/analyticsService"; // ✅ Import

export default function Assistant() {
  const { user } = useAuth();
  const { preferredLanguage, dietType, allergies, dislikes, skillLevel, refreshProfile } = useUserProfile();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState("English");
  const [selectedDish, setSelectedDish] = useState("");
  
  const [prefilledData, setPrefilledData] = useState(null);
  
  const [showNonVegWarning, setShowNonVegWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [detectedIngredients, setDetectedIngredients] = useState([]);

  const {
    steps,
    ingredients,
    hasIngredients,
    ingredientsComplete,
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
  
  // ✅ Create TTS instance ONCE using useRef (persists across re-renders)
  const ttsService = useRef(new TTSService()).current;

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);
  const [stateRestored, setStateRestored] = useState(false);

  useEffect(() => {
    setLanguage(preferredLanguage);
  }, [preferredLanguage]);

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
      
      if (languageFromUrl) {
        setLanguage(languageFromUrl);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!firstStepSpokenRef.current && ingredientsComplete && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, ingredientsComplete, language, ttsService]);

  useEffect(() => {
    const saveCompleteRecipe = async () => {
      if (
        user?.uid &&
        selectedDish &&
        ingredientsComplete &&
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
    ingredientsComplete,
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

    setPrefilledData({ dishName, servings, notes });

    fetchNutritionInfo(dishName, servings, notes, language, userPreferences).catch(() => {});
    fetchRecipeSteps(dishName, servings, notes, language, userPreferences).catch(() => {});
  };

  const handleFormSubmit = async ({ dishName, servings, notes }) => {
    sessionStorage.removeItem('chefspeak_assistant_state');
    
    const userPreferences = {
      dietType,
      allergies,
      dislikes,
      skillLevel
    };

    if ((dietType === 'veg' || dietType === 'vegan') && DishAnalysisService.isNonVegDish(dishName)) {
      const detected = DishAnalysisService.getDetectedNonVegIngredients(dishName);
      setDetectedIngredients(detected);
      setPendingFormData({ dishName, servings, notes });
      setShowNonVegWarning(true);
      return;
    }

    await processRecipeRequest({ dishName, servings, notes }, userPreferences);

    // ✅ Track recipe generation
    AnalyticsService.trackRecipeGenerated(dishName, language);
  };

  const updateUserDietPreference = async (newDietType) => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        diet: newDietType,
        updatedAt: Date.now()
      });
      
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
      const vegDishName = `vegetarian ${pendingFormData.dishName}`;
      await processRecipeRequest({
        ...pendingFormData,
        dishName: vegDishName
      }, userPreferences);
    } else if (action === 'continue') {
      try {
        await updateUserDietPreference('nonveg');
        
        const updatedPreferences = {
          ...userPreferences,
          dietType: 'nonveg'
        };
        
        await processRecipeRequest(pendingFormData, updatedPreferences);
        
        console.log("Your diet preference has been updated to Non-Vegetarian");
      } catch (error) {
        console.error("Failed to update diet preference:", error);
        const overriddenPreferences = {
          ...userPreferences,
          dietType: 'nonveg'
        };
        await processRecipeRequest(pendingFormData, overriddenPreferences);
      }
    }

    setShowNonVegWarning(false);
    setPendingFormData(null);
  };

  // ✅ UPDATED: Stop previous audio before speaking
  const handleSpeak = (text) => {
    ttsService.speak(text, language);
    
    // ✅ Track TTS usage
    AnalyticsService.trackTTSUsed(language);
  };

  // ✅ UPDATED: Stop previous audio before speaking next step
  const handleNavigateNext = () => {
    const nextStep = handleNext();
    if (nextStep) {
      ttsService.speak(nextStep.text, language).catch(() => {});
    }
  };

  // ✅ UPDATED: Stop previous audio before speaking previous step
  const handleNavigateBack = () => {
    const prevStep = handleBack();
    if (prevStep) {
      ttsService.speak(prevStep.text, language).catch(() => {});
    }
  };

  // ✅ UPDATED: Stop previous audio before repeating
  const handleRepeat = () => {
    if (steps[currentStepIndex]) {
      ttsService.speak(steps[currentStepIndex].text, language).catch(() => {});
    }
  };

  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  const currentRecipe = selectedDish && ingredientsComplete && steps.length > 0 ? {
    dishName: selectedDish,
    language,
    people: prefilledData?.servings || 2,
    notes: prefilledData?.notes || '',
    ingredients: ingredients,
    recipeSteps: steps,
    nutritionInfo: nutritionInfo || null,
  } : null;

  useEffect(() => {
    if (stateRestored) return;

    const savedState = sessionStorage.getItem('chefspeak_assistant_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        const dishFromUrl = searchParams.get('dish');
        if (!dishFromUrl && state.selectedDish) {
          setSelectedDish(state.selectedDish);
          setLanguage(state.language || preferredLanguage);
          setPrefilledData(state.prefilledData || null);
        }
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
    setStateRestored(true);
  }, [stateRestored, searchParams, preferredLanguage]);

  useEffect(() => {
    if (!stateRestored) return;

    const stateToPersist = {
      selectedDish,
      language,
      prefilledData,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('chefspeak_assistant_state', JSON.stringify(stateToPersist));
  }, [selectedDish, language, prefilledData, stateRestored]);

  // ✅ CLEANUP: Stop audio when component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [ttsService]);

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

        {/* ✅ Use existing LoadingSpinner with custom message */}
        {isLoading && !ingredientsComplete && (
          <div className="w-full max-w-md mb-6">
            <LoadingSpinner text=" Firing up your personal chef assistant..." />
          </div>
        )}

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
              
              {/* ✅ ADD: Audio controls under active step */}
              {index === currentStepIndex && (
                <div className="w-full px-2">
                  <AudioControls ttsService={ttsService} />
                </div>
              )}
              
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

        <NavigationControls
          onBack={handleNavigateBack}
          onRepeat={handleRepeat}
          onNext={handleNavigateNext}
          hasSteps={ingredientsComplete && steps.length > 0}
        />

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
