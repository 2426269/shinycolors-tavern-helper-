/**
 * OurStream 视频数据资源
 * 管理视频流数据和配置
 */

// ============ Types ============
export interface StreamVideo {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  releaseDate: string;
  category: 'idol' | 'unit' | 'etc';
  unlocked: boolean;
  description?: string;
  idolIds?: string[]; // 关联的偶像ID列表
  unitId?: string; // 关联的团体ID
}

export interface StreamCategory {
  id: 'idol' | 'unit' | 'etc';
  label: string;
  labelJP: string;
}

// ============ Constants ============
export const STREAM_CATEGORIES: StreamCategory[] = [
  { id: 'idol', label: '偶像', labelJP: 'アイドル' },
  { id: 'unit', label: '团体', labelJP: 'ユニット' },
  { id: 'etc', label: '其他', labelJP: 'エトセトラ' },
];

// 视频服务器基础URL
export const VIDEO_BASE_URL = 'http://124.221.50.133/shinycolors/公开练习';

// 封面服务器基础URL
export const THUMBNAIL_BASE_URL = 'http://124.221.50.133/shinycolors/视频封面';

// 辅助函数：根据视频文件名生成封面URL
function getThumbnail(videoFileName: string): string {
  // 从视频文件名（去掉.mp4）生成封面URL（.webp）
  const baseName = videoFileName.replace('.mp4', '');
  return `${THUMBNAIL_BASE_URL}/${baseName}.webp`;
}

// ============ Video Data ============
export const STREAM_VIDEOS: StreamVideo[] = [
  // ========== 偶像个人直播 (idol) ==========
  {
    id: 'idol_izumi_mei_p',
    title: '和泉爱依 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】和泉爱依 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】和泉爱依 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['izumi_mei'],
  },
  {
    id: 'idol_izumi_mei_live',
    title: '和泉爱依 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】和泉爱依 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】和泉爱依 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '08:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['izumi_mei'],
  },
  {
    id: 'idol_sonoda_chiyoko_p',
    title: '园田智代子 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】园田智代子 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】园田智代子 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['sonoda_chiyoko'],
  },
  {
    id: 'idol_sonoda_chiyoko_live',
    title: '园田智代子 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】园田智代子 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】园田智代子 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '09:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['sonoda_chiyoko'],
  },
  {
    id: 'idol_osaki_amana_p',
    title: '大崎甘奈 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】大崎甘奈 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】大崎甘奈 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '12:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['osaki_amana'],
  },
  {
    id: 'idol_osaki_amana_live',
    title: '大崎甘奈 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】大崎甘奈 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】大崎甘奈 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '09:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['osaki_amana'],
  },
  {
    id: 'idol_osaki_tenka_p',
    title: '大崎甜花 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】大崎甜花 Ourstream直播 - 双视角 - 1.p视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】大崎甜花 Ourstream直播 - 双视角 - 1.p视角.mp4`,
    duration: '13:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['osaki_tenka'],
  },
  {
    id: 'idol_osaki_tenka_live',
    title: '大崎甜花 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】大崎甜花 Ourstream直播 - 双视角 - 2.room.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】大崎甜花 Ourstream直播 - 双视角 - 2.room.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['osaki_tenka'],
  },
  {
    id: 'idol_hatoba_tsugumi_p',
    title: '斑鸠路加 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】斑鸠路加 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】斑鸠路加 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['hatoba_tsugumi'],
  },
  {
    id: 'idol_hatoba_tsugumi_live',
    title: '斑鸠路加 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】斑鸠路加 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】斑鸠路加 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '07:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['hatoba_tsugumi'],
  },
  {
    id: 'idol_arisugawa_natsuha_p',
    title: '有栖川夏叶 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】有栖川夏叶 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】有栖川夏叶 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '13:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['arisugawa_natsuha'],
  },
  {
    id: 'idol_arisugawa_natsuha_live',
    title: '有栖川夏叶 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】有栖川夏叶 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】有栖川夏叶 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['arisugawa_natsuha'],
  },
  {
    id: 'idol_kuwayama_chiyuki_p',
    title: '桑山千雪 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】桑山千雪 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】桑山千雪 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '12:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['kuwayama_chiyuki'],
  },
  {
    id: 'idol_kuwayama_chiyuki_live',
    title: '桑山千雪 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】桑山千雪 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】桑山千雪 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['kuwayama_chiyuki'],
  },
  {
    id: 'idol_shirase_sakuya_p',
    title: '白濑咲耶 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】白濑咲耶 Ourstream直播 - 双视角 - 1.p视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】白濑咲耶 Ourstream直播 - 双视角 - 1.p视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['shirase_sakuya'],
  },
  {
    id: 'idol_shirase_sakuya_live',
    title: '白濑咲耶 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】白濑咲耶 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】白濑咲耶 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '09:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['shirase_sakuya'],
  },
  {
    id: 'idol_serizawa_asahi_p',
    title: '芹泽朝日 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】芹泽朝日 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】芹泽朝日 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['serizawa_asahi'],
  },
  {
    id: 'idol_serizawa_asahi_live',
    title: '芹泽朝日 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】芹泽朝日 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】芹泽朝日 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '09:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['serizawa_asahi'],
  },
  {
    id: 'idol_ikuta_haruki_p',
    title: '郁田阳希 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】郁田阳希 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】郁田阳希 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '11:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['ikuta_haruki'],
  },
  {
    id: 'idol_ikuta_haruki_live',
    title: '郁田阳希 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】郁田阳希 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】郁田阳希 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '05:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['ikuta_haruki'],
  },
  {
    id: 'idol_suzuki_hana_p',
    title: '铃木羽那 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】铃木羽那 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】铃木羽那 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['suzuki_hana'],
  },
  {
    id: 'idol_suzuki_hana_live',
    title: '铃木羽那 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】铃木羽那 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】铃木羽那 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '09:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['suzuki_hana'],
  },
  {
    id: 'idol_mayuzumi_fuyuko_p',
    title: '黛冬优子 Ourstream直播 - P视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】黛冬优子 Ourstream直播 - 双视角 - 1.P视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】黛冬优子 Ourstream直播 - 双视角 - 1.P视角.mp4`,
    duration: '11:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['mayuzumi_fuyuko'],
  },
  {
    id: 'idol_mayuzumi_fuyuko_live',
    title: '黛冬优子 Ourstream直播 - 直播视角',
    thumbnail: `${THUMBNAIL_BASE_URL}/【中字_SCSP】黛冬优子 Ourstream直播 - 双视角 - 2.直播视角.webp`,
    videoUrl: `${VIDEO_BASE_URL}/【中字_SCSP】黛冬优子 Ourstream直播 - 双视角 - 2.直播视角.mp4`,
    duration: '11:00',
    releaseDate: '2025/12/23',
    category: 'idol',
    unlocked: true,
    idolIds: ['mayuzumi_fuyuko'],
  },

  // ========== 团体公开练习 (unit) ==========
  {
    id: 'unit_cometik_1',
    title: '【全皮肤】283公开练习CoMETIK',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习CoMETIK.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习CoMETIK.mp4`,
    duration: '10:00',
    releaseDate: '2024/06/01',
    category: 'unit',
    unlocked: true,
    unitId: 'cometik',
  },
  {
    id: 'unit_cometik_2',
    title: '【全皮肤】283公开练习CoMETIK 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习CoMETIK 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习CoMETIK 2.mp4`,
    duration: '10:00',
    releaseDate: '2024/09/01',
    category: 'unit',
    unlocked: true,
    unitId: 'cometik',
  },
  {
    id: 'unit_cometik_3',
    title: '【SCSP】283公开练习CoMETIK 3',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习CoMETIK 3.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习CoMETIK 3.mp4`,
    duration: '10:04',
    releaseDate: '2025/12/09',
    category: 'unit',
    unlocked: true,
    unitId: 'cometik',
  },
  {
    id: 'unit_noctchill_1',
    title: '【全皮肤】283公开练习Noctchill',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Noctchill.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Noctchill.mp4`,
    duration: '12:00',
    releaseDate: '2024/05/01',
    category: 'unit',
    unlocked: true,
    unitId: 'noctchill',
  },
  {
    id: 'unit_noctchill_2',
    title: '【全皮肤】283公开练习Noctchill 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Noctchill 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Noctchill 2.mp4`,
    duration: '10:00',
    releaseDate: '2024/08/01',
    category: 'unit',
    unlocked: true,
    unitId: 'noctchill',
  },
  {
    id: 'unit_straylight_1',
    title: '【全皮肤】283公开练习Straylight',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Straylight.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Straylight.mp4`,
    duration: '12:00',
    releaseDate: '2024/04/01',
    category: 'unit',
    unlocked: true,
    unitId: 'straylight',
  },
  {
    id: 'unit_straylight_2',
    title: '【全皮肤】283公开练习Straylight 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Straylight 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Straylight 2.mp4`,
    duration: '10:00',
    releaseDate: '2024/07/01',
    category: 'unit',
    unlocked: true,
    unitId: 'straylight',
  },
  {
    id: 'unit_straylight_3',
    title: '【SCSP】283公开练习Straylight 3',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习Straylight 3.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习Straylight 3.mp4`,
    duration: '12:00',
    releaseDate: '2025/10/01',
    category: 'unit',
    unlocked: true,
    unitId: 'straylight',
  },
  {
    id: 'unit_straylight_4',
    title: '【SCSP】283公开练习Straylight 4',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习Straylight 4.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习Straylight 4.mp4`,
    duration: '12:00',
    releaseDate: '2025/11/01',
    category: 'unit',
    unlocked: true,
    unitId: 'straylight',
  },
  {
    id: 'unit_illumination_stars_1',
    title: '【全皮肤】283公开练习illuminationstars',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习illuminationstars.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习illuminationstars.mp4`,
    duration: '12:00',
    releaseDate: '2024/03/01',
    category: 'unit',
    unlocked: true,
    unitId: 'illumination_stars',
  },
  {
    id: 'unit_illumination_stars_2',
    title: '【全皮肤】283公开练习illuminationstars 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习illuminationstars 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习illuminationstars 2.mp4`,
    duration: '10:00',
    releaseDate: '2024/06/01',
    category: 'unit',
    unlocked: true,
    unitId: 'illumination_stars',
  },
  {
    id: 'unit_illumination_stars_3',
    title: '【SCSP】283公开练习illuminationstars 3',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习illuminationstars 3.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习illuminationstars 3.mp4`,
    duration: '10:00',
    releaseDate: '2025/11/01',
    category: 'unit',
    unlocked: true,
    unitId: 'illumination_stars',
  },
  {
    id: 'unit_lantica_1',
    title: '【全皮肤】283公开练习安提卡',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习安提卡.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习安提卡.mp4`,
    duration: '13:00',
    releaseDate: '2024/02/01',
    category: 'unit',
    unlocked: true,
    unitId: 'lantica',
  },
  {
    id: 'unit_lantica_2',
    title: '【全皮肤】283公开练习安提卡 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习安提卡 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习安提卡 2.mp4`,
    duration: '06:00',
    releaseDate: '2024/05/01',
    category: 'unit',
    unlocked: true,
    unitId: 'lantica',
  },
  {
    id: 'unit_lantica_3',
    title: "【全皮肤】283公开练习L'Antica 3",
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习L'Antica 3.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习L'Antica 3.mp4`,
    duration: '10:00',
    releaseDate: '2024/08/01',
    category: 'unit',
    unlocked: true,
    unitId: 'lantica',
  },
  {
    id: 'unit_lantica_4',
    title: "【SCSP】283公开练习L'Antica 4",
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习L'Antica 4.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习L'Antica 4.mp4`,
    duration: '12:00',
    releaseDate: '2025/10/01',
    category: 'unit',
    unlocked: true,
    unitId: 'lantica',
  },
  {
    id: 'unit_houkago_1',
    title: '【全皮肤】283公开练习放课后Climax girls',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习放课后Climax girls.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习放课后Climax girls.mp4`,
    duration: '15:00',
    releaseDate: '2024/01/01',
    category: 'unit',
    unlocked: true,
    unitId: 'houkago_climax_girls',
  },
  {
    id: 'unit_houkago_2',
    title: '【全皮肤】283公开练习放课后Climax girls 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习放课后Climax girls 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习放课后Climax girls 2.mp4`,
    duration: '12:00',
    releaseDate: '2024/04/01',
    category: 'unit',
    unlocked: true,
    unitId: 'houkago_climax_girls',
  },
  {
    id: 'unit_houkago_3',
    title: '【SCSP】283公开练习放课后Climax girls 3',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习放课后Climax girls 3.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习放课后Climax girls 3.mp4`,
    duration: '12:00',
    releaseDate: '2025/11/01',
    category: 'unit',
    unlocked: true,
    unitId: 'houkago_climax_girls',
  },
  {
    id: 'unit_shhis_1',
    title: '【全皮肤】283公开练习Shhis',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Shiis.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Shiis.mp4`,
    duration: '09:00',
    releaseDate: '2024/03/01',
    category: 'unit',
    unlocked: true,
    unitId: 'shhis',
  },
  {
    id: 'unit_shhis_2',
    title: '【全皮肤】283公开练习Shhis 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Shhis 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Shhis 2.mp4`,
    duration: '10:00',
    releaseDate: '2024/06/01',
    category: 'unit',
    unlocked: true,
    unitId: 'shhis',
  },
  {
    id: 'unit_shhis_3',
    title: '【SCSP】283公开练习Shhis 3',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习Shhis 3.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习Shhis 3.mp4`,
    duration: '10:00',
    releaseDate: '2025/09/01',
    category: 'unit',
    unlocked: true,
    unitId: 'shhis',
  },
  {
    id: 'unit_shhis_4',
    title: '【SCSP】283公开练习Shhis 4',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习Shhis 4.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习Shhis 4.mp4`,
    duration: '08:00',
    releaseDate: '2025/10/01',
    category: 'unit',
    unlocked: true,
    unitId: 'shhis',
  },
  {
    id: 'unit_alstroemeria_2',
    title: '【全皮肤】283公开练习Alstroemeria 2',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开练习Alstroemeria 2.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开练习Alstroemeria 2.mp4`,
    duration: '12:00',
    releaseDate: '2024/07/01',
    category: 'unit',
    unlocked: true,
    unitId: 'alstroemeria',
  },

  // ========== 其他 (etc) ==========
  {
    id: 'etc_fumage',
    title: '【SCSP】283公开练习Fumage',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习Fumage.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习Fumage.mp4`,
    duration: '10:00',
    releaseDate: '2025/12/09',
    category: 'etc',
    unlocked: true,
    description: 'Fumageの公開練習をお届け！',
  },
  {
    id: 'etc_cutie_finder',
    title: "【SCSP】283公开练习I'm a Cutie Finder",
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【SCSP】283公开练习I'm a Cutie Finder.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【SCSP】283公开练习I'm a Cutie Finder.mp4`,
    duration: '12:00',
    releaseDate: '2025/11/08',
    category: 'etc',
    unlocked: true,
    description: "I'm a Cutie Finderの公開練習！",
  },
  {
    id: 'etc_anniversary',
    title: '【全皮肤】283公开直播一周年特别篇',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.【全皮肤】283公开直播一周年特别篇.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.【全皮肤】283公开直播一周年特别篇.mp4`,
    duration: '16:00',
    releaseDate: '2024/11/10',
    category: 'etc',
    unlocked: true,
    description: '283プロダクション一周年特別配信！',
  },
  {
    id: 'etc_alstroemeria_summer',
    title: '夏装',
    thumbnail: `${THUMBNAIL_BASE_URL}/1.夏装.webp`,
    videoUrl: `${VIDEO_BASE_URL}/1.夏装.mp4`,
    duration: '12:00',
    releaseDate: '2024/07/01',
    category: 'etc',
    unlocked: true,
  },
  {
    id: 'etc_alstroemeria_autumn',
    title: '秋装',
    thumbnail: `${THUMBNAIL_BASE_URL}/2.秋装.webp`,
    videoUrl: `${VIDEO_BASE_URL}/2.秋装.mp4`,
    duration: '11:00',
    releaseDate: '2024/10/01',
    category: 'etc',
    unlocked: true,
  },
];

// 兼容旧的 MOCK_VIDEOS 引用
export const MOCK_VIDEOS = STREAM_VIDEOS;

// ============ Helper Functions ============

/**
 * 根据分类获取视频列表
 */
export function getVideosByCategory(category: StreamVideo['category']): StreamVideo[] {
  return STREAM_VIDEOS.filter(v => v.category === category);
}

/**
 * 根据ID获取视频
 */
export function getVideoById(id: string): StreamVideo | undefined {
  return STREAM_VIDEOS.find(v => v.id === id);
}

/**
 * 根据偶像ID获取视频
 */
export function getVideosByIdol(idolId: string): StreamVideo[] {
  return STREAM_VIDEOS.filter(v => v.idolIds?.includes(idolId));
}

/**
 * 根据团体ID获取视频
 */
export function getVideosByUnit(unitId: string): StreamVideo[] {
  return STREAM_VIDEOS.filter(v => v.unitId === unitId);
}

/**
 * 获取已解锁的视频数量
 */
export function getUnlockedCount(): number {
  return STREAM_VIDEOS.filter(v => v.unlocked).length;
}

/**
 * 获取视频总数
 */
export function getTotalCount(): number {
  return STREAM_VIDEOS.length;
}

/**
 * 创建视频对象（用于从服务器数据转换）
 */
export function createStreamVideo(data: Partial<StreamVideo> & { id: string; title: string }): StreamVideo {
  return {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail || '',
    videoUrl: data.videoUrl || '',
    duration: data.duration || '00:00',
    releaseDate: data.releaseDate || new Date().toLocaleDateString('ja-JP'),
    category: data.category || 'etc',
    unlocked: data.unlocked ?? false,
    description: data.description,
    idolIds: data.idolIds,
    unitId: data.unitId,
  };
}
