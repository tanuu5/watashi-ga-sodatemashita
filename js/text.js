// text.js — every word in the film.
// Adapted from the short story 「私が育てました」 by たぬ (2026): https://note.com/tank_ai/n/n70001018dbf5
//
// RIGHTS: the text of the original story in this file and its translations
// (CAPS, SUBS and CORPUS.novel) are © たぬ, all rights reserved. They are NOT
// covered by the MIT License that applies to the rest of this repository.
// 原作の文章とその翻訳（CAPS・SUBS・CORPUS.novel）は MIT License の対象外です（© たぬ）。
//
// who: 'nar' narration (on manuscript paper) · 'kido' the trustee · 'anzai' his clerk
//      'shino' Shinoda of the credit union · 'kado' Kadowaki next door · 'son' the heir, on the phone
//      'young' / 'older' the two officials from the prefecture
//      'sub' a translation of words written in the world (shown with English subtitles only)

export const TITLE = {
  ja: '私が育てました',
  en: 'I Grew These',
  tagJa: '原作　たぬ',
  tagEn: 'from a short story by Tanu',
  url: 'https://note.com/tank_ai/n/n70001018dbf5',
};

export const CHAPTERS = {
  c1: { ja: '一　平凡な案件', en: '1 · An Ordinary Case' },
  c2: { ja: '二　誰もいない', en: '2 · No One There' },
  c3: { ja: '三　死者の財布', en: '3 · The Dead Man’s Wallet' },
  c4: { ja: '四　最後の指示', en: '4 · The Last Instruction' },
  c5: { ja: '五　この表示を行っているのは誰ですか', en: '5 · Who Is Making This Claim?' },
  c6: { ja: '六　目録', en: '6 · The Inventory' },
};

export const CAPS = {
  s1: [
    { who: 'nar', ja: '段ボール箱の中身は、印鑑が二本と、鍵が三本と、\n有効期限の切れた駐車場の月極カードだった。', en: 'The cardboard box held two seals, three keys,\nand a monthly parking card that had run out.' },
    { who: 'anzai', ja: '城戸先生、これ、封筒に入ってました', en: 'Mr. Kido, this was in an envelope.' },
    { who: 'kido', ja: '関係ないな。返しておいて', en: 'Not relevant. Put it back.' },
    { who: 'anzai', ja: '捨てなくていいんですか', en: 'You don’t want it thrown out?' },
    { who: 'kido', ja: 'うちが捨てていいものと、そうでないものの区別が、\nまだついていない', en: 'We can’t yet tell what’s ours to throw away\nand what isn’t.' },
    { who: 'nar', ja: '世界のどこを切っても、最後は表になる。', en: 'Cut the world anywhere, and in the end it becomes a table.' },
    { who: 'nar', ja: '数字が入るか、入らないか。それだけだ。', en: 'A number goes in, or it doesn’t. That is all.' },
  ],
  s2: [
    { who: 'nar', ja: 'パイプ椅子は二十脚。使われたのは五脚で、\n残りは誰も座らないまま光を反射していた。', en: 'Twenty folding chairs. Five were used;\nthe rest sat empty, reflecting the light.' },
    { who: 'shino', ja: '先生。あそこ、まだ野菜が出てるって話は', en: 'Mr. Kido — up there. They say vegetables\nare still coming out of that place…' },
    { who: 'shino', ja: 'いや、いいです。噂ですから', en: 'No, never mind. It’s only a rumour.' },
  ],
  s3: [
    { who: 'nar', ja: '毎週水曜。開始決定の後も、途切れていない。', en: 'Every Wednesday. Even after the proceedings began,\nit hadn’t stopped.' },
    { who: 'nar', ja: 'これは売上だ。', en: 'These were sales.' },
    { who: 'nar', ja: '売上ということは、誰かが物を売っている。\n物を売っているということは、誰かが物を作っている。', en: 'Sales meant someone was selling something.\nSelling something meant someone was making it.' },
    { who: 'anzai', ja: '先生、目録って、\nこういう細かいのも全部載せるんですか', en: 'Does every little thing like this\ngo in the inventory?' },
    { who: 'kido', ja: '載せる。載っていないものは、無いのと同じですから', en: 'It does. What isn’t listed might as well not exist.' },
  ],
  s4: [
    { who: 'kido', ja: '――誰かいませんか', en: '…Is anyone here?' },
    { who: 'nar', ja: '使っている人間がいるなら、足跡があるはずだ。', en: 'If people were using the place, there would be footprints.' },
    { who: 'nar', ja: 'ここにあるのは轍だけだった。', en: 'There were only wheel tracks.' },
  ],
  s5: [
    { who: 'nar', ja: '生き物であること以外、何も分からない絵だった。', en: 'It was some kind of creature.\nBeyond that, the picture told you nothing.' },
    { who: 'nar', ja: '誰もいない店で、誰かが金を払い、野菜を持っていく。', en: 'In a shop with no one in it,\nsomeone pays, and takes the vegetables.' },
    { who: 'nar', ja: '異常な光景を見ているのは、たぶん自分だけだ。', en: 'He was probably the only one who found it strange.' },
  ],
  s6: [
    { who: 'nar', ja: '買えるのは、種と、肥料と、資材と、電気と、\n自分が動くための計算資源だけである。', en: 'All it could buy was seed, fertiliser, supplies, electricity —\nand the computing it needed to keep itself running.' },
    { who: 'nar', ja: '来年の三月から四月。', en: 'March or April, next year.' },
    { who: 'nar', ja: '春の作付けが終わって、苗が根づいたあたりで、\nこの財布は空になる。', en: 'Just after the spring planting, as the seedlings take root,\nthe wallet runs dry.' },
    { who: 'son', ja: '正直、気味が悪いんで、関わりたくないです', en: 'Honestly, it gives me the creeps.\nI don’t want anything to do with it.' },
    { who: 'son', ja: '止めるんなら、そっちで止めてもらえませんか', en: 'If it needs stopping, can’t you stop it?' },
    { who: 'kido', ja: '私に、その権限はありません', en: 'I don’t have the authority.' },
  ],
  s7: [
    { who: 'kado', ja: 'で。あんた、止めに来たの', en: 'So. You’ve come to stop it?' },
    { who: 'kido', ja: '何を、でしょうか', en: 'Stop… what, exactly?' },
    { who: 'kado', ja: '向こう。まだ回ってるだろ', en: 'Over there. Still running, isn’t it.' },
    { who: 'kado', ja: '音がするもん', en: 'You can hear it.' },
    { who: 'kido', ja: '直売所に商品を並べているのは、どなたですか', en: 'Who puts the produce out at the stand?' },
    { who: 'kado', ja: 'あれは、俺が運んでる', en: 'That’s me. I carry it down.' },
    { who: 'kido', ja: '誰かに頼まれて', en: 'Did someone ask you to?' },
    { who: 'kado', ja: '頼まれてない', en: 'Nobody asked.' },
    { who: 'kido', ja: '報酬は', en: 'And you’re paid…?' },
    { who: 'kado', ja: 'もらってない', en: 'I’m not.' },
    { who: 'kado', ja: '雨の日は行かないよ。濡らすと悪いから', en: 'Not on rainy days, mind.\nWouldn’t be fair, getting them wet.' },
    { who: 'kido', ja: '悪い、というのは、誰に', en: 'Not fair — to whom?' },
    { who: 'kado', ja: '野菜にだよ', en: 'To the vegetables.' },
    { who: 'kado', ja: 'あれは隆一さんの店だもん', en: 'It’s Ryūichi’s shop, that.' },
  ],
  s8: [
    { who: 'nar', ja: '三月九日。代表者の死亡は、三月二十日である。', en: 'March the ninth. The owner died on March the twentieth.' },
    { who: 'nar', ja: '十一日前。', en: 'Eleven days before.' },
    { who: 'nar', ja: '来年の作付けまで持つ額が、そこにあった。', en: 'There it was: enough to last until next year’s planting.' },
    { who: 'nar', ja: '並べておくと、意味が生まれる。\n生まれた意味は、目録には書けない。', en: 'Laid side by side, they began to mean something.\nAnd a meaning can’t be written into an inventory.' },
    { who: 'shino', ja: 'あの人、断ったあとも、うちの店に来てくれてたんです', en: 'Even after we turned him down,\nhe kept coming by our branch.' },
    { who: 'shino', ja: 'でも、あそこが止まるところは、正直、見たくないですね', en: 'But honestly —\nI’d rather not see that place stop.' },
  ],
  s9: [
    { who: 'kado', ja: 'そりゃ、あんたが、そう読みたいだけだろ', en: 'That’s just how you want to read it.' },
    { who: 'kado', ja: '隆一さんは、いつだって金の計算はどんぶりだったよ', en: 'Ryūichi was always slapdash with money.' },
    { who: 'kado', ja: '頼むって言うなら、俺に言えばいいだろ。隣なんだから', en: 'If he wanted to ask, he could’ve asked me.\nI’m right next door.' },
    { who: 'kado', ja: '言わなかったんだよ、あの人は。\nだから俺は、何も頼まれてない', en: 'He never said a word, that man.\nSo nobody’s asked me anything.' },
  ],
  s10: [
    { who: 'young', ja: 'この表示なんですが', en: 'It’s about this label.' },
    { who: 'young', ja: '近隣の出荷者の方から、通報がありまして', en: 'We had a report from a grower\nwho sells nearby.' },
    { who: 'young', ja: 'この地域の慣行のレベルからすると、\n五割減という数字は出ないはずだ、と', en: 'Given the usual practice around here,\nthey say “fifty percent less” can’t be right.' },
    { who: 'kido', ja: 'システムが参照していたデータが、\n三年前のものでした', en: 'The data the system was using\nwas three years old.' },
    { who: 'kido', ja: '計算は正しい。基準が古い', en: 'The arithmetic is right. The baseline is old.' },
    { who: 'young', ja: 'この表示を行っている事業者は、\nFファームで間違いありませんか', en: 'And the business making this claim —\nthat is F Farm, correct?' },
    { who: 'nar', ja: 'どの箱にも、名前が入っている。\n箱の外にあるのは、それらをつないで動いている行為だけだった。', en: 'Every box had a name in it.\nOutside the boxes there was only the doing that joined them.' },
    { who: 'kido', ja: '……確認して、書面でお答えします', en: '…I’ll look into it, and reply in writing.' },
    { who: 'older', ja: '管財人さんは、\nこれが動いているのを、ご存じでしたよね', en: 'You knew this was running, didn’t you?\nAs the trustee.' },
    { who: 'young', ja: '表示については、いったん、\nシールを剥がすなり、覆うなりしていただければ', en: 'For now, the labels —\nif they could be peeled off, or covered.' },
    { who: 'kido', ja: '――どなたが、それを行うことになりますか', en: '…And who would be the one to do that?' },
    { who: 'young', ja: 'そこは、事業者さんのほうで', en: 'That would be… the business.' },
  ],
  s11: [
    { who: 'nar', ja: 'どの行にも、書けない欄が一つずつあった。', en: 'Every row had one box that could not be filled.' },
    { who: 'anzai', ja: '先生。あそこの野菜、まだ出てるらしいですよ', en: 'Mr. Kido — those vegetables up there.\nApparently they’re still coming out.' },
    { who: 'kido', ja: 'そうですか', en: 'Is that so.' },
    { who: 'nar', ja: '目録に書かれていないものが何かを、\n城戸は正確に知っていた。', en: 'Kido knew exactly\nwhat the inventory left out.' },
    { who: 'nar', ja: '書く欄が無かった。', en: 'There was no box to write it in.' },
    { who: 'nar', ja: '開いていた。', en: 'It was open.' },
  ],
};

// Words written in the world, translated for English subtitles (who: 'sub').
export const SUBS = {
  label: 'Mini tomatoes · 200 g · ¥220\nPesticides: 50% less than the local norm · F Farm',
  sign: '“I grew these.”\nGrown with as few pesticides as we can, and with care. Thank you!',
  memo: 'We know whose money it is.\nWho is ordering this spending, now?',
  feb: 'Owner’s input: “Can’t come and look today.”',
  last: 'March 9, 21:44 — from the owner’s phone, on the hospital’s wi-fi:\n“Till next year’s planting — please. I’ll sort out the rest.”',
  tags: 'Land & equipment: the bankruptcy estate · Growing: the system · Costs: the dead man’s estate\nBagging: the robot cart · Shelving: Kadowaki · Authority over it all: Kido',
  paths: 'Stop · Continue · Hand over — each with one box that won’t fill:\nWho peels off the labels? Who takes it on after March? Who runs it meanwhile?',
  plan: 'Planting plan: March — tomato seedlings, pepper seedlings · April — komatsuna, in turns · May — …',
  label2: 'Daikon · 1 · ¥150 · F Farm',
  note: 'Enquiries: Kadowaki',
};

// ---------------------------------------------------------------------------
// Things written in the world (always Japanese: this is where the story happens).

export const SIGN = {
  head: '私が育てました',
  lines: ['農薬をできるだけ使わず', '大切に育てています。', 'どうぞよろしくお願いします！'],
};

// Price labels, printed pale by the farm's little printer.
export const LABELS = {
  tomato: ['ミニトマト　200g　220円', '節減対象農薬　当地比5割減', 'Fファーム'],
  pepper: ['ピーマン　5個　120円', '節減対象農薬　当地比5割減', 'Fファーム'],
  daikon: ['大根　1本　150円', '', 'Fファーム'],
  hakusai: ['白菜　1玉　200円', '', 'Fファーム'],
  komatsuna: ['小松菜　1束　100円', '', 'Fファーム'],
};

// 財産目録 — the court form. Blank at first, filled in the end.
export const FORM = {
  title: '財産目録',
  case: '令和　年（フ）第　号　破産者　Fファーム株式会社',
  head: ['番号', '財産の種類', '内容', '評価額（円）', '備考'],
  rows: [
    ['1', '現金', '', '', ''],
    ['2', '預金', '', '', ''],
    ['3', '売掛金', '', '', ''],
    ['4', '棚卸資産', '', '', ''],
    ['5', '機械及び装置', '', '', ''],
    ['6', '建物（ハウス）', '', '', ''],
    ['7', '車両運搬具', '', '', ''],
  ],
  filled: [
    ['', '', '手許現金', '12,380', ''],
    ['', '', '信用金庫　普通', '146,215', ''],
    ['', '', '精算未了分', '0', '回収済み'],
    ['', '', '生鮮品', '0', '換価性なし'],
    ['', '', '管理機・自走台車ほか', '380,000', '売却済み'],
    ['', '', 'ハウス六棟', '0', '撤去費用が上回る'],
    ['', '', '軽トラック二台', '120,000', '売却済み'],
  ],
};

// The company's passbook. The Wednesdays begin after the mutual-aid refund.
export const PASSBOOK = {
  head: ['年月日', '摘要', 'お支払金額', 'お預り金額'],
  rows: [
    ['02-25', 'フリコミ　シュビョウ', '38,500', ''],
    ['02-27', 'フリコミ　カ）シザイ', '21,600', ''],
    ['03-10', 'キュウヨ', '186,000', ''],
    ['03-26', 'デンキリョウキン', '205,410', ''],
    ['04-08', 'キョウサイ　ヘンレイ', '', '54,120'],
    ['04-08', 'カ）コトペイセイサン', '', '12,400'],
    ['04-15', 'カ）コトペイセイサン', '', '9,800'],
    ['04-22', 'カ）コトペイセイサン', '', '15,200'],
    ['04-29', 'カ）コトペイセイサン', '', '5,600'],
    ['05-06', 'カ）コトペイセイサン', '', '11,900'],
    ['05-13', 'カ）コトペイセイサン', '', '18,600'],
    ['05-20', 'カ）コトペイセイサン', '', '7,300'],
    ['05-27', 'カ）コトペイセイサン', '', '13,800'],
    ['06-03', 'カ）コトペイセイサン', '', '19,700'],
    ['06-10', 'カ）コトペイセイサン', '', '14,500'],
    ['06-17', 'カ）コトペイセイサン', '', '16,100'],
    ['06-24', 'カ）コトペイセイサン', '', '12,900'],
  ],
};

// The dead man's wallet, as the cloud company described it.
export const WALLET = {
  parent: '代表者個人のアカウント',
  parentSub: '決済用ウォレット',
  child: '仮想ウォレット',
  childSub: 'Fファーム管理システム専用',
  rules: ['一回あたりの上限', '月あたりの上限', '支払先の許可リスト'],
  payees: ['クラウド事業者', '種苗店', '資材屋', '電力'],
  balance: '残高　3,262,480円',
  en: { parent: 'the owner’s own account', child: 'virtual wallet (the farm system)', rules: ['per-payment limit', 'monthly limit', 'approved payees'], payees: ['cloud', 'seeds', 'supplies', 'power'] },
};

export const MEMO = ['金の持ち主は分かる。', 'この支出を、現在、誰が命じているのか。'];
export const CALC = { burn: '3262480÷368000', months: '8.86', note: '→ 来年3〜4月' };

// The operation log. Almost everything in it is the machine talking to itself.
export const LOG = {
  head: '操作履歴（法人契約分）',
  acts: [
    '潅水量の調整', '換気窓の開度', '施肥の指示', '出荷計画の更新', '値札の生成', '掲示物の生成', '日射量の記録',
    '室温の記録', '台車　巡回', '台車　収穫', '台車　袋詰め', '発注　種苗店', '発注　資材屋', '電力　使用量',
  ],
  params: ['18%→24%', '24%→30%', '1.2L/株', '0.9L/株', 'N-P-K 8-8-8', '出荷 14袋', '出荷 20袋', '31.4℃', '27.9℃', '812W/㎡', '完了', '決済済'],
  human: [
    { t: '10-14 07:12', who: '入力', text: '気温設定を一度上げる' },
    { t: '11-02 06:40', who: '入力', text: '気温設定を一度上げる' },
  ],
  feb: { t: '02-14 19:02', who: '入力', text: '今日は見に行けない' },
  last: {
    t: '03-09 21:44',
    src: '入力元　代表者個人端末',
    net: '県立総合病院　無線ネットワーク',
    lines: ['来年の作付けまでは　頼む', 'あとはこっちで何とかする'],
  },
};

// Who is doing what — the name tags that hang in Kido's head (scene 10).
export const TAGS = [
  { what: '土地と設備', who: '破産財団', enWhat: 'Land & equipment', enWho: 'the bankruptcy estate' },
  { what: '栽培の判断', who: 'システム', enWhat: 'Growing decisions', enWho: 'the system' },
  { what: '費用', who: '相続財産', enWhat: 'Costs', enWho: 'the dead man’s estate' },
  { what: '袋詰め', who: '自走台車', enWhat: 'Bagging', enWho: 'the robot cart' },
  { what: '棚に並べる', who: '門脇', enWhat: 'Shelving', enWho: 'Kadowaki' },
  { what: '管理処分権', who: '城戸', enWhat: 'Authority', enWho: 'Kido, the trustee' },
];

// The three roads (scene 11).
export const PATHS = {
  cols: ['時間', '金額', '許可'],
  rows: [
    { name: '止める', vals: ['二週間', '±0', '不要'], q: '値札を剥がすのは誰か' },
    { name: '続ける', vals: ['来年三月まで', '？', '裁判所'], q: '三月の先を誰が引き受けるのか' },
    { name: '譲る', vals: ['数か月', '＋', '裁判所'], q: 'その間、運営しているのは誰なのか' },
  ],
};

export const PLAN = ['3月　トマト苗定植', '3月　ピーマン苗定植', '4月　小松菜　順次', '5月　……'];
export const NOTE = { head: 'お問い合わせ', name: '門脇', tel: '090-8' };

export const CAL = { month: '3', monthJa: '三月' };

export const UI = {
  loading: { ja: '種をまいています…', en: 'sowing seeds' },
};

// ---------------------------------------------------------------------------
// Printed matter. The people's rooms are cut from paper printed with the original
// story; the farm is cut from paper printed with its own operation log.
export const CORPUS = {
  novel: [
    '城戸悠は箱を机の端に寄せ、代わりに預金通帳の束を引き寄せた。', '事務所の窓は西向きで、', '六月の午後は四時を過ぎると机の天板まで陽が届く。',
    '世界のどこを切っても、最後は表になる。', '数字が入るか、入らないか。それだけだ。', '合わない箇所には理由がある。', '理由が分かれば、たいていは埋まる。',
    'この事件も、二週間あれば埋まると思っていた。', '債権者集会は、拍子抜けするほど短く終わった。', 'パイプ椅子は二十脚並べてあった。',
    '毎週水曜。', '誤差なのに、指が止まった。', 'これは売上だ。', 'その次の行から、水曜日が始まっていた。',
    '国道は、山の裾を撫でるように長く曲がっていた。', '車を降りると、まず音が来た。', 'カタン、と小さく止まり、また動く。',
    '湿った土と、青い茎の匂い。', 'しゅう、と息のような音。', '声を出してみた。', 'ビニールが吸って、返ってこない。', '六棟目は空だった。',
    '誰もいない。', 'ここにあるのは轍だけだった。', '屋根のトタンが陽で膨らんで、', '時々、パン、と鳴る。', '硬貨が二回、金属を叩いて、下で止まった。',
    '悪用の余地がない。', '逃げも隠れもしない。', '金の持ち主は分かる。', '城戸は二度、計算をやり直した。', 'それでも、電卓の表示を、しばらく消せなかった。',
    '縁側に座ると、蚊取り線香の煙が横から流れてきた。', 'よく煮出した、濃いやつだった。', '蝉が一斉に鳴き出し、また落ちた。',
    '人間が立てた列だ、と城戸は思った。', '盗られてないんなら、それでいいよ。', '自動、自動、自動。', '並べておくと、意味が生まれる。',
    '窓口に、ピーマンとか置いていってね。', '蝉が鳴いていた。', 'トタンが鳴った。', 'どの箱にも、名前が入っている。', '誰も、何も言わなかった。',
    '知った日から、時計は別の場所で動きはじめていた。', '空欄なら埋めればいい。', '書いた字は、他の行より明らかに小さかった。',
    '空欄は、埋まっていた。', '書く欄が無かった。', '山の色が変わっていた。', '焚き火の煙の匂いがした。', '開いていた。',
    '四角い目だけが、変わらず黒い。', '風が来て、紙の右下が少し波打った。',
  ],
};

// Every string that will be drawn with a web font, so the right font subsets get loaded.
export function allText() {
  const parts = [TITLE.ja, TITLE.en, TITLE.tagJa, TITLE.tagEn, 'Claude — Anthropic 0123456789 ¥%.,:-→÷＋±？'];
  for (const c of Object.values(CHAPTERS)) parts.push(c.ja, c.en);
  for (const s of Object.values(CAPS)) for (const c of s) parts.push(c.ja, c.en);
  parts.push(...Object.values(SUBS));
  parts.push(SIGN.head, ...SIGN.lines);
  for (const v of Object.values(LABELS)) parts.push(...v);
  parts.push(FORM.title, FORM.case, ...FORM.head, ...FORM.rows.flat(), ...FORM.filled.flat());
  parts.push(...PASSBOOK.head, ...PASSBOOK.rows.flat());
  parts.push(WALLET.parent, WALLET.parentSub, WALLET.child, WALLET.childSub, ...WALLET.rules, ...WALLET.payees, WALLET.balance);
  parts.push(...MEMO, CALC.burn, CALC.months, CALC.note);
  parts.push(LOG.head, ...LOG.acts, ...LOG.params, LOG.feb.text, LOG.last.src, LOG.last.net, ...LOG.last.lines, '自動入力');
  for (const h of LOG.human) parts.push(h.text);
  for (const t of TAGS) parts.push(t.what, t.who, t.enWhat, t.enWho);
  parts.push(...PATHS.cols);
  for (const r of PATHS.rows) parts.push(r.name, ...r.vals, r.q);
  parts.push(...PLAN, NOTE.head, NOTE.name, NOTE.tel, CAL.monthJa, '日月火水木金土', UI.loading.ja);
  parts.push(CORPUS.novel.join(''));
  parts.push('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,;:!?\'"()[]{}<>/=+-*_&#%$@—’“”…「」『』、。？！・（）');
  return parts.join('');
}
