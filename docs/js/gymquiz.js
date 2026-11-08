// ジムの クイズの とびら。こたえの アイテムを わたすと ひらく(わたした アイテムは なくなる)
// ans=こたえの アイテムID / opts=えらぶ アイテムID(4つ) / q=もんだい(1ぎょうずつ) / hint=まちがえた ときの ヒント
export const GYM_QUIZ = {
  forest:  { q: ['もりの じめんに はえる、', 'かさを かぶった ものは なあに?'], ans: 'mushroom', opts: ['mushroom', 'acorn', 'berry', 'hay'], hint: 'じめんから にょきっと はえて、かさが ある ものだよ' },
  lake:    { q: ['かわや みずうみに すむ、', 'きんぎょの ごせんぞの さかなは?'], ans: 'funa', opts: ['funa', 'iwashi', 'aji', 'saba'], hint: 'うみではなく、かわや いけで つれる さかなだよ' },
  volcano: { q: ['あつい ひで やくと あまい。', 'きいろい つぶつぶの やさいは?'], ans: 'corn', opts: ['corn', 'cabbage', 'carrot', 'eggplant'], hint: 'きいろくて つぶが ぎっしり ならんでいるよ' },
  ghost:   { q: ['ハロウィンで かおを くりぬく', 'おおきな オレンジの やさいは?'], ans: 'pumpkin', opts: ['pumpkin', 'tomato', 'cabbage', 'carrot'], hint: 'ランタンに する、まるくて おおきい やさいだよ' },
  sky:     { q: ['かぜに のって わたげが とぶ、', 'きいろい はなは?'], ans: 'dandelion', opts: ['dandelion', 'hay', 'acorn', 'berry'], hint: 'しろい わたげが ふわふわ とんでいく はなだよ' },
  sun:     { q: ['たいように にた あかくて まるい', 'オムレツにも あう やさいは?'], ans: 'tomato', opts: ['tomato', 'eggplant', 'carrot', 'cabbage'], hint: 'あかくて まるくて、ジューシーな やさいだよ' },
  cosmos:  { q: ['うちゅうの ように むらさきいろの', 'ほそながい やさいは?'], ans: 'eggplant', opts: ['eggplant', 'tomato', 'pumpkin', 'corn'], hint: 'つやつやした むらさきいろの やさいだよ' },
  grove:   { q: ['うみで ひろえる、', 'ふたつ ならんだ きれいな いれものは?'], ans: 'seashell', opts: ['seashell', 'conch', 'seaweed', 'nori'], hint: 'なみうちぎわで ひろえる かいだよ' },
  castle:  { q: ['おにぎりや おすしを まく、', 'くろい シートは なあに?'], ans: 'nori', opts: ['nori', 'seaweed', 'mushroom', 'eggplant'], hint: 'うみで そだつ くろい たべものだよ' },
  temple:  { q: ['ふくと ぼうぼう おとが でる、', 'うずまきの おおきな かいは?'], ans: 'conch', opts: ['conch', 'seashell', 'seaweed', 'nori'], hint: 'ふえのように ふける、おおきな かいだよ' },
  dragon:  { q: ['かわの ぬしと よばれる、', 'ほそながい さかなは?'], ans: 'unagi', opts: ['unagi', 'koi', 'ayu', 'iwana'], hint: 'へびのように ほそながい さかなだよ' },
  end:     { q: ['うしから しぼる、', 'しろい のみものは なあに?'], ans: 'milk', opts: ['milk', 'egg', 'fluff', 'hay'], hint: 'ぎゅうしゃで うしから もらえるよ' },
};
