// Define and export allowed value lists for jewelry attributes

export const allowedStones = [
    "Blue Sapphire", "Diamond", "Topaz", "Ruby", "Color Diamond", "Aquamarine",
    "Peridot", "Citrine", "Garnet", "Amethyst", "Emerald", "White Sapphire",
    "Pearl", "Sapphire - Other", "Tanzanite", "Onyx", "Jade", "Opal",
    "Multi Stone (Personalized)", "Morganite", "Crystal (Swarovski)", "Alexandrite",
    "Rhodolite", "Zircon", "Cubic Zirconia", "Tourmaline", "Crystal", "Moissanite",
    "Lapis", "Tiger eye", "Hematite", "Sodalite", "Howlite", "Quartz", "Pink Sapphire",
    "Cats Eye", "Malachite", "Mother of Pearl", "Turquoise", "Jasper", "Gold Sand",
    "Spinel", "London Blue Topaz", "Green Amethyst", "Moonstone", "Amazonite",
    "Labradorite", "Rutilated Quartz", "Other", "Ametrine", "Agate", "Iolite",
    "Oregon Sunstone", "Umba Sapphire", "Apatite", "Blue Topaz", "garnet", "Blue Diamond",
    "none"
] as const;

export const allowedStoneColors = [
    "White", "Blue", "Red", "Black", "Yellow", "Purple", "Green", "Pink",
    "London Blue", "Champagne", "Brown", "Multi-Color", "OP", "Near-colorless",
    "Gray", "Orange", "Diamond", "Peach", "Cream", "Color-changing", "L",
    "Fancy Pink", "Fancy Blue", "Colorless", "D", "FG"
] as const;

export const allowedCaratWeights = [
    "1/4 ctw", "1/2 ctw", "1 ctw", "<1/10 ctw", "1/3 ctw", "1/10 ctw", "1/5 ctw",
    "1/8 ctw", "3/4 ctw", "1/7 ctw", "3 ctw", "2 ctw", "1 1/2 ctw", "3/8 ctw",
    "1 1/4 ctw", "1 1/3 ctw", "5/8 ctw", "7/8 ctw", "5 ctw", "1 3/8 ctw", "1 7/8 ctw",
    "Over 6 ctw", "1 5/8 ctw", "2 1/8 ctw", "1 1/8 ctw", "4 ctw", "3 1/2 ctw",
    "1 3/4 ctw", "2 1/2 ctw", "2 1/4 ctw", "6 ctw", "8 ctw", "1 1/5 ctw", "1 1/7 ctw",
    "3 3/4 ctw", "2 3/8 ctw", "2 1/5 ctw", "7 ctw", "3 1/7 ctw", "2 5/8 ctw",
    "2 1/7 ctw", "2 1/3 ctw", "3 1/3 ctw", "Over 10 ctw", "2 3/4 ctw", "2 7/8 ctw",
    "3 1/4 ctw", "9 ctw", "3 7/8 ctw", "10 ctw", "3 5/8 ctw", "3 3/8 ctw", "3 1/5 ctw",
    "10 1/7 ctw (10.14 -10.1799)", "8 7/8 ctw (8.80 - 8.9499)", "8 1/2 ctw (8.45 - 8.5899)",
    "7 7/8 ctw (7.80 - 7.9499)", "7 1/2 ctw (7.45 - 7.5899)", "9 3/4 ctw (9.70 - 9.7999)",
    "10 3/8 ctw (10.37 -10.4499)", "ctw"
] as const;

export const allowedGenders = ["Women", "Unisex", "Men", "Child"] as const;

export const allowedMetalGroups = [
    "Yellow Gold", "Gold", "White Gold", "Sterling Silver", "Stainless Steel",
    "Rose Gold", "Base metal", "Base Metal", "Platinum", "Titanium", "Tungsten",
    "Elysium", "Zirconium", "Meteorite", "Damascus Steel", "Cobalt", "Tantalum",
    "Gray Gold", "Wood", "Pink Gold", "Vermeil", "Two-tone W/Y Gold", "Black Gold"
] as const;

export const allowedRingStyles = [
    "Side-Stone", "Solitaire", "Halo", "Three-Stone", "Bridal Set",
    "Gemstone Engagement", "Vintage"
] as const;

export const allowedCategories = ["engagement rings", "wedding bands", "anniversary rings", "rings", "necklaces", "earrings", "bracelets", "watches", "pendants"] as const;

export const allowedPriceTiers = ["cheap", "medium", "expensive"] as const;
