// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Header from "../components/Header";
import { LogOut, Save, X, Loader2, AlertCircle, Info } from "lucide-react";

const LANGS = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
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

  const [form, setForm] = useState({
    displayName: "",
    preferredLanguage: "en",
    skill: "beginner",
    diet: "nonveg", // Changed default to "nonveg"
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
        preferredLanguage: data.preferredLanguage || "en",
        skill: data.skill || "beginner",
        diet: data.diet || "nonveg", // Changed default to "nonveg"
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

  const confirmDietChange = () => {
    if (pendingDietChange) {
      setField("diet", pendingDietChange);
      setPendingDietChange(null);
      setShowDietChangeWarning(false);
    }
  };

  const cancelDietChange = () => {
    setPendingDietChange(null);
    setShowDietChangeWarning(false);
  };

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
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
          <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-40 bg-zinc-200 rounded" />
                <div className="h-40 bg-zinc-200 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-12 bg-zinc-200 rounded" />
                  <div className="h-12 bg-zinc-200 rounded" />
                  <div className="h-12 bg-zinc-200 rounded" />
                  <div className="h-12 bg-zinc-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentDietOption = DIET_OPTIONS.find(d => d.value === form.diet);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-8 md:py-10 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              Your{" "}
              <span className="bg-gradient-to-r from-fuchsia-600 to-amber-600 bg-clip-text text-transparent">
                Profile
              </span>
            </h1>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 shadow-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Diet Change Warning Modal */}
          {showDietChangeWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="text-amber-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                      Change Dietary Preference?
                    </h3>
                    <p className="text-sm text-zinc-600 mb-3">
                      You're switching to <span className="font-semibold">{DIET_OPTIONS.find(d => d.value === pendingDietChange)?.label}</span>. 
                      This means:
                    </p>
                    <ul className="text-sm text-zinc-600 space-y-1 list-disc list-inside mb-3">
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
                    <p className="text-xs text-zinc-500">
                      Future recipe suggestions will respect this preference.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={cancelDietChange}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDietChange}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-600 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* Top form section */}
            <div className="p-6 border-b border-zinc-200">
              <div className="grid gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Display name
                  </div>
                  <input
                    value={form.displayName}
                    onChange={(e) => setField("displayName", e.target.value)}
                    placeholder="Your name"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Preferred language
                    </div>
                    <select
                      value={form.preferredLanguage}
                      onChange={(e) => setField("preferredLanguage", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    >
                      {LANGS.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Cooking skill
                    </div>
                    <select
                      value={form.skill}
                      onChange={(e) => setField("skill", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Diet preference
                    </div>
                    <select
                      value={form.diet}
                      onChange={(e) => handleDietChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
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
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">
                      <span className="font-semibold">{currentDietOption.label}:</span>{" "}
                      {currentDietOption.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences form */}
            <div className="p-6 grid grid-cols-1 gap-6">
              <div>
                <div className="text-sm font-medium text-zinc-900 mb-2">
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
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Comma-separated list. Recipes will exclude these ingredients.
                </p>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-900 mb-2">
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
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Comma-separated list. Recipes will avoid these ingredients when possible.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  disabled={!dirty || saving}
                  onClick={() => setForm(initial)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  disabled={!dirty || saving}
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95 active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
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
    </>
  );
}
