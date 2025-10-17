// src/components/RecipeForm.jsx
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useUserProfile } from "../hooks/useUserProfile";

const VEGETARIAN_DISHES = [
  // Indian Vegetarian Dishes (15)
  "Paneer Lababdar",
  "Dal Makhani",
  "Malai Kofta",
  "Shahi Paneer",
  "Kashmiri Dum Aloo",
  "Bharwan Shimla Mirch",
  "Subz Biryani with Saffron",
  "Palak Paneer",
  "Paneer Butter Masala",
  "Mushroom Do Pyaza",
  "Vegetable Jalfrezi",
  "Navratan Korma",
  "Paneer Tikka Masala",
  "Stuffed Baby Eggplant Curry",
  "Royal Vegetable Biryani",
  
  // International Vegetarian Dishes (25)
  "Truffle Risotto",
  "Wild Mushroom Ravioli",
  "Risotto ai Funghi Porcini",
  "Black Truffle Pasta",
  "Eggplant Parmigiana",
  "Butternut Squash Tortellini",
  "Vegetable Wellington",
  "Mushroom Bourguignon",
  "Truffle Mac and Cheese",
  "Ratatouille Provençale",
  "Spinach and Ricotta Cannelloni",
  "Portobello Mushroom Steak",
  "Artichoke Heart Risotto",
  "Saffron-Infused Vegetable Paella",
  "Asparagus Hollandaise",
  "Grilled Halloumi with Fig Compote",
  "Pumpkin Gnocchi with Sage Butter",
  "Vegetable Tarte Tatin",
  "Truffle Arancini",
  "Goat Cheese Soufflé",
  "Caramelized Onion Tart",
  "Brie en Croûte",
  "Crème Brûlée",
  "Chocolate Soufflé",
  "Tarte Tatin"
];

const NON_VEG_DISHES = [
  // Indian Non-Vegetarian Dishes (25)
  "Butter Chicken",
  "Rogan Josh",
  "Hyderabadi Dum Biryani",
  "Chicken Tikka Masala",
  "Goan Fish Curry",
  "Lamb Korma",
  "Tandoori Pomfret",
  "Awadhi Mutton Biryani",
  "Kadai Chicken",
  "Malabar Prawn Curry",
  "Nalli Gosht",
  "Laal Maas",
  "Tandoori Lobster",
  "Chicken Chettinad",
  "Kolhapuri Mutton",
  "Kerala Fish Moilee",
  "Lucknowi Chicken Korma",
  "Galouti Kebab",
  "Kashmiri Tabak Maaz",
  "Dum Pukht Biryani",
  "Tandoori Salmon",
  "Chicken Dum Biryani",
  "Murg Makhani",
  "Amritsari Fish Tikka",
  "Shikampuri Kebab"
];


export function RecipeForm({ onSubmit, isLoading, initialData }) {
  const { dietType } = useUserProfile();
  const [dishName, setDishName] = useState(initialData?.dishName || "");
  const [servings, setServings] = useState(initialData?.servings || 2);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [isErasing, setIsErasing] = useState(false);

  // Get dishes based on diet type
  const getDishList = () => {
    const isNonVeg = dietType === "non-vegetarian";
    return isNonVeg ? [...VEGETARIAN_DISHES, ...NON_VEG_DISHES] : VEGETARIAN_DISHES;
  };

  // Animated placeholder effect
  useEffect(() => {
    let timeoutId;
    let intervalId;
    
    const getRandomDish = () => {
      const dishes = getDishList();
      return dishes[Math.floor(Math.random() * dishes.length)];
    };

    const typeText = (text) => {
      let index = 0;
      setCurrentPlaceholder("");
      setIsErasing(false);
      
      intervalId = setInterval(() => {
        if (index < text.length) {
          setCurrentPlaceholder(text.substring(0, index + 1));
          index++;
        } else {
          clearInterval(intervalId);
          // Wait 3 seconds before erasing
          timeoutId = setTimeout(() => eraseText(text), 3000);
        }
      }, 50);
    };

    const eraseText = (text) => {
      let index = text.length;
      setIsErasing(true);
      
      intervalId = setInterval(() => {
        if (index > 0) {
          setCurrentPlaceholder(text.substring(0, index - 1));
          index--;
        } else {
          clearInterval(intervalId);
          // Wait 500ms before typing next dish
          timeoutId = setTimeout(() => typeText(getRandomDish()), 500);
        }
      }, 30);
    };

    // Start with first dish
    typeText(getRandomDish());

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [dietType]); // Re-run when dietType changes

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setDishName(initialData.dishName || "");
      setServings(initialData.servings || 2);
      setNotes(initialData.notes || "");
    }
  }, [initialData]);

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
        <label className="block font-semibold mb-1">What do you want to cook?</label>
        <input
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          className="w-full p-2 rounded border border-gray-300"
          placeholder={currentPlaceholder}
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