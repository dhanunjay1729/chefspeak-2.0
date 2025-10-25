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
import { IngredientsInfo } from "../components/IngredientsInfo"; // ✅ Import
import { FavoriteButton } from "../components/FavoriteButton"; // ✅ Import
import { AudioControls } from "../components/AudioControls";
import Header from "../components/Header"; 
import { useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ChefHat, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalyticsService } from "../services/analyticsService"; // ✅ Import

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
  const [ingredients, setIngredients] = useState([]); // ✅ Add ingredients state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nutritionInfo, setNutritionInfo] = useState(null);

  const { remaining, startTimer } = useTimer();
  
  // ✅ Create TTS instance ONCE using useRef (persists across re-renders)
  const ttsService = useRef(new TTSService()).current;

  const firstStepSpokenRef = useRef(false);
  const [timerOwnerIndex, setTimerOwnerIndex] = useState(null);

  // ✅ Add ref to track the active step element
  const activeStepRef = useRef(null);

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
          setIngredients(recipeData.ingredients || []); // ✅ Load ingredients
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

  // Start a timer and remember which step owns it
  const handleStartTimerForStep = (index) => (seconds) => {
    setTimerOwnerIndex(index);
    startTimer(seconds);
  };

  // ✅ CLEANUP: Stop audio when component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [ttsService]);

  // ✅ Auto-scroll to active step when it changes
  useEffect(() => {
    if (activeStepRef.current && steps.length > 0) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Centers the step in the viewport
        inline: 'nearest'
      });
    }
  }, [currentStepIndex, steps.length]);

  // Show sexy loading animation
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-rose-50/80 to-fuchsia-50/80 backdrop-blur p-8 shadow-2xl relative overflow-hidden">
              {/* Animated background gradient orbs */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="relative flex flex-col items-center gap-6">
                {/* Animated cooking pot with steam */}
                <div className="relative">
                  {/* Main chef hat */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-rose-500/50">
                    <ChefHat className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
                  </div>
                  
                  {/* Rotating border */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 border-r-rose-500 animate-spin" style={{ animationDuration: '2s' }} />
                  
                  {/* Pulsing glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-fuchsia-500 animate-ping opacity-20" />
                  
                  {/* Steam bubbles */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-float" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-rose-400/60 animate-float" style={{ animationDelay: '0.3s' }} />
                    <div className="w-2 h-2 rounded-full bg-fuchsia-400/60 animate-float" style={{ animationDelay: '0.6s' }} />
                  </div>
                </div>

                {/* Animated text */}
                <div className="text-center space-y-3">
                  <p className="text-xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent animate-pulse">
                    📖 Loading your recipe...
                  </p>
                  <p className="text-sm text-zinc-600 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Preparing your cooking instructions</span>
                    <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                  </p>
                </div>

                {/* Animated cooking process dots */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 animate-bounce shadow-lg shadow-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 animate-bounce shadow-lg shadow-rose-500/50" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 animate-bounce shadow-lg shadow-fuchsia-500/50" style={{ animationDelay: '300ms' }} />
                </div>

                {/* Progress bar with shimmer */}
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 rounded-full animate-progress-shimmer" />
                </div>

                {/* Cooking tips */}
                <div className="text-xs text-zinc-500 italic text-center max-w-xs animate-fade-in-out">
                  💡 Your delicious recipe is almost ready!
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Animations */}
          <style jsx>{`
            @keyframes float {
              0%, 100% { 
                transform: translateY(0px) scale(1);
                opacity: 0.6;
              }
              50% { 
                transform: translateY(-20px) scale(0.8);
                opacity: 0;
              }
            }

            @keyframes progress-shimmer {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }

            @keyframes fade-in-out {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }

            .animate-float {
              animation: float 2s ease-in-out infinite;
            }

            .animate-progress-shimmer {
              animation: progress-shimmer 2s ease-in-out infinite;
              width: 50%;
            }

            .animate-fade-in-out {
              animation: fade-in-out 3s ease-in-out infinite;
            }
          `}</style>
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

        {/* ✅ Nutrition Info - separate */}
        <NutritionInfo nutritionInfo={nutritionInfo} isLoading={false} />
        
        {/* ✅ Ingredients Info - separate */}
        <IngredientsInfo ingredients={ingredients} isLoading={false} />
        
        {/* ✅ Favorite button */}
        {recipe && (
          <div className="w-full max-w-md mb-4">
            <FavoriteButton 
              recipe={recipe}
              className="w-full justify-center"
              onFavoriteChange={(favorited) => {}}
            />
          </div>
        )}

        {/* Recipe Steps */}
        <div className="space-y-3 w-full max-w-md">
          {steps.map((step, index) => (
            <Fragment key={index}>
              {/* ✅ Add ref to the active step */}
              <div ref={index === currentStepIndex ? activeStepRef : null}>
                <RecipeStep
                  step={step}
                  index={index}
                  isActive={index === currentStepIndex}
                  onSpeak={handleSpeak}
                  onStartTimer={handleStartTimerForStep(index)}
                />
              </div>
              
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