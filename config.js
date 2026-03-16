// ── Taco Bell DC 50K — Backend Configuration ──
// Supabase anon key is PUBLIC by design (protected by Row Level Security).
// Replace these with your actual Supabase project values.

const TB_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY_HERE',
  // Feature flags — disable features without removing code
  FEATURES: {
    AUTH: true,
    FOOD_LOG: true,
    SOCIAL_FEED: true,
    PARTIES: true,
    BETTING: true,
  },
};

// Taco Bell menu items for food log picker
const TB_MENU_ITEMS = [
  'Chalupa Supreme',
  'Crunchwrap Supreme',
  'Burrito Supreme',
  'Nachos Bell Grande',
  'Cheesy Gordita Crunch',
  'Mexican Pizza',
  'Crunchy Taco',
  'Soft Taco',
  'Bean Burrito',
  'Quesadilla',
  'Cinnamon Twists',
  'Baja Blast',
  'Mountain Dew',
  'Water',
  'Other',
];

// Mandatory food items that satisfy race rules
const TB_MANDATORY_ITEMS = {
  stop3: ['Chalupa Supreme', 'Crunchwrap Supreme'],
  stop7: ['Burrito Supreme', 'Nachos Bell Grande'],
};

// Bet type definitions
const BET_TYPES = {
  finish_time: { label: 'Finish Time', unit: 'hours:minutes' },
  food_items: { label: 'Total Food Items', unit: 'count' },
  bathroom_stops: { label: 'Bathroom Stops', unit: 'count' },
  dnf: { label: 'DNF Prediction', unit: 'yes/no' },
};

// Avatar emoji choices (no file storage needed)
const AVATAR_EMOJIS = [
  '🌮', '🏃', '📣', '🔥', '🌊', '🎉',
  '💀', '🦖', '🍕', '🎵', '🧊', '⚡',
  '🌶️', '🏆', '🐶', '🦅',
];

// localStorage keys synced to cloud preferences
const SYNC_KEYS = [
  'tb50k_theme',
  'tb50k_pace_hours',
  'tb50k_pace_minutes',
  'tb50k_countdown_start_h',
  'tb50k_countdown_start_m',
  'tb50k_food_rule_stop3',
  'tb50k_food_rule_stop7',
  'tb50k_passport',
  'tb50k_pins',
  'tb50k_view_mode',
];

// Party amenity definitions
const PARTY_AMENITIES = [
  { id: 'beer', emoji: '🍺', label: 'Beer' },
  { id: 'shots', emoji: '🥃', label: 'Shots' },
  { id: 'snacks', emoji: '🌮', label: 'Snacks' },
  { id: 'water', emoji: '💧', label: 'Water' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'chairs', emoji: '🪑', label: 'Chairs' },
  { id: 'ice', emoji: '🧊', label: 'Ice' },
  { id: 'portapotty', emoji: '🚽', label: 'Porta-Potty' },
  { id: 'dogs', emoji: '🐶', label: 'Dog Petting Zone' },
  { id: 'medical', emoji: '🏥', label: 'Medical' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Family Zone' },
];
