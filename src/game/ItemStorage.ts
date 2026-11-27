/** 가방 수조의 아이템 보관소: 광석, 식물, 소재(보스별) 칸과 그림을 정합니다. */
import { ALL_MINERALS } from './Submarines.js';
import { CROPS } from './Crops.js';

/** 그림 파일 경로(public 기준) 또는 그림이 없을 때 쓸 이모지 */
export interface StorageItem {
  name: string;
  /** 칸에 쓰는 짧은 이름(보스 이름은 칸 제목에 있으므로 뺍니다) */
  label?: string;
  image?: string;
  emoji?: string;
}

export interface StorageGroup {
  title: string;
  items: StorageItem[];
}

export interface StorageSection {
  id: 'ore' | 'plant' | 'material';
  title: string;
  groups: StorageGroup[];
}

export interface StorageSlot extends StorageItem { count: number }
export interface StorageView {
  id: StorageSection['id'];
  title: string;
  groups: Array<{ title: string; items: StorageSlot[] }>;
}

const MINERAL_IMAGES: Partial<Record<string, string>> = {
  다이아몬드: 'items/mineral-diamond', 루비: 'items/mineral-ruby', 사파이어: 'items/mineral-sapphire', 토파즈: 'items/mineral-topaz',
  그라시스메탈: 'items/ore-glacis-metal', 레인보우크리스탈: 'items/ore-rainbow-crystal', '슈퍼 루비': 'items/ore-super-ruby',
  '슈퍼 사파이어': 'items/ore-super-sapphire', '슈퍼 토파즈': 'items/ore-super-topaz',
};
const png = (path: string) => `assets/${path}.png`;

/** 보스별 소재. 같은 보스가 주는 재료끼리 한 칸에 모읍니다. */
export const MATERIAL_GROUPS: StorageGroup[] = [
  { title: '수룡 소재', items: [
    { name: '수룡의 비늘', image: png('boss/water-dragon-scales') },
    { name: '수룡의 머리뼈', image: png('boss/water-dragon-skull') },
  ] },
  { title: '헬리코프리온 소재', items: [
    { name: '헬리코프리온의 아래턱', image: png('items/loot-helicoprion-jaw') },
    { name: '헬리코프리온의 살점', emoji: '🥩' },
    { name: '헬리코프리온의 비늘', emoji: '💠' },
    { name: '낡은 고대의 편지', emoji: '📜' },
  ] },
  { title: '진화한 수룡 소재', items: [
    { name: '수룡의 역광비늘', image: png('boss/abyss-loot-scales') },
    { name: '수룡의 불멸의 꼬리가시', image: png('boss/abyss-loot-tail-spike') },
    { name: '수룡의 퇴화된 날개', image: png('boss/abyss-loot-wing') },
    { name: '수룡의 머리뼈+', image: png('boss/abyss-loot-skull-plus') },
  ] },
  { title: 'M-X 3 전리품', items: [
    { name: '치유의 보석', emoji: '💚' },
    { name: '금목걸이', emoji: '📿' },
    { name: '다이아몬드 반지', emoji: '💍' },
  ] },
];

export const STORAGE_SECTIONS: StorageSection[] = [
  { id: 'ore', title: '광석', groups: [{ title: '광석', items: ALL_MINERALS.map(name => {
    const image = MINERAL_IMAGES[name];
    return image ? { name, image: png(image) } : { name, emoji: '🪨' };
  }) }] },
  { id: 'plant', title: '식물', groups: [{ title: '식물', items: CROPS.map(crop => ({ name: crop.name, image: png(`items/${crop.icon}`) })) }] },
  { id: 'material', title: '소재', groups: MATERIAL_GROUPS },
];

/** 가진 개수를 채운 보관소 화면 데이터. 목록에 없는 전리품은 '기타 소재'에 모읍니다. */
export function storageView(
  minerals: Readonly<Record<string, number>>,
  crops: Readonly<Record<string, number>>,
  loot: readonly string[],
): StorageView[] {
  const lootCounts = new Map<string, number>();
  for (const name of loot) lootCounts.set(name, (lootCounts.get(name) ?? 0) + 1);
  const known = new Set(MATERIAL_GROUPS.flatMap(group => group.items.map(item => item.name)));
  const extra = [...lootCounts.keys()].filter(name => !known.has(name));
  const count = (id: StorageSection['id'], name: string) =>
    id === 'ore' ? minerals[name] ?? 0 : id === 'plant' ? crops[name] ?? 0 : lootCounts.get(name) ?? 0;
  return STORAGE_SECTIONS.map(section => {
    const groups = section.id === 'material' && extra.length
      ? [...section.groups, { title: '기타 소재', items: extra.map((name): StorageItem => ({ name, emoji: '🎁' })) }]
      : section.groups;
    return {
      id: section.id,
      title: section.title,
      groups: groups.map(group => ({ title: group.title, items: group.items.map(item => ({
        ...item, label: item.label ?? shortLabel(item.name), count: count(section.id, item.name),
      })) })),
    };
  });
}

/** '헬리코프리온의 아래턱' → '아래턱', '수룡의 머리뼈+' → '머리뼈+' */
export function shortLabel(name: string): string {
  return name.replace(/^(헬리코프리온의|수룡의) /, '');
}
