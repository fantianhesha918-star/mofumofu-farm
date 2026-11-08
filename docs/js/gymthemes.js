// ジムごとの みため(いろ・ひかり・きり)。パーツは どれも ニュートラルな いろで、ここの いろを かけあわせる
// sky=はいけい/きり hemi=[そらいろ, じめんいろ, つよさ] sun=[いろ, つよさ] wall/floor/ice/arrow/rock/accent=いろ ground=へやの そとの じめん
export const GYM_THEMES = {
  forest:  { name: 'もりの ジム', sky: '#a8d89a', fogN: 30, fogF: 80, hemi: [0xeaffd8, 0x4a6a38, 1.45], sun: [0xfff2c0, 2.0], wall: '#6fae5a', floor: '#d3dcb4', accent: '#ffe9a0', rock: '#d4d4cc', ground: '#4a7a3c' },
  lake:    { name: 'みずうみの ジム', sky: '#bfe4f4', fogN: 30, fogF: 80, hemi: [0xe6f6ff, 0x6a8aa8, 1.5], sun: [0xffffff, 2.0], wall: '#8fb8d8', floor: '#d4e6f2', ice: '#d6efff', arrow: '#d8f0ff', accent: '#a8e8ff', rock: '#cfd8e0', ground: '#6a9ec0' },
  volcano: { name: 'ようがんの ジム', sky: '#5a2a1a', fogN: 26, fogF: 70, hemi: [0xffe4c8, 0x7a3a20, 1.45], sun: [0xffb070, 2.0], wall: '#7a5646', floor: '#d8b8a0', accent: '#ffb060', rock: '#d8c4b8', ground: '#4a2010' },
  ghost:   { name: 'ゆうれいの ジム', sky: '#2c2652', fogN: 18, fogF: 60, hemi: [0xe4e0ff, 0x6a64a0, 2.0], sun: [0xc8c4ff, 1.9], wall: '#8a84b8', floor: '#b0aad8', accent: '#a8f0ff', rock: '#d8d4f0', ground: '#3a3466', exposure: 1.1 },
  sky:     { name: 'てんくうの ジム', sky: '#9ad0ff', fogN: 40, fogF: 110, hemi: [0xffffff, 0xaaccee, 1.55], sun: [0xffffff, 2.1], wall: '#e4ecf8', floor: '#d6e6fa', arrow: '#cfe8ff', accent: '#ffffff', rock: '#f0f0f8', ground: '#c8e4ff' },
  sun:     { name: 'たいようの ジム', sky: '#ffd89a', fogN: 34, fogF: 90, hemi: [0xfff0d0, 0xc89a50, 1.5], sun: [0xfff0b0, 2.3], wall: '#d8a45a', floor: '#f4dfa8', accent: '#fff0a0', rock: '#e8d4a8', ground: '#c89a50' },
  cosmos:  { name: 'うちゅうの ジム', sky: '#1a2060', fogN: 24, fogF: 72, hemi: [0xc8d8ff, 0x4a5a9a, 1.8], sun: [0xc0d4ff, 1.9], wall: '#3e4e90', floor: '#8e9ede', arrow: '#aad0ff', accent: '#8ad0ff', rock: '#c8d4f4', ground: '#0e1440' },
  grove:   { name: 'しんじゅの ジム', sky: '#3a6a50', fogN: 24, fogF: 68, hemi: [0xd8ffe4, 0x3a6a48, 1.45], sun: [0xf0ffd8, 1.8], wall: '#4e8056', floor: '#b0cc9c', accent: '#b8ffb0', rock: '#d8dccc', ground: '#2a4a38' },
  castle:  { name: 'やみの ジム', sky: '#2a2044', fogN: 18, fogF: 56, hemi: [0xdccaff, 0x5a4a80, 2.0], sun: [0xe0c4ff, 1.8], wall: '#443a54', floor: '#9a8cbc', accent: '#c898ff', rock: '#d0c8e0', ground: '#1c1630' },
  temple:  { name: 'ほしの ジム', sky: '#1e2458', fogN: 22, fogF: 64, hemi: [0xdce4ff, 0x5a6aa8, 1.7], sun: [0xffecc0, 1.9], wall: '#5e6cac', floor: '#aab4e0', accent: '#ffe9a0', rock: '#dcdff2', ground: '#141a44' },
  dragon:  { name: 'せいりゅうの ジム', sky: '#14403c', fogN: 22, fogF: 64, hemi: [0xd0fff4, 0x2c6a66, 1.5], sun: [0xc0ffec, 1.8], wall: '#307470', floor: '#8cc8c0', arrow: '#b8fff0', accent: '#7affd8', rock: '#d0eae4', ground: '#0c2a28' },
  end:     { name: 'うちゅうの はての ジム', sky: '#1c1038', fogN: 20, fogF: 62, hemi: [0xf0e0ff, 0x6a5a98, 1.75], sun: [0xffe0ff, 1.9], wall: '#60408c', floor: '#b498e4', ice: '#e4d0ff', arrow: '#f0d8ff', accent: '#ffd8ff', rock: '#e4d8f4', ground: '#0e0a22' },
};
