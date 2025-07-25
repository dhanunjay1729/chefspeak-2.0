// src/components/RecipeForm.jsx
import { useState } from "react";
import { Button } from "./ui/button";

export function RecipeForm({ onSubmit, isLoading }) {
  const [dishName, setDishName] = useState("");
  const [servings, setServings] = useState(2);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dishName.trim()) {
      alert("Please enter a dish name.");
      return;
    }
    await onSubmit({ dishName, servings, notes });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-gray-100 rounded-xl shadow p-6 mb-8 space-y-4"
    >
      <div>
        <label className="block font-semibold mb-1">Dish Name</label>
        <input
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          className="w-full p-2 rounded border border-gray-300"
          placeholder="e.g., Chicken Curry"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Number of People</label>
        <input
          type="number"
          min="1"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className="w-full p-2 rounded border border-gray-300"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Additional Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 rounded border border-gray-300"
          rows="3"
          placeholder="e.g., Make it spicy, use less oil"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Get Recipe"}
      </Button>
    </form>
  );
}