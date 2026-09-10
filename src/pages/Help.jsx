// src/pages/Help.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import {
  ChefHat,
  Sparkles,
  Volume2,
  Timer,
  Salad,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  HelpCircle,
  Clock,
  Heart,
  Globe,
  Utensils,
} from "lucide-react";

export default function Help() {
  const [openSection, setOpenSection] = useState("getting-started");

  const toggleSection = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const AccordionItem = ({ id, title, icon: Icon, badge, children }) => {
    const isOpen = openSection === id;
    return (
      <div
        className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
          isOpen
            ? "border-amber-300/80 dark:border-amber-500/30 bg-white/95 dark:bg-zinc-900/95 shadow-md shadow-amber-500/5 dark:shadow-none ring-1 ring-amber-400/20 dark:ring-amber-400/10"
            : "border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700 backdrop-blur-md"
        }`}
      >
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                isOpen
                  ? "bg-gradient-to-br from-amber-500 to-fuchsia-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h2 className={`text-base sm:text-lg font-bold ${isOpen ? "text-amber-900 dark:text-amber-100" : "text-zinc-900 dark:text-zinc-100"}`}>
                {title}
              </h2>
              {badge && (
                <span className={`inline-block self-start sm:self-auto text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full border ${isOpen ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-300" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/50 text-amber-800 dark:text-amber-400"}`}>
                  {badge}
                </span>
              )}
            </div>
          </div>
          <div className="text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed animate-in fade-in duration-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />

      {/* Decorative ambient background flair */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 transition-colors">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-amber-200/30 via-rose-200/30 to-fuchsia-200/30 dark:from-amber-900/20 dark:via-rose-900/20 dark:to-fuchsia-900/20 blur-3xl" />
      </div>

      <main className="min-h-screen pb-16 relative">
        <div className="mx-auto max-w-4xl px-4 pt-10 space-y-10">
          {/* Hero Header */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-fuchsia-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-700/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Voice-Guided Cooking Guide</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              How{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 dark:from-amber-400 dark:via-rose-400 dark:to-fuchsia-400">
                ChefSpeak
              </span>{" "}
              Works
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Step-by-step voice guidance, automatic timers, and personalized recipes so you can cook effortlessly without touching your phone with messy kitchen hands.
            </p>
          </section>

          {/* 3-Step Overview Cards */}
          <section className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-sm shadow-inner">
                  1
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base pt-2">
                  Pick Any Dish
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  Type any recipe name or list whatever ingredients you have in your fridge.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-bold flex items-center justify-center text-sm shadow-inner">
                  2
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base pt-2">
                  Listen Hands-Free
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  ChefSpeak speaks each step aloud so your screen stays clean while you prep and cook.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 font-bold flex items-center justify-center text-sm shadow-inner">
                  3
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base pt-2">
                  Use Smart Timers
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  One-tap timers automatically detect cooking times and sound an alert when ready.
                </p>
              </div>
            </div>
          </section>

          {/* Accordion Detail Sections */}
          <section className="space-y-4 relative z-10">
            {/* Section 1: Hands-Free Voice Guidance */}
            <AccordionItem
              id="getting-started"
              title="Hands-Free Voice Guidance"
              icon={Volume2}
              badge="Core Feature"
            >
              <div className="space-y-4">
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Cooking with messy, oily, or flour-covered hands makes touching screens difficult. ChefSpeak was designed specifically to guide you vocally from start to finish.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2 mb-1.5">
                      <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Automatic Step Reading</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      As you proceed to each step, ChefSpeak immediately narrates instructions with clear pacing.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2 mb-1.5">
                      <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Repeat on Demand</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      Kitchen noisy from sizzling pans? Tap "Repeat" at any moment to hear the step again.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2 mb-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Adjustable Voice Speed</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      Control narration speed (0.75x, 1x, 1.25x, 1.5x) to match your preferred cooking tempo.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2 mb-1.5">
                      <Globe className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                      <span>Multiple Languages</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      Cook in English, Hindi, Spanish, French, Italian, and more directly from the language selector.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Section 2: Integrated Step Timers */}
            <AccordionItem
              id="timers"
              title="Integrated Step Timers"
              icon={Timer}
              badge="Smart Extraction"
            >
              <div className="space-y-4">
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Never overboil pasta or burn caramel again. ChefSpeak automatically parses your recipe instructions for cooking durations and attaches a 1-tap timer button directly to the step.
                </p>

                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-3">
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    How Timers Work:
                  </h4>
                  <ul className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/80 space-y-2 list-disc list-inside font-medium">
                    <li>
                      When a step mentions a time (e.g. <em>"Simmer gently for 12 minutes"</em>), a <strong>"Start 12m Timer"</strong> button appears directly on that step card.
                    </li>
                    <li>
                      A clean floating countdown timer keeps track of remaining minutes and seconds.
                    </li>
                    <li>
                      When the countdown reaches zero, ChefSpeak rings an audible chime alert so you know it's time for the next step.
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            {/* Section 3: Cook with Ingredients (Pantry Mode) */}
            <AccordionItem
              id="pantry"
              title="Cook with What You Have (Pantry Mode)"
              icon={Salad}
              badge="Zero Waste"
            >
              <div className="space-y-4">
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Don't know what to make tonight? Use the <strong>"Cook with Ingredients"</strong> feature to turn random pantry and fridge leftovers into a delicious meal.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Add Ingredients</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                        Type items like <em>"eggs, tomato, spinach, cheese"</em> or tap the Quick-Add chips.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Get 5 AI Suggestions</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                        ChefSpeak formulates 5 tailored dish ideas that maximize your available ingredients.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-fuchsia-500 text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">One-Tap Cooking</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                        Tap any suggestion card to jump immediately into the voice-narrated assistant with pre-filled ingredients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Section 4: Dietary Protection & Custom Preferences */}
            <AccordionItem
              id="dietary"
              title="Dietary Safeguards & Preferences"
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  ChefSpeak adapts every recipe to your lifestyle and dietary restrictions:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Diet Types
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-400/80 font-medium">
                      Configure your diet as Vegetarian, Vegan, Eggetarian, or Non-Vegetarian.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-1.5 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Non-Veg Protection
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-400/80 font-medium">
                      If you're vegetarian and search for a dish like "Butter Chicken", ChefSpeak warns you and suggests vegetarian alternatives.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50">
                    <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm mb-1.5 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      Allergies & Dislikes
                    </h4>
                    <p className="text-xs text-rose-800 dark:text-rose-400/80 font-medium">
                      Exclude peanuts, dairy, gluten, cilantro, or anything else you prefer to avoid.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50">
                    <h4 className="font-bold text-purple-900 dark:text-purple-300 text-sm mb-1.5 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Skill Level Calibration
                    </h4>
                    <p className="text-xs text-purple-800 dark:text-purple-400/80 font-medium">
                      Beginner, Intermediate, or Advanced — instructions adjust in granularity based on your culinary confidence.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Section 5: Frequently Asked Questions */}
            <AccordionItem
              id="faq"
              title="Frequently Asked Questions"
              icon={HelpCircle}
            >
              <div className="space-y-5 divide-y divide-zinc-200/60 dark:divide-zinc-800">
                <div className="pt-2 first:pt-0 space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Do I need to sign up to use ChefSpeak?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    No! You can use the Assistant and Pantry features immediately as a guest. Creating a free account lets you save favorite dishes, view your recent cook history, and persist dietary preferences across devices.
                  </p>
                </div>

                <div className="pt-5 space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    What if voice narration doesn't play?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    Make sure your device's audio volume is turned up and silent mode is toggled off. If a network interruption occurs, a toast notification will appear and tapping "Repeat" will re-fetch the audio.
                  </p>
                </div>

                <div className="pt-5 space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    How do I scale serving portions?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    On the Assistant recipe form, enter the number of servings (e.g. 2, 4, or 8 people). ChefSpeak recalculates ingredient quantities and cooking times accordingly.
                  </p>
                </div>

                <div className="pt-5 space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Can I ask for custom variations like "spicier" or "low oil"?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    Yes. Use the "Special Notes" field in the form to request modifications like <em>"extra spicy"</em>, <em>"no sugar"</em>, or <em>"air fryer instructions"</em>.
                  </p>
                </div>
              </div>
            </AccordionItem>
          </section>

          {/* Bottom Call to Action Card */}
          <section className="p-8 sm:p-10 rounded-3xl border border-amber-200/80 dark:border-amber-900/30 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-fuchsia-500/10 dark:from-amber-900/10 dark:via-rose-900/10 dark:to-fuchsia-900/10 text-center relative overflow-hidden shadow-sm">
            <div className="relative max-w-xl mx-auto space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-fuchsia-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-fuchsia-500/20 dark:shadow-fuchsia-900/20">
                <ChefHat className="w-8 h-8" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Ready to start cooking?
              </h3>

              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base font-medium">
                Jump into the kitchen and let ChefSpeak handle the guidance and timing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link
                  to="/assistant"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white font-semibold shadow-md hover:shadow-lg active:translate-y-px transition-all text-sm cursor-pointer border-0"
                >
                  <span>Start Cooking</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/ingredients"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-semibold shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 active:translate-y-px transition-all text-sm cursor-pointer"
                >
                  <Salad className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Cook with Ingredients</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
