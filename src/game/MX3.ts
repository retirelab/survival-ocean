export const MX3_ZONE_INDEX = 10;
export const MX3 = {
  hp: 3500, attack: 10, bombDamage: 40, reflectedBombDamage: 500,
  missileLifetime: 4.5, missileWarning: 1.1, missileSpeed: 250, missileWarningSpeed: 95,
  bombFuse: 3.2, bombPickupRadius: 52, bombBlastRadius: 92,
} as const;

export const MX3_REWARDS = ['치유의 보석', '금목걸이', '다이아몬드 반지'] as const;

export const MX3_INTRO = [
  '뭐가 왔는데요?',
  '뭔데?',
  '대장님, CCTV에 어떤 잠수함이 왔어요!',
  '녀석은 우리의 아군인가? 아니면… 적인가?',
  '대장! 설마 경찰이 여기까지 찾아온 건 아니겠지요!?',
  '아무튼 우리의 비밀기지를 알아냈으니 전원 공격을 개시한다!',
  '(어라?)',
] as const;

export const MX3_CHOICES = [
  '당신 이름이 뭐예요?',
  '그냥 바닷속 탐험을 하려고 왔는데요? 왜요, 불만 있어요?',
] as const;

export const MX3_OUTRO = [
  '우리가 저 쪼꼬만 것한테 지다니…',
  '너 도대체 무엇 때문에 이곳으로 왔냐!?',
  '',
  '아무튼! 난 간다! 어이, 전원 철수!',
  '넵…! (당황하며)',
  '다시는 보지 말자, 애송이…!',
] as const;

export type MX3Phase = 'idle' | 'intro' | 'fight' | 'outro' | 'cleared';
export interface MX3Save { phase: MX3Phase; hp: number; line: number; choice?: 0 | 1 }

export const newMX3 = (): MX3Save => ({ phase: 'idle', hp: MX3.hp, line: 0 });

export function isMX3Save(value: unknown): value is MX3Save {
  if (!value || typeof value !== 'object') return false;
  const { phase, hp, line, choice } = value as MX3Save;
  if (!Number.isFinite(hp) || hp < 0 || hp > MX3.hp || !Number.isInteger(line) || line < 0 ||
      (choice !== undefined && choice !== 0 && choice !== 1)) return false;
  switch (phase) {
    case 'idle': return hp === MX3.hp && line === 0 && choice === undefined;
    case 'intro': return hp === MX3.hp && line < MX3_INTRO.length && choice === undefined;
    case 'fight': return hp > 0 && line === 0 && choice === undefined;
    case 'outro': return hp === 0 && line < MX3_OUTRO.length && (line < 2 ? choice === undefined : line === 2 || choice !== undefined);
    case 'cleared': return hp === 0 && line === 0 && choice !== undefined;
    default: return false;
  }
}

export function advanceMX3Dialogue(state: MX3Save, choice?: 0 | 1): MX3Save {
  if (state.phase === 'idle') return { ...state, phase: 'intro' };
  if (state.phase === 'intro') {
    return state.line + 1 === MX3_INTRO.length ? { ...state, phase: 'fight', line: 0 } : { ...state, line: state.line + 1 };
  }
  if (state.phase !== 'outro') return state;
  if (state.line === 2 && state.choice === undefined) {
    return choice === undefined ? state : { ...state, choice };
  }
  if (state.line + 1 === MX3_OUTRO.length) return { ...state, phase: 'cleared', line: 0 };
  return { ...state, line: state.line + 1 };
}

export function damageMX3(state: MX3Save, damage: number): MX3Save {
  if (state.phase !== 'fight') return state;
  const hp = Math.max(0, state.hp - damage);
  return hp === 0 ? { phase: 'outro', hp, line: 0 } : { ...state, hp };
}

export const mx3MissileSpeed = (remaining: number) =>
  remaining <= MX3.missileWarning ? MX3.missileWarningSpeed : MX3.missileSpeed;
