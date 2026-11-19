/**
 * 잠수함 그림(SVG). 재료와 능력에 맞춰 실루엣·표면·장식이 모두 다릅니다.
 * 모두 오른쪽을 바라보며(창이 앞쪽) 128×76 크기입니다.
 * 반짝임·불꽃·번개 같은 움직임은 SMIL 애니메이션이라 상점 그림에서 움직이고,
 * 게임 안 텍스처는 첫 장면으로 그려집니다(게임 안 움직임은 OceanScene의 잠수함 효과가 담당).
 * btoa로 인코딩하므로 SVG 안에는 영문·숫자만 씁니다.
 */

const OUTLINE = '#0b1324';

/** 4갈래 반짝이 별 */
function sparkle(cx: number, cy: number, r: number, fill: string, delay: number, dur = 1.8, base = 0.95) {
  const d = `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
  return `<path fill="${fill}" stroke="none" opacity="${base}" d="${d}">
    <animate attributeName="opacity" values="${base};0.05;${base}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};45 ${cx} ${cy};0 ${cx} ${cy}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
  </path>`;
}

/** 깜빡이는 효과(불꽃·번개·빛) */
function flicker(body: string, delay: number, dur = 0.6, low = 0.35) {
  return `<g>${body}<animate attributeName="opacity" values="1;${low};0.85;${low};1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></g>`;
}

/** 둥근 유리창(앞쪽) */
function porthole(cx: number, cy: number, r: number, rim: string, glass: string, glint = '#f0f9ff') {
  return `<circle fill="${rim}" cx="${cx}" cy="${cy}" r="${r + 3.5}"/>
    <circle fill="url(#glass)" cx="${cx}" cy="${cy}" r="${r}"/>
    <path fill="${glass}" stroke="none" opacity="0.45" d="M${cx - r * 0.9} ${cy + r * 0.2}A${r} ${r} 0 0 0 ${cx + r * 0.9} ${cy + r * 0.25}Z"/>
    <ellipse fill="${glint}" stroke="none" cx="${cx - r * 0.35}" cy="${cy - r * 0.4}" rx="${r * 0.32}" ry="${r * 0.2}" transform="rotate(-30 ${cx - r * 0.35} ${cy - r * 0.4})"/>`;
}

function glassGradient(light: string, dark: string) {
  return `<radialGradient id="glass" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`;
}

function vertical(id: string, stops: Array<[number, string]>) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

/** 일반 잠수함: 둥근 노란 선체, 리벳, 잠망경, 프로펠러 */
const basic = () => ({
  defs: `${vertical('hull', [[0, '#fff7ae'], [0.45, '#fde047'], [1, '#d97706']])}${glassGradient('#bae6fd', '#0369a1')}`,
  body: `
    <g transform="translate(9 41)"><ellipse fill="#f59e0b" cx="0" cy="-9" rx="3.5" ry="9"/><ellipse fill="#fbbf24" cx="0" cy="9" rx="3.5" ry="9"/>
      <animateTransform attributeName="transform" type="scale" values="1 1;1 0.25;1 1" additive="sum" dur="0.5s" repeatCount="indefinite"/></g>
    <rect fill="#b45309" x="11" y="38" width="12" height="6" rx="2"/>
    <path fill="#f59e0b" d="M26 30 16 20 18 36Z M26 52 16 62 18 46Z"/>
    <path fill="none" stroke="#475569" stroke-width="3" d="M58 22V9H70"/><rect fill="#38bdf8" x="69" y="6" width="6" height="6" rx="1.5"/>
    <path fill="url(#hull)" d="M48 26Q50 17 60 17H72Q80 17 81 26Z"/>
    <ellipse fill="url(#hull)" cx="66" cy="42" rx="46" ry="20"/>
    <path fill="none" stroke="#fff7ae" stroke-width="3" stroke-linecap="round" opacity="0.8" d="M34 32Q60 24 96 30"/>
    <path fill="none" stroke="#b45309" stroke-width="1.6" d="M44 24V60M84 25V59"/>
    <g fill="#92400e" stroke="none">${[30, 38, 46, 54].map(y => `<circle cx="44" cy="${y}" r="1.5"/><circle cx="84" cy="${y + 1}" r="1.5"/>`).join('')}</g>
    <circle fill="#0ea5e9" cx="56" cy="44" r="4.5"/><circle fill="#0ea5e9" cx="70" cy="44" r="4.5"/>
    <circle fill="#e0f2fe" stroke="none" cx="55" cy="42.5" r="1.3"/><circle fill="#e0f2fe" stroke="none" cx="69" cy="42.5" r="1.3"/>
    <path fill="#f59e0b" d="M52 59 46 68H78L82 58Z"/>
    ${porthole(96, 39, 9, '#f59e0b', '#7dd3fc')}`,
});

/** 튼튼한 검정 잠수함: 깨뜨린 부싯돌 조각을 붙인 각진 선체, 철띠, 충각 */
const sturdy = () => ({
  defs: `${vertical('hull', [[0, '#71717a'], [0.5, '#27272a'], [1, '#09090b']])}${vertical('band', [[0, '#d4d4d8'], [1, '#52525b']])}${glassGradient('#fca5a5', '#450a0a')}`,
  body: `
    <path fill="#3f3f46" d="M24 26 6 16 10 40 6 62 24 52Z"/>
    <path fill="#52525b" d="M10 40 24 36V46Z"/>
    <path fill="url(#hull)" d="M22 30 34 20 50 15 84 15 104 22 118 34 124 42 116 50 100 60 48 63 30 58 20 48Z"/>
    <g stroke="#a1a1aa" stroke-width="1.2" opacity="0.95">
      <path fill="#3f3f46" d="M34 21 50 16 54 33 36 36Z"/><path fill="#18181b" d="M36 36 54 33 50 56 32 54Z"/>
      <path fill="#52525b" d="M54 16 74 16 70 31 54 33Z"/><path fill="#27272a" d="M54 33 70 31 74 58 50 56Z"/>
      <path fill="#3f3f46" d="M74 16 92 18 86 34 70 31Z"/><path fill="#18181b" d="M70 31 86 34 92 58 74 58Z"/>
    </g>
    <path fill="none" stroke="#e4e4e7" stroke-width="1" opacity="0.55" d="M38 26Q44 22 48 22M39 30Q45 26 50 26M57 22Q63 19 70 19M58 26Q64 23 69 23M76 22Q82 20 88 21M77 26Q83 24 87 25M38 44Q43 47 47 51M58 42Q63 46 66 51M76 40Q81 45 84 50"/>
    <rect fill="url(#band)" x="43" y="14" width="6" height="50" rx="1.5"/><rect fill="url(#band)" x="79" y="14" width="6" height="47" rx="1.5"/>
    <g fill="#e4e4e7" stroke="none">${[20, 30, 40, 50, 59].map(y => `<circle cx="46" cy="${y}" r="1.6"/><circle cx="82" cy="${y}" r="1.6"/>`).join('')}</g>
    <path fill="#52525b" d="M48 15 50 5H74L78 15Z"/><path fill="none" stroke="#a1a1aa" stroke-width="1.5" d="M53 9H72"/>
    <path fill="#71717a" d="M112 44 127 40 124 48 112 52Z"/><path fill="#d4d4d8" stroke="none" d="M113 45 125 41.5 124 44 113 47Z"/>
    <path fill="#3f3f46" d="M50 62 44 72H80L86 61Z"/>
    <rect fill="#27272a" x="93" y="29" width="20" height="16" rx="3"/>
    <rect fill="url(#glass)" x="96" y="32" width="14" height="10" rx="2"/>
    <path fill="#fecaca" stroke="none" opacity="0.8" d="M97 33H103L99 37H97Z"/>`,
});

/** 불속성 잠수함: 붉은 유선형, 불꽃 지느러미, 빛나는 루비 코어, 꼬리 불꽃 */
const fire = () => ({
  defs: `${vertical('hull', [[0, '#fda4af'], [0.4, '#e11d48'], [1, '#7f1d1d']])}
    <radialGradient id="ruby" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#fff1f2"/><stop offset="0.3" stop-color="#fb7185"/><stop offset="1" stop-color="#9f1239"/></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fdba74" stop-opacity="0.95"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
    ${glassGradient('#fed7aa', '#7c2d12')}`,
  body: `
    ${flicker(`<path fill="#ef4444" stroke="none" d="M26 36Q12 26 0 32Q8 36 1 42Q8 46 0 50Q12 54 26 46Z"/><path fill="#f97316" stroke="none" d="M26 38Q14 32 6 36Q12 39 6 43Q12 46 8 48Q16 50 26 45Z"/><path fill="#fde047" stroke="none" d="M26 39Q18 37 13 40Q17 42 14 45Q20 45 26 44Z"/>`, 0, 0.45, 0.55)}
    <path fill="#be123c" d="M28 32Q16 18 10 4Q24 12 30 6Q32 18 40 28Z"/>
    <path fill="#be123c" d="M28 52Q16 62 12 72Q26 66 34 70Q34 60 40 56Z"/>
    <path fill="url(#hull)" d="M24 40Q30 22 60 20Q100 18 120 38Q104 60 60 62Q30 60 24 40Z"/>
    <path fill="none" stroke="#fecdd3" stroke-width="2.5" stroke-linecap="round" opacity="0.8" d="M36 30Q66 22 104 28"/>
    ${flicker(`<path fill="#f97316" d="M46 22Q44 10 50 4Q52 12 56 12Q56 4 62 0Q64 10 68 10Q70 4 74 4Q76 14 80 21Z"/><path fill="#fde047" stroke="none" d="M52 21Q52 14 55 12Q57 17 62 16Q63 9 66 7Q68 15 72 21Z"/>`, 0.2, 0.7, 0.6)}
    <circle fill="url(#glow)" stroke="none" cx="58" cy="42" r="16"><animate attributeName="r" values="16;19;16" dur="1.2s" repeatCount="indefinite"/></circle>
    <path fill="url(#ruby)" d="M50 42 54 34H64L68 42 59 52Z"/>
    <path fill="none" stroke="#ffe4e6" stroke-width="1" d="M50 42H68M54 34 59 42 64 34M59 42V52"/>
    ${sparkle(55, 36, 3.5, '#fff7ed', 0.4, 1.4)}
    <path fill="#9f1239" d="M64 60 60 70H86L90 58Z"/>
    ${porthole(98, 37, 8, '#9f1239', '#fdba74')}`,
});

/** 얼음속성 잠수함: 투명한 얼음 결정 선체, 사파이어 면, 고드름, 눈송이 */
const ice = () => ({
  defs: `${vertical('hull', [[0, '#f0f9ff'], [0.45, '#7dd3fc'], [1, '#1e3a8a']])}${vertical('sapphire', [[0, '#93c5fd'], [0.5, '#2563eb'], [1, '#1e3a8a']])}${glassGradient('#e0f2fe', '#1d4ed8')}`,
  body: `
    <path fill="#bfdbfe" d="M24 34 4 18 12 40 4 64 24 48Z"/><path fill="#eff6ff" stroke="none" d="M8 24 20 36 12 40Z"/>
    <path fill="#dbeafe" d="M30 24 34 6 42 22 50 0 58 20 66 4 72 21 82 10 86 26Z"/>
    <path fill="#ffffff" stroke="none" opacity="0.8" d="M34 8 38 22M50 3 52 20M66 7 68 21"/>
    <path fill="url(#hull)" d="M22 40 30 26 52 18 88 18 110 26 122 38 112 52 88 60 50 62 30 56Z"/>
    <g stroke="#e0f2fe" stroke-width="1.1" opacity="0.9">
      <path fill="url(#sapphire)" d="M46 26 62 22 70 38 56 50 42 40Z"/>
      <path fill="#60a5fa" d="M70 38 62 22 82 24Z"/><path fill="#1d4ed8" d="M70 38 82 24 86 42 72 54Z"/>
      <path fill="#3b82f6" d="M56 50 70 38 72 54Z"/>
    </g>
    <path fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.85" d="M47 27 61 23"/>
    <path fill="#e0f2fe" d="M40 60 43 74 48 61Z M54 62 58 76 63 62Z M70 61 73 72 77 60Z M86 58 88 67 92 57Z"/>
    <g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.95">
      <path d="M33 38V50M27 44H39M29 40 37 48M37 40 29 48"/>
      <animateTransform attributeName="transform" type="rotate" values="0 33 44;360 33 44" dur="8s" repeatCount="indefinite"/>
    </g>
    ${sparkle(52, 30, 3.5, '#ffffff', 0.1, 2.2)}${sparkle(80, 30, 3, '#ffffff', 0.9, 2.2)}${sparkle(108, 46, 2.5, '#f0f9ff', 1.5, 2.2)}
    ${porthole(100, 37, 8, '#1e40af', '#bfdbfe')}`,
});

/** 전기속성 잠수함: 토파즈 코어, 테슬라 코일과 번개, 경고 줄무늬, 구리 코일 */
const electric = () => ({
  defs: `${vertical('hull', [[0, '#fef3c7'], [0.4, '#fbbf24'], [1, '#92400e']])}${vertical('copper', [[0, '#fdba74'], [1, '#9a3412']])}
    <linearGradient id="topaz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7ed"/><stop offset="0.4" stop-color="#fb923c"/><stop offset="1" stop-color="#c2410c"/></linearGradient>
    <pattern id="hazard" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#facc15"/><rect width="4" height="8" fill="#1c1917"/></pattern>
    ${glassGradient('#fef9c3', '#a16207')}`,
  body: `
    <path fill="#b45309" d="M24 32 8 18 12 40 8 62 24 50Z"/>
    <path fill="url(#hull)" d="M22 40Q24 22 58 20Q98 18 118 34L122 42 114 52Q96 62 58 62Q24 60 22 40Z"/>
    <path fill="url(#hazard)" stroke="none" d="M24 46Q40 56 58 57V62Q30 60 23 48Z"/>
    <path fill="none" stroke="#fffbeb" stroke-width="2.5" stroke-linecap="round" opacity="0.75" d="M34 29Q64 22 100 28"/>
    ${[30, 37, 44].map(x => `<rect fill="url(#copper)" x="${x}" y="24" width="4.5" height="32" rx="2"/>`).join('')}
    <path fill="#57534e" d="M60 21V10H64V21Z M80 21V8H84V21Z"/>
    <circle fill="#fde68a" cx="62" cy="8" r="4"/><circle fill="#fde68a" cx="82" cy="6" r="4"/>
    ${flicker(`<path fill="none" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M64 6 69 1 72 7 77 2 80 5"/>`, 0, 0.35, 0.05)}
    ${flicker(`<path fill="none" stroke="#fef9c3" stroke-width="1.6" stroke-linecap="round" d="M58 6 53 2 50 7 45 3"/><path fill="none" stroke="#fef9c3" stroke-width="1.6" stroke-linecap="round" d="M86 4 91 0 93 6 98 2"/>`, 0.15, 0.45, 0.05)}
    <path fill="url(#topaz)" d="M56 32 66 28 76 32 78 42 66 52 54 42Z"/>
    <path fill="none" stroke="#fff7ed" stroke-width="1" d="M56 32 66 38 76 32M54 42 66 38 78 42M66 28V52"/>
    ${flicker(`<path fill="#fefce8" stroke="#ca8a04" stroke-width="0.8" d="M68 30 62 40H67L63 50 72 38H67Z"/>`, 0.3, 0.9, 0.4)}
    <path fill="#92400e" d="M64 60 60 70H86L90 58Z"/>
    ${porthole(100, 37, 8, '#92400e', '#fde68a')}`,
});

/** 메탈 잠수함(다이아몬드): 거울 같은 은빛 선체, 브릴리언트 컷 다이아몬드, 무지갯빛, 반짝이 */
const metal = () => ({
  defs: `${vertical('hull', [[0, '#ffffff'], [0.18, '#e2e8f0'], [0.42, '#94a3b8'], [0.55, '#f8fafc'], [0.75, '#cbd5e1'], [1, '#475569']])}
    <linearGradient id="prism" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0abfc"/><stop offset="0.25" stop-color="#93c5fd"/><stop offset="0.5" stop-color="#6ee7b7"/><stop offset="0.75" stop-color="#fde68a"/><stop offset="1" stop-color="#fda4af"/></linearGradient>
    <pattern id="lattice" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.55"/></pattern>
    <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a5f3fc"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    ${glassGradient('#ecfeff', '#0e7490')}`,
  body: `
    <path fill="#cbd5e1" d="M24 30 4 14 10 40 4 66 24 50Z"/><path fill="#ffffff" stroke="none" opacity="0.8" d="M8 20 20 34 10 38Z"/>
    <path fill="#e2e8f0" d="M50 20 56 6H76L82 20Z"/><path fill="none" stroke="#ffffff" stroke-width="1.5" d="M58 9H74"/>
    <path fill="url(#hull)" d="M22 40 32 24 56 18H92L114 28 126 40 114 52 92 60H56L32 56Z"/>
    <path fill="url(#lattice)" stroke="none" d="M24 40 33 25 56 19H92L113 29 124 40 113 51 92 59H56L33 55Z"/>
    ${[44, 52, 84, 92].map(x => `<path fill="#a5f3fc" stroke="#0e7490" stroke-width="0.8" d="M${x} 17 ${x + 3} 20 ${x} 23 ${x - 3} 20Z"/>`).join('')}
    <path fill="url(#prism)" stroke="none" opacity="0.55" d="M30 38 120 36 118 40 30 43Z">
      <animate attributeName="opacity" values="0.55;0.25;0.55" dur="2.4s" repeatCount="indefinite"/></path>
    <path fill="none" stroke="#64748b" stroke-width="1" d="M40 22V58M98 22V58"/>
    <g stroke="#0e7490" stroke-width="1">
      <path fill="url(#gem)" d="M50 34 58 26H78L86 34 68 56Z"/>
      <path fill="#ecfeff" d="M58 26 62 34H74L78 26Z"/><path fill="#67e8f9" d="M50 34H62L68 56Z"/>
      <path fill="#cffafe" d="M62 34H74L68 56Z"/><path fill="#22d3ee" d="M74 34H86L68 56Z"/>
      <path fill="none" d="M58 26 50 34M78 26 86 34M62 34 58 26M74 34 78 26M68 26V34"/>
    </g>
    <path fill="#f0abfc" stroke="none" opacity="0.5" d="M64 36 68 54 66 36Z"/>
    ${sparkle(60, 28, 5, '#ffffff', 0, 1.3)}${sparkle(84, 38, 3.5, '#ffffff', 0.45, 1.3)}${sparkle(36, 30, 3, '#e0f2fe', 0.9, 1.3)}
    ${sparkle(112, 30, 3, '#ffffff', 0.25, 1.6)}${sparkle(46, 52, 2.5, '#f5d0fe', 0.7, 1.6)}${sparkle(88, 56, 2.5, '#bae6fd', 1.1, 1.6)}
    <path fill="#94a3b8" d="M54 59 48 70H84L90 58Z"/>
    ${porthole(106, 39, 7, '#64748b', '#a5f3fc')}`,
});

/** 아기 드래곤 잠수함: 원래 게임에 있던 외형을 그대로 씁니다(테두리 색·두께 포함). */
const ORIGINAL_BABY_DRAGON = `<g stroke="#082f49" stroke-width="2.2" stroke-linejoin="round"><path fill="#0369a1" stroke="#0c4a6e" d="M42 40Q10 54 7 24L22 34 15 16 37 30Z"/>
      <path fill="#38bdf8" stroke="#075985" d="M37 34 32 9 51 20 65 6 69 33Z"/>
      <ellipse fill="#0891b2" cx="64" cy="44" rx="35" ry="20"/>
      <path fill="#bae6fd" stroke="#0284c7" d="M52 48Q63 42 77 48L77 61Q63 68 52 59Z"/>
      <path fill="#22d3ee" stroke="#075985" d="M72 29Q82 14 103 23L118 38 114 50 93 54 80 47Z"/>
      <path fill="#fef3c7" stroke="#a8a29e" d="M82 25 78 7 91 23 M98 24 104 10 107 30"/>
      <path fill="#0284c7" d="M38 55 34 65H52L56 57 M76 56 80 66H96L91 53Z"/>
      <circle fill="#082f49" cx="100" cy="35" r="7"/><circle fill="#7dd3fc" cx="100" cy="35" r="4"/>
      <circle fill="#fff" stroke="none" cx="101" cy="33" r="1.5"/>
      <path fill="#e0f2fe" d="M113 44 109 50 105 45Z"/>
      <path fill="none" stroke="#67e8f9" stroke-width="2" d="m38 37 5 5 5-5m0 9 5 5 5-5m-2-12 5 5 5-5m-2 10 5 5 5-5"/><circle fill="#7dd3fc" stroke="none" cx="10" cy="65" r="2.5"/><circle fill="#bae6fd" stroke="none" cx="3" cy="71" r="1.5"/></g>`;
const babyDragon = () => ({ defs: '', body: ORIGINAL_BABY_DRAGON });

const ART: Record<string, () => { defs: string; body: string }> = {
  basic, sturdy, fire, ice, electric, metal, baby_dragon: babyDragon,
};

export function submarineSvg(id: string): string {
  if (id === 'baby_dragon') return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="76" viewBox="0 0 128 76">${ORIGINAL_BABY_DRAGON}</svg>`;
  const art = (ART[id] ?? basic)();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="76" viewBox="0 0 128 76"><defs>${art.defs}</defs><g stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round">${art.body}</g></svg>`;
}

export function submarineDataUrl(id: string): string {
  return `data:image/svg+xml;base64,${btoa(submarineSvg(id))}`;
}
