/**
 * Spine 资源映射数据
 *
 * 定义角色与 CDN 上 Spine 资源的对应关系
 * CDN 地址: https://cdn.jsdelivr.net/gh/2426269/shinycolors-assets-cdn@main/spine/
 */

export interface SpineCard {
  name: string; // 卡面名（日文，对应 CDN 文件夹名）
  displayName: string; // 显示名称
  hasIdolCostume: boolean; // 是否有偶像服
}

export interface CharacterSpineData {
  id: string;
  japaneseName: string;
  chineseName: string;
  cards: SpineCard[];
}

export const SPINE_CHARACTERS: CharacterSpineData[] = [
  // illumination STARS
  {
    id: 'mano',
    japaneseName: '櫻木真乃',
    chineseName: '樱木真乃',
    cards: [
      { name: '【ほわっとスマイル】櫻木真乃', displayName: 'ほわっとスマイル', hasIdolCostume: true },
      { name: '【花風Smiley】櫻木真乃', displayName: '花風Smiley', hasIdolCostume: true },
    ],
  },
  {
    id: 'hiori',
    japaneseName: '風野灯織',
    chineseName: '风野灯织',
    cards: [
      { name: '【お弁当と未来】風野灯織', displayName: 'お弁当と未来', hasIdolCostume: true },
      { name: '【柔らかな微笑み】風野灯織', displayName: '柔らかな微笑み', hasIdolCostume: true },
      { name: '【黒百合前で待ち合わせ】風野灯織', displayName: '黒百合前で待ち合わせ', hasIdolCostume: true },
    ],
  },
  {
    id: 'meguru',
    japaneseName: '八宮めぐる',
    chineseName: '八宫巡',
    cards: [
      { name: '【アイの誓い】八宮めぐる', displayName: 'アイの誓い', hasIdolCostume: true },
      { name: '【金色の元気いっぱいガール】八宮めぐる', displayName: '金色の元気いっぱいガール', hasIdolCostume: true },
    ],
  },
  // L'Antica
  {
    id: 'kogane',
    japaneseName: '月岡恋鐘',
    chineseName: '月冈恋钟',
    cards: [
      { name: '【hurray for...】月岡恋鐘', displayName: 'hurray for...', hasIdolCostume: true },
      { name: '【ばりうまかブルース】月岡恋鐘', displayName: 'ばりうまかブルース', hasIdolCostume: true },
    ],
  },
  {
    id: 'mamimi',
    japaneseName: '田中摩美々',
    chineseName: '田中摩美美',
    cards: [
      { name: '【トリッキーナイト】田中摩美々', displayName: 'トリッキーナイト', hasIdolCostume: true },
      { name: '【パープル・ミラージュ】田中摩美々', displayName: 'パープル・ミラージュ', hasIdolCostume: true },
    ],
  },
  {
    id: 'sakuya',
    japaneseName: '白瀬咲耶',
    chineseName: '白濑咲耶',
    cards: [
      { name: '【夜が来ても】白瀬咲耶', displayName: '夜が来ても', hasIdolCostume: true },
      { name: '【紺碧のボーダーライン】白瀬咲耶', displayName: '紺碧のボーダーライン', hasIdolCostume: true },
    ],
  },
  {
    id: 'yuika',
    japaneseName: '三峰結華',
    chineseName: '三峰结华',
    cards: [
      { name: '【♡コメディ】三峰結華', displayName: '♡コメディ', hasIdolCostume: true },
      { name: '【お試し／みつゴコロ】三峰結華', displayName: 'お試し／みつゴコロ', hasIdolCostume: true },
    ],
  },
  {
    id: 'kiriko',
    japaneseName: '幽谷霧子',
    chineseName: '幽谷雾子',
    cards: [
      { name: '【海へと還る街】幽谷霧子', displayName: '海へと還る街', hasIdolCostume: true },
      { name: '【霧・音・燦・燦】幽谷霧子', displayName: '霧・音・燦・燦', hasIdolCostume: true },
    ],
  },
  // Houkago Climax Girls
  {
    id: 'kaho',
    japaneseName: '小宮果穂',
    chineseName: '小宫果穗',
    cards: [
      {
        name: '【ななひゃくさんじゅう　えん】小宮果穂',
        displayName: 'ななひゃくさんじゅう　えん',
        hasIdolCostume: true,
      },
      { name: '【第2形態アーマードタイプ】小宮果穂', displayName: '第2形態アーマードタイプ', hasIdolCostume: true },
    ],
  },
  {
    id: 'chiyoko',
    japaneseName: '園田智代子',
    chineseName: '园田智代子',
    cards: [
      { name: '【うつくしいあした】園田智代子', displayName: 'うつくしいあした', hasIdolCostume: true },
      { name: '【チョコ色×きらきらロマン】園田智代子', displayName: 'チョコ色×きらきらロマン', hasIdolCostume: true },
    ],
  },
  {
    id: 'juri',
    japaneseName: '西城樹里',
    chineseName: '西城树里',
    cards: [
      { name: '【きらり、足跡】西城樹里', displayName: 'きらり、足跡', hasIdolCostume: true },
      { name: '【ラムネ色の覚悟】西城樹里', displayName: 'ラムネ色の覚悟', hasIdolCostume: true },
    ],
  },
  {
    id: 'rinze',
    japaneseName: '杜野凛世',
    chineseName: '杜野凛世',
    cards: [
      { name: '【ラヴ・レター】杜野凛世', displayName: 'ラヴ・レター', hasIdolCostume: true },
      { name: '【凛世花伝】杜野凛世', displayName: '凛世花伝', hasIdolCostume: true },
      { name: '【水色感情】杜野凛世', displayName: '水色感情', hasIdolCostume: true },
      { name: '【硝子少女】杜野凛世', displayName: '硝子少女', hasIdolCostume: true },
      { name: '【絵空靴】杜野凛世', displayName: '絵空靴', hasIdolCostume: true },
    ],
  },
  {
    id: 'natsuha',
    japaneseName: '有栖川夏葉',
    chineseName: '有栖川夏叶',
    cards: [
      { name: '【TOTTを誓って】有栖川夏葉', displayName: 'TOTTを誓って', hasIdolCostume: true },
      { name: '【アルティメットマーメイド】有栖川夏葉', displayName: 'アルティメットマーメイド', hasIdolCostume: true },
    ],
  },
  // Alstroemeria
  {
    id: 'amana',
    japaneseName: '大崎甘奈',
    chineseName: '大崎甘奈',
    cards: [
      { name: '【お散歩サンライト】大崎甘奈', displayName: 'お散歩サンライト', hasIdolCostume: true },
      { name: '【スタンバイオッケー】大崎甘奈', displayName: 'スタンバイオッケー', hasIdolCostume: true },
      { name: '【憧憬リキュールー】大崎甘奈', displayName: '憧憬リキュールー', hasIdolCostume: true },
      { name: '【挑戦アトラクティブ】大崎甘奈', displayName: '挑戦アトラクティブ', hasIdolCostume: true },
      { name: '【聞いてマイハート】大崎甘奈', displayName: '聞いてマイハート', hasIdolCostume: true },
    ],
  },
  {
    id: 'tenka',
    japaneseName: '大崎甜花',
    chineseName: '大崎甜花',
    cards: [
      { name: '【バス・タイムの気分で】大崎 甜花', displayName: 'バス・タイムの気分で', hasIdolCostume: true },
      { name: '【事務所。静寂。大輪の華】大崎甜花', displayName: '事務所。静寂。大輪の華', hasIdolCostume: true },
    ],
  },
  {
    id: 'chiyuki',
    japaneseName: '桑山千雪',
    chineseName: '桑山千雪',
    cards: [
      { name: '【はるかぜまち、1番地】桑山千雪', displayName: 'はるかぜまち、1番地', hasIdolCostume: true },
      { name: '【ひとひらで紡ぐ世界】桑山千雪', displayName: 'ひとひらで紡ぐ世界', hasIdolCostume: true },
      { name: '【マイ・ピュア・ロマンス】桑山千雪', displayName: 'マイ・ピュア・ロマンス', hasIdolCostume: true },
    ],
  },
  // Straylight
  {
    id: 'asahi',
    japaneseName: '芹沢あさひ',
    chineseName: '芹泽朝日',
    cards: [
      { name: '【さよならカイト】芹沢あさひ', displayName: 'さよならカイト', hasIdolCostume: true },
      { name: '【ジャンプ！スタッグ！！！】芹沢あさひ', displayName: 'ジャンプ！スタッグ！！！', hasIdolCostume: true },
    ],
  },
  {
    id: 'fuyuko',
    japaneseName: '黛冬優子',
    chineseName: '黛冬优子',
    cards: [
      { name: '【オ♡フ♡レ♡コ】黛冬優子', displayName: 'オ♡フ♡レ♡コ', hasIdolCostume: true },
      { name: '【紅茶夢現】黛冬優子', displayName: '紅茶夢現', hasIdolCostume: true },
      { name: '【誘爆ハートビート】黛冬優子', displayName: '誘爆ハートビート', hasIdolCostume: true },
    ],
  },
  {
    id: 'mei',
    japaneseName: '和泉愛依',
    chineseName: '和泉爱依',
    cards: [
      { name: '【ちょっとあげる～】和泉愛依', displayName: 'ちょっとあげる～', hasIdolCostume: true },
      { name: '【今、できることを全て】和泉愛依', displayName: '今、できることを全て', hasIdolCostume: true },
    ],
  },
  // noctchill
  {
    id: 'toru',
    japaneseName: '浅倉透',
    chineseName: '浅仓透',
    cards: [
      { name: '【10個、光】浅倉透', displayName: '10個、光', hasIdolCostume: true },
      { name: '【テープエンドの行き先】浅倉透', displayName: 'テープエンドの行き先', hasIdolCostume: true },
    ],
  },
  {
    id: 'madoka',
    japaneseName: '樋口円香',
    chineseName: '樋口圆香',
    cards: [
      { name: '【Merry】樋口円香', displayName: 'Merry', hasIdolCostume: true },
      { name: '【アマテラス】樋口円香', displayName: 'アマテラス', hasIdolCostume: true },
      { name: '【カラカラカラ】樋口円香', displayName: 'カラカラカラ', hasIdolCostume: true },
    ],
  },
  {
    id: 'koito',
    japaneseName: '福丸小糸',
    chineseName: '福丸小糸',
    cards: [
      { name: '【ちいさな巣立ち】福丸小糸', displayName: 'ちいさな巣立ち', hasIdolCostume: true },
      { name: '【なつやすみ学校】福丸小糸', displayName: 'なつやすみ学校', hasIdolCostume: true },
      { name: '【ポシェットの中には】福丸小糸', displayName: 'ポシェットの中には', hasIdolCostume: true },
      { name: '【窓をあけて】福丸小糸', displayName: '窓をあけて', hasIdolCostume: true },
    ],
  },
  {
    id: 'hinana',
    japaneseName: '市川雛菜',
    chineseName: '市川雏菜',
    cards: [
      { name: '【change___】市川雛菜', displayName: 'change___', hasIdolCostume: true },
      { name: '【HAPPY-!NG】市川雛菜', displayName: 'HAPPY-!NG', hasIdolCostume: true },
    ],
  },
  // SHHis
  {
    id: 'nichika',
    japaneseName: '七草にちか',
    chineseName: '七草日花',
    cards: [
      { name: '【♡まっクろはムウサぎ♡】七草にちか', displayName: '♡まっクろはムウサぎ♡', hasIdolCostume: true },
      { name: '【受けトル sun Q】七草にちか', displayName: '受けトル sun Q', hasIdolCostume: true },
      { name: '【日々、想】七草にちか', displayName: '日々、想', hasIdolCostume: true },
    ],
  },
  {
    id: 'mikoto',
    japaneseName: '緋田美琴',
    chineseName: '绯田美琴',
    cards: [
      { name: '【POLARIS】緋田美琴', displayName: 'POLARIS', hasIdolCostume: true },
      { name: '【ROUNDLY】緋田美琴', displayName: 'ROUNDLY', hasIdolCostume: true },
    ],
  },
  // CoMETIK
  {
    id: 'luca',
    japaneseName: '斑鳩ルカ',
    chineseName: '斑鸠路加',
    cards: [
      { name: '【broken shout】斑鳩ルカ', displayName: 'broken shout', hasIdolCostume: true },
      { name: '【Could Be】斑鳩ルカ', displayName: 'Could Be', hasIdolCostume: true },
    ],
  },
  {
    id: 'hana',
    japaneseName: '鈴木羽那',
    chineseName: '铃木羽那',
    cards: [
      { name: '【Eyes On You】鈴木羽那', displayName: 'Eyes On You', hasIdolCostume: true },
      { name: '【From You】鈴木羽那', displayName: 'From You', hasIdolCostume: true },
      { name: '【純白の君へ】鈴木羽那', displayName: '純白の君へ', hasIdolCostume: true },
    ],
  },
  {
    id: 'haruki',
    japaneseName: '郁田はるき',
    chineseName: '郁田阳希',
    cards: [
      { name: '【Hopeland】郁田はるき', displayName: 'Hopeland', hasIdolCostume: true },
      { name: '【song for you】郁田はるき', displayName: 'song for you', hasIdolCostume: true },
    ],
  },
];

export function getSpineDataById(id: string): CharacterSpineData | undefined {
  return SPINE_CHARACTERS.find(char => char.id === id);
}

export function getSpineId(japaneseName: string, cardName: string): string {
  return `${japaneseName}_${cardName}`;
}
