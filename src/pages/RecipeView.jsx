// src/pages/RecipeView.jsx
import { useEffect, useRef, useState, Fragment } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TTSService } from "../services/ttsService";
import { UserService } from "../services/userService";
import { getDishById } from "../services/userService";
import { useTimer } from "../hooks/useTimer";
import { RecipeStep } from "../components/RecipeStep";
import { TimerDisplay } from "../components/TimerDisplay";
import { NavigationControls } from "../components/NavigationControls";
import { NutritionInfo } from "../components/NutritionInfo";
import Header from "../components/Header"; 
import { useParams, Navigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RecipeView() {
  const { user } = useAuth();
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("English");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Recipe state
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nutritionInfo, setNutritionInfo] = useState(null);

  const { remaining, startTimer } = useTimer();
  const ttsService = new TTSService();

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);

  // Load user language
  useEffect(() => {
    const loadUserLanguage = async () => {
      const userLanguage = await UserService.getUserLanguage(user);
      setLanguage(userLanguage || "English");
    };
    loadUserLanguage();
  }, [user]);

  // Load recipe from database
  useEffect(() => {
    const loadRecipe = async () => {
      if (!user?.uid || !recipeId) {
        setLoading(false);
        return;
      }

      try {
        const recipeData = await getDishById(user.uid, recipeId);
        if (recipeData) {
          setRecipe(recipeData);
          setSteps(recipeData.recipeSteps || []);
          setNutritionInfo(recipeData.nutritionInfo || null);
          setLanguage(recipeData.language || "English");
        } else {
          setError("Recipe not found");
        }
      } catch (err) {
        console.error("Failed to load recipe:", err);
        setError("Failed to load recipe");
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [user?.uid, recipeId]);

  // Speak first step when loaded
  useEffect(() => {
    if (!firstStepSpokenRef.current && steps.length > 0) {
      firstStepSpokenRef.current = true;
      ttsService.speak(steps[0].text, language).catch(() => {});
    }
  }, [steps, language, ttsService]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      return steps[newIndex];
    }
    return null;
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      return steps[newIndex];
    }
    return null;
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

  // Show loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-4" />
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </>
    );
  }

  // Show error state
  if (error || !recipe) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center justify-center">
          <p className="text-red-600 mb-4">{error || "Recipe not found"}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </>
    );
  }

  // Redirect if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
        {/* Header with back button and recipe info */}
        <div className="w-full max-w-md mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.dishName}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Language: {recipe.language}</span>
              {recipe.people && <span>Servings: {recipe.people}</span>}
            </div>
            {recipe.notes && (
              <p className="text-sm text-gray-600 mt-2">Notes: {recipe.notes}</p>
            )}
          </div>
        </div>

        {/* Nutrition Info */}
        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={false} />

        {/* Recipe Steps */}
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
                  {/* Controls under the inline time remaining */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        startTimer(0);
                        setTimerOwnerIndex(null);
                      }}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200
                                 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={() => startTimer(remaining + 60)}
                      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                                 bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200
                                 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                    >
                      +1 min
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          ))}

          {steps.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No recipe steps found.
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <NavigationControls
          onBack={handleNavigateBack}
          onRepeat={handleRepeat}
          onNext={handleNavigateNext}
          hasSteps={steps.length > 0}
        />
      </div>
    </>
  );
}