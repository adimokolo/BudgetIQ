// Shared category icon helpers.
//
// These are copied 1:1 from app/(tabs)/transactions.jsx so the new chart page
// renders category icons exactly the same way. Once you're happy, you can delete
// the duplicates from transactions.jsx and import from here instead:
//
//   import { ICON_OPTIONS, getCategoryIcon, fallbackIconFor } from "../../utils/categoryIcons";

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

// Category icon keys stay unchanged in the shared backend. This mapping only
// changes how they are displayed so mobile matches the frontend icon style.
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

  // Icons picked directly from ICON_OPTIONS are already emoji — return as-is
  // instead of running them through the "-outline" key normalizer below.
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
