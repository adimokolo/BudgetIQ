export const ICON_OPTIONS = [
  "🍔",
  "🍽️",
  "☕",
  "🍺",
  "🛒",
  "🧺",
  "🚌",
  "🚗",
  "🚲",
  "🚂",
  "✈️",
  "🏠",
  "🛏️",
  "⚡",
  "💧",
  "📶",
  "📞",
  "📱",
  "💻",
  "🏥",
  "🏃",
  "🏋️",
  "🏫",
  "📚",
  "🎬",
  "🎵",
  "🎮",
  "🎁",
  "👕",
  "✂️",
  "🐾",
  "💎",
  "👛",
  "💳",
  "💵",
  "📈",
  "💼",
  "🏢",
  "🛠️",
  "❤️",
  "🏷️",
];

export const CATEGORY_ICON_MAP = {
  "fast-food-outline": "🍔",
  "restaurant-outline": "🍽️",
  "cafe-outline": "☕",
  "beer-outline": "🍺",
  "cart-outline": "🛒",
  "basket-outline": "🧺",
  "bus-outline": "🚌",
  "car-outline": "🚗",
  "bicycle-outline": "🚲",
  "train-outline": "🚆",
  "airplane-outline": "✈️",
  "home-outline": "🏠",
  "bed-outline": "🛏️",
  "flash-outline": "⚡",
  "water-outline": "💧",
  "wifi-outline": "📶",
  "call-outline": "📞",
  "phone-portrait-outline": "📱",
  "laptop-outline": "💻",
  "medkit-outline": "🩺",
  "fitness-outline": "🏃",
  "barbell-outline": "🏋️",
  "school-outline": "🎓",
  "book-outline": "📚",
  "film-outline": "🎬",
  "musical-notes-outline": "🎵",
  "game-controller-outline": "🎮",
  "gift-outline": "🎁",
  "shirt-outline": "👕",
  "cut-outline": "✂️",
  "paw-outline": "🐾",
  "diamond-outline": "💎",
  "wallet-outline": "👛",
  "card-outline": "💳",
  "cash-outline": "💵",
  "trending-up-outline": "📈",
  "briefcase-outline": "💼",
  "business-outline": "🏢",
  "construct-outline": "🛠️",
  "heart-outline": "❤️",
  "ellipsis-horizontal-outline": "•••",
  "pricetag-outline": "🏷️",
};

export function getCategoryIcon(iconName) {
  if (!iconName) return CATEGORY_ICON_MAP["pricetag-outline"];

  if (ICON_OPTIONS.includes(iconName)) return iconName;

  const normalizedName = iconName.endsWith("-outline")
    ? iconName
    : `${iconName}-outline`;

  return (
    CATEGORY_ICON_MAP[iconName] ||
    CATEGORY_ICON_MAP[normalizedName] ||
    CATEGORY_ICON_MAP["pricetag-outline"]
  );
}

export function fallbackIconFor(type) {
  return type?.toLowerCase() === "income" ? "💵" : "🏷️";
}
