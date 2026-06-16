export class DishAnalysisService {
  // Common non-vegetarian keywords
  static NON_VEG_KEYWORDS = [
    // Meat
    'chicken', 'mutton', 'lamb', 'beef', 'pork', 'goat', 'duck', 'turkey',
    'meat', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
    
    // Fish & Seafood
    'fish', 'salmon', 'tuna', 'prawns', 'shrimp', 'crab', 'lobster', 'oyster',
    'sardine', 'mackerel', 'cod', 'tilapia', 'seafood',
    
    // Eggs
    'egg', 'eggs', 'omelette', 'omelet', 'scrambled', 'boiled egg',
    
    // Hindi/Regional terms
    'murgh', 'murghi', 'bakra', 'gosht', 'keema', 'tandoori chicken',
    'butter chicken', 'chicken tikka', 'biryani chicken', 'fish curry',
    'prawn curry', 'egg curry', 'mutton curry',
    
    // Popular non-veg dish combos (only ones that are ALWAYS non-veg)
    'shawarma',
  ];

  static isNonVegDish(dishName) {
    if (!dishName || typeof dishName !== 'string') return false;
    
    const lowercaseDish = dishName.toLowerCase().trim();
    
    // Check if any non-veg keyword is present
    return this.NON_VEG_KEYWORDS.some(keyword => 
      lowercaseDish.includes(keyword.toLowerCase())
    );
  }

  static getDetectedNonVegIngredients(dishName) {
    if (!dishName || typeof dishName !== 'string') return [];
    
    const lowercaseDish = dishName.toLowerCase().trim();
    
    return this.NON_VEG_KEYWORDS.filter(keyword => 
      lowercaseDish.includes(keyword.toLowerCase())
    );
  }
}