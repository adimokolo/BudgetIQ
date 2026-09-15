export const ICON_MAP = {
  'fast-food-outline':          '🍔',
  'restaurant-outline':         '🍽️',
  'cafe-outline':               '☕',
  'beer-outline':               '🍺',
  'cart-outline':               '🛒',
  'basket-outline':             '🧺',
  'bus-outline':                '🚌',
  'car-outline':                '🚗',
  'bicycle-outline':            '🚲',
  'train-outline':              '🚂',
  'airplane-outline':           '✈️',
  'home-outline':               '🏠',
  'bed-outline':                '🛏️',
  'flash-outline':              '⚡',
  'water-outline':              '💧',
  'wifi-outline':               '📶',
  'call-outline':               '📞',
  'phone-portrait-outline':     '📱',
  'laptop-outline':             '💻',
  'medkit-outline':             '🏥',
  'fitness-outline':            '🏃',
  'barbell-outline':            '🏋️',
  'school-outline':             '🏫',
  'book-outline':               '📚',
  'film-outline':               '🎬',
  'musical-notes-outline':      '🎵',
  'game-controller-outline':    '🎮',
  'gift-outline':               '🎁',
  'shirt-outline':              '👕',
  'cut-outline':                '✂️',
  'paw-outline':                '🐾',
  'diamond-outline':            '💎',
  'wallet-outline':             '👛',
  'card-outline':               '💳',
  'cash-outline':               '💵',
  'trending-up-outline':        '📈',
  'briefcase-outline':          '💼',
  'business-outline':           '🏢',
  'construct-outline':          '🔧',
  'heart-outline':              '❤️',
  'ellipsis-horizontal-outline':'•••',
  'pricetag-outline':           '🏷️',
  'tag':                        '🏷️',
};

export function getIcon(iconKey) {
  return ICON_MAP[iconKey] || '🏷️';
}

export function fallbackIconFor(type) {
  return type?.toLowerCase() === 'income' ? 'cash-outline' : 'pricetag-outline';
}
