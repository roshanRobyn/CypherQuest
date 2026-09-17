// Hardcoded Japanese -> English dictionary for the treasure hunt translator.
// Add new entries here; lookup is case-insensitive and trims whitespace.
// Each entry: japanese term -> { romaji, en }

export const TRANSLATIONS = {
  "風": { romaji: "Kaze", en: "Wind" },
  "大浜漁村": { romaji: null, en: "OHAMA FISHING VILLAGE" },

  // Location names (Japanese clues may reference these)
  "先守見晴らし": { romaji: "Sakimori Overlook", en: "Sakimori Overlook" },
  "射手の丘": { romaji: "Archer's Rise", en: "Archer's Rise" },
  "樫音丘陵": { romaji: "Kashine Hills", en: "Kashine Hills" },
  "樫音の森": { romaji: "Kashine Forest", en: "Kashine Forest" },
  "筒平野": { romaji: "Tsutsu Plains", en: "Tsutsu Plains" },
  "久田草原": { romaji: "Kuta Grasslands", en: "Kuta Grasslands" },
  "厳原の空き地": { romaji: "Izuhara Clearing", en: "Izuhara Clearing" },
  "追放者の断崖": { romaji: "Exile's Bluff", en: "Exile's Bluff" },
  "狼仔の滝": { romaji: "Wolf Cub Falls", en: "Wolf Cub Falls" },
  "茶色い川峡谷": { romaji: "Brown River Gorge", en: "Brown River Gorge" },
  "磯撫の海岸": { romaji: "Isonade Coast", en: "Isonade Coast" },
  "麻生麓": { romaji: "Azamo Foothills", en: "Azamo Foothills" },
  "黄金の森": { romaji: "Golden Forest", en: "Golden Forest" },
  "翡翠丘陵": { romaji: "Jade Hills", en: "Jade Hills" },
  "老木樵の天蓋": { romaji: "Old Woodsman's Canopy", en: "Old Woodsman's Canopy" },
  "けち漁村": { romaji: "Kechi Fishing Village", en: "Kechi Fishing Village" },
  "急流渡り": { romaji: "Rushing Water Crossing", en: "Rushing Water Crossing" },
  "旅人の宿": { romaji: "Traveler's Rest Inn", en: "Traveler's Rest Inn" },
  "小松鍛冶場": { romaji: "Komatsu Forge", en: "Komatsu Forge" },
  "八潟農場": { romaji: "Yagata Farmstead", en: "Yagata Farmstead" },
  "青井村": { romaji: "Aoi Village", en: "Aoi Village" },
};

export function translate(input) {
  const key = (input || "").trim();
  if (!key) return null;
  return TRANSLATIONS[key] || null;
}
