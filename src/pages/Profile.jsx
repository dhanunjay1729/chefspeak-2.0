// src/pages/Profile.jsx
// User profile page for viewing and editing personal information and preferences.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Header from "../components/Header";
import { LogOut, Save, X, Loader2, AlertCircle, Info, Check } from "lucide-react"; // ✅ Add Check
import { FullPageLoader } from "../components/LoadingSpinner"; // ✅ Import

// Updated language list to match all supported TTS languages in index.js
const LANGS = [
  // Indian Languages
  { code: "Indian_english", name: "Indian English" },
  { code: "hindi", name: "Hindi" },
  { code: "telugu", name: "Telugu" },
  { code: "tamil", name: "Tamil" },
  { code: "kannada", name: "Kannada" },
  { code: "malayalam", name: "Malayalam" },
  { code: "marathi", name: "Marathi" },
  { code: "gujarati", name: "Gujarati" },
  { code: "bengali", name: "Bengali" },
  { code: "punjabi", name: "Punjabi" },
  
  // International Languages
  { code: "US_english", name: "US English" },
  { code: "UK_english", name: "UK English" },
  { code: "spanish", name: "Spanish" },
  { code: "french", name: "French" },
  { code: "german", name: "German" },
  { code: "italian", name: "Italian" },
  { code: "japanese", name: "Japanese" },
  { code: "chinese", name: "Chinese (Mandarin)" },
  { code: "russian", name: "Russian" },
];

const DIET_OPTIONS = [
  { 
    value: "nonveg", 
    label: "Non-Vegetarian",
    description: "Includes all foods including meat, fish, and poultry"
  },
  { 
    value: "veg", 
    label: "Vegetarian",
    description: "Excludes meat, fish, and poultry"
  },
  { 
    value: "vegan", 
    label: "Vegan",
    description: "Excludes all animal products including dairy and eggs"
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDietChangeWarning, setShowDietChangeWarning] = useState(false);
  const [pendingDietChange, setPendingDietChange] = useState(null);
  
  // ✅ ADD: Toast notification state
  const [showSaveToast, setShowSaveToast] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    preferredLanguage: "Indian_english", // Changed default to match index.js
    skill: "beginner",
    diet: "nonveg",
    allergies: [],
    dislikes: [],
  });
  const [initial, setInitial] = useState(form);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    (async () => {
      setLoading(true);
      const refDoc = doc(db, "users", user.uid);
      const snap = await getDoc(refDoc);
      const data = snap.exists() ? snap.data() : {};
      const seed = {
        displayName: data.displayName || user.displayName || "",
        preferredLanguage: data.preferredLanguage || "indian_english", // Changed default
        skill: data.skill || "beginner",
        diet: data.diet || "nonveg",
        allergies: data.allergies || [],
        dislikes: data.dislikes || [],
      };
      setForm(seed);
      setInitial(seed);
      setLoading(false);
    })();
  }, [user, navigate]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Check if diet change would be restrictive (nonveg -> veg/vegan)
  const handleDietChange = (newDiet) => {
    const currentDiet = form.diet;
    
    // If changing from nonveg to veg/vegan, show warning
    if (currentDiet === "nonveg" && (newDiet === "veg" || newDiet === "vegan")) {
      setPendingDietChange(newDiet);
      setShowDietChangeWarning(true);
    } 
    // If changing from veg to vegan, show warning
    else if (currentDiet === "veg" && newDiet === "vegan") {
      setPendingDietChange(newDiet);
      setShowDietChangeWarning(true);
    }
    // Otherwise, change directly
    else {
      setField("diet", newDiet);
    }
  };

  // Confirm the diet change after warning
  const confirmDietChange = () => {
    if (pendingDietChange) {
      setField("diet", pendingDietChange);
      setPendingDietChange(null);
      setShowDietChangeWarning(false);
    }
  };

  // Cancel the diet change
  const cancelDietChange = () => {
    setPendingDietChange(null);
    setShowDietChangeWarning(false);
  };

  // Save profile changes to Firestore
  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    const refDoc = doc(db, "users", user.uid);
    const snap = await getDoc(refDoc);
    const payload = { ...form, updatedAt: Date.now() };
    if (snap.exists()) await updateDoc(refDoc, payload);
    else await setDoc(refDoc, { ...payload, createdAt: Date.now() });
    setSaving(false);
    setInitial(form);
    
    // ✅ Show success toast
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000); // Hide after 3 seconds
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // ✅ ADD: Function to go back to previous page
  const handleCancel = () => {
    setForm(initial); // Reset form
    navigate(-1); // Go back to previous page
  };

  // ✅ SHOW FULL-PAGE LOADER
  if (loading) {
    return <FullPageLoader text="Loading your profile..." />;
  }

  const currentDietOption = DIET_OPTIONS.find(d => d.value === form.diet);

  return (
    <>
      <Header />
      
      {/* ✅ Success Toast Notification */}
      {showSaveToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-emerald-200 p-4 pr-12 max-w-sm">
            {/* Gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 
                          blur-xl rounded-2xl -z-10 animate-pulse" />
            
            {/* Content */}
            <div className="flex items-start gap-3">
              {/* Animated checkmark icon */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 
                              flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Check size={20} className="text-white animate-in zoom-in duration-300" strokeWidth={3} />
                </div>
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
              </div>
              
              {/* Text */}
              <div className="flex-1 pt-1">
                <h4 className="text-sm font-semibold text-zinc-900 mb-0.5">
                  Profile Updated! 🎉
                </h4>
                <p className="text-xs text-zinc-600">
                  Your preferences have been saved successfully.
                </p>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setShowSaveToast(false)}
                className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-zinc-100 
                         active:bg-zinc-200 transition-colors group"
                aria-label="Close notification"
              >
                <X size={14} className="text-zinc-400 group-hover:text-zinc-600" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100 rounded-b-2xl overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 
                            animate-progress origin-left rounded-b-2xl shadow-lg" 
                   style={{ animation: 'progress 3s linear forwards' }} />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 transition-colors">
        <div className="mx-auto max-w-4xl px-4 py-8 md:py-10 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Your{" "}
              <span className="bg-gradient-to-r from-fuchsia-600 to-amber-600 dark:from-fuchsia-400 dark:to-amber-400 bg-clip-text text-transparent">
                Profile
              </span>
            </h1>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 shadow-sm transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Diet Change Warning Modal */}
          {showDietChangeWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-zinc-200/60 dark:border-zinc-800 max-w-md w-full p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      Change Dietary Preference?
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      You're switching to <span className="font-semibold text-zinc-900 dark:text-zinc-200">{DIET_OPTIONS.find(d => d.value === pendingDietChange)?.label}</span>. 
                      This means:
                    </p>
                    <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside mb-3">
                      {pendingDietChange === "veg" && (
                        <>
                          <li>No meat, fish, or poultry in recipes</li>
                          <li>Dairy and eggs are still included</li>
                        </>
                      )}
                      {pendingDietChange === "vegan" && (
                        <>
                          <li>No animal products whatsoever</li>
                          <li>No meat, fish, poultry, dairy, eggs, or honey</li>
                        </>
                      )}
                    </ul>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      Future recipe suggestions will respect this preference.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={cancelDietChange}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDietChange}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-600 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                  >
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden">
            {/* Top form section */}
            <div className="p-6 md:p-8 border-b border-zinc-200/60 dark:border-zinc-800">
              <div className="grid gap-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Display name
                  </div>
                  <input
                    value={form.displayName}
                    onChange={(e) => setField("displayName", e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Preferred language
                    </div>
                    <select
                      value={form.preferredLanguage}
                      onChange={(e) => setField("preferredLanguage", e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 transition-all"
                    >
                      <optgroup label="Indian Languages">
                        {LANGS.filter(l => 
                          ['Indian_english', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi'].includes(l.code)
                        ).map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="International Languages">
                        {LANGS.filter(l => 
                          ['US_english', 'UK_english', 'spanish', 'french', 'german', 'italian', 'japanese', 'chinese', 'russian'].includes(l.code)
                        ).map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Cooking skill
                    </div>
                    <select
                      value={form.skill}
                      onChange={(e) => setField("skill", e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 transition-all"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Diet preference
                    </div>
                    <select
                      value={form.diet}
                      onChange={(e) => handleDietChange(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 transition-all"
                    >
                      {DIET_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diet info banner */}
                {currentDietOption && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 shadow-sm">
                    <Info size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <span className="font-bold">{currentDietOption.label}:</span>{" "}
                      {currentDietOption.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences form */}
            <div className="p-6 md:p-8 grid grid-cols-1 gap-8">
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Allergies
                </div>
                <input
                  value={form.allergies.join(", ")}
                  onChange={(e) =>
                    setField(
                      "allergies",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="e.g., peanuts, dairy, shellfish"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  Comma-separated list. Recipes will exclude these ingredients.
                </p>
              </div>

              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Dislikes
                </div>
                <input
                  value={form.dislikes.join(", ")}
                  onChange={(e) =>
                    setField(
                      "dislikes",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="e.g., olives, cilantro, mushrooms"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  Comma-separated list. Recipes will avoid these ingredients when possible.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200/60 dark:border-zinc-800 mt-2">
                <button
                  disabled={!dirty || saving}
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  disabled={!dirty || saving}
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition-all border-0"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add animation keyframes */}
      <style jsx>{`
        @keyframes progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </>
  );
}
