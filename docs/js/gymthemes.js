// ジムごとの みため(いろ・ひかり・きり)。パーツは どれも ニュートラルな いろで、ここの いろを かけあわせる
// sky=はいけい/きり hemi=[そらいろ, じめんいろ, つよさ] sun=[いろ, つよさ] wall/floor/ice/arrow/rock/accent=いろ ground=へやの そとの じめん
export const GYM_THEMES = {
  forest:  { name: 'もりの ジム', sky: '#a8d89a', fogN: 30, fogF: 80, hemi: [0xeaffd8, 0x4a6a38, 1.45], sun: [0xfff2c0, 2.0], wall: '#6fae5a', floor: '#d3dcb4', accent: '#ffe9a0', rock: '#d4d4cc', ground: '#4a7a3c' },
  lake:    { name: 'みずうみの ジム', sky: '#bfe4f4', fogN: 30, fogF: 80, hemi: [0xe6f6ff, 0x6a8aa8, 1.5], sun: [0xffffff, 2.0], wall: '#8fb8d8', floor: '#d4e6f2', ice: '#d6efff', arrow: '#d8f0ff', accent: '#a8e8ff', rock: '#cfd8e0', ground: '#6a9ec0' },
  volcano: { name: 'ようがんの ジム', sky: '#3a1a10', fogN: 22, fogF: 62, hemi: [0xffd8b0, 0x502010, 1.25], sun: [0xff9a50, 1.8], wall: '#7a5646', floor: '#a08878', accent: '#ffb060', rock: '#c8b4a8', ground: '#2a1008' },
  ghost:   { name: 'ゆうれいの ジム', sky: '#10101e', fogN: 12, fogF: 44, hemi: [0xb8b8f0, 0x3a3a60, 1.9], sun: [0x9aaaff, 1.7], wall: '#5a5676', floor: '#7a7694', accent: '#a8f0ff', rock: '#b8b4cc', ground: '#1c1c30', exposure: 1.1 },
  sky:     { name: 'てんくうの ジム', sky: '#9ad0ff', fogN: 40, fogF: 110, hemi: [0xffffff, 0xaaccee, 1.55], sun: [0xffffff, 2.1], wall: '#e4ecf8', floor: '#f2f4ff', arrow: '#cfe8ff', accent: '#ffffff', rock: '#f0f0f8', ground: '#c8e4ff' },
  sun:     { name: 'たいようの ジム', sky: '#ffd89a', fogN: 34, fogF: 90, hemi: [0xfff0d0, 0xc89a50, 1.5], sun: [0xfff0b0, 2.3], wall: '#d8a45a', floor: '#f4dfa8', accent: '#fff0a0', rock: '#e8d4a8', ground: '#c89a50' },
  cosmos:  { name: 'うちゅうの ジム', sky: '#080c28', fogN: 20, fogF: 66, hemi: [0xb4c8ff, 0x30407a, 1.6], sun: [0xa8c4ff, 1.7], wall: '#3e4e90', floor: '#6272b4', arrow: '#aad0ff', accent: '#8ad0ff', rock: '#b8c4ec', ground: '#050818' },
  grove:   { name: 'しんじゅの ジム', sky: '#2a4a38', fogN: 20, fogF: 62, hemi: [0xd0ffd8, 0x2a4a30, 1.3], sun: [0xe8ffd0, 1.7], wall: '#4e8056', floor: '#98b484', accent: '#b8ffb0', rock: '#c8d0bc', ground: '#1c3426' },
  castle:  { name: 'やみの ジム', sky: '#14101c', fogN: 14, fogF: 48, hemi: [0xc8b4f0, 0x382c52, 1.85], sun: [0xd0acff, 1.6], wall: '#443a54', floor: '#625874', accent: '#c898ff', rock: '#bcb4cc', ground: '#0c0a14' },
  temple:  { name: 'ほしの ジム', sky: '#141838', fogN: 18, fogF: 58, hemi: [0xd4dcff, 0x40508a, 1.5], sun: [0xffe8b0, 1.8], wall: '#5e6cac', floor: '#909cce', accent: '#ffe9a0', rock: '#d0d4ec', ground: '#0c1028' },
  dragon:  { name: 'せいりゅうの ジム', sky: '#0c2428', fogN: 18, fogF: 58, hemi: [0xc0fff0, 0x1c4a48, 1.25], sun: [0xb0ffe8, 1.6], wall: '#307470', floor: '#62a4a0', arrow: '#b8fff0', accent: '#7affd8', rock: '#c4e4de', ground: '#08181a' },
  end:     { name: 'うちゅうの はての ジム', sky: '#0a0618', fogN: 16, fogF: 56, hemi: [0xe8d4ff, 0x4a3a72, 1.55], sun: [0xffd8ff, 1.8], wall: '#60408c', floor: '#8e70c4', ice: '#e4d0ff', arrow: '#f0d8ff', accent: '#ffd8ff', rock: '#d8c8ec', ground: '#06040f' },
};
