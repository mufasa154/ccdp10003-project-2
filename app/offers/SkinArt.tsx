// Skin artwork for the Offers page.
// Same look as the loot boxes on /assignments: flat bright fills,
// chunky black outlines (strokeWidth ~4-6) and a darker "shade" shape for depth.

const S = "#000";

/** Shared chunky cartoon head. Children are drawn on top (eyes, hats, props). */
function Head({
  skin = "#ffd3a8",
  shade = "#f0a870",
  children,
}: {
  skin?: string;
  shade?: string;
  children?: React.ReactNode;
}) {
  return (
    <g>
      {/* Neck + shoulders */}
      <path d="M38 132 C40 112, 100 112, 102 132 Z" fill="#334155" stroke={S} strokeWidth="5" strokeLinejoin="round" />
      {/* Face */}
      <path
        d="M30 62 C30 30, 110 30, 110 62 L108 86 C104 110, 36 110, 32 86 Z"
        fill={skin}
        stroke={S}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      {/* Jaw shade */}
      <path d="M36 88 C44 104, 96 104, 104 88 C96 98, 44 98, 36 88 Z" fill={shade} />
      {children}
    </g>
  );
}

/* 1. Sleep-Deprived Student */
export function SleepDeprivedArt() {
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <Head skin="#e9d8c4" shade="#c9b29a">
        {/* Messy hair */}
        <path
          d="M26 58 L22 34 L38 42 L42 20 L56 34 L66 14 L76 32 L90 16 L94 38 L112 30 L112 60 C100 44, 40 44, 26 58 Z"
          fill="#5b3a1e"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* Half-closed eyes */}
        <path d="M44 66 L62 66" stroke={S} strokeWidth="5" strokeLinecap="round" />
        <path d="M78 66 L96 66" stroke={S} strokeWidth="5" strokeLinecap="round" />
        <path d="M46 66 C48 72, 60 72, 62 66" fill="#fff" stroke={S} strokeWidth="3" />
        <path d="M78 66 C80 72, 92 72, 94 66" fill="#fff" stroke={S} strokeWidth="3" />
        {/* Purple eye bags */}
        <path d="M44 74 C50 82, 58 82, 64 74" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" />
        <path d="M76 74 C82 82, 90 82, 96 74" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" />
        {/* Wobbly mouth */}
        <path d="M60 92 C64 88, 68 96, 72 92 C76 88, 80 94, 82 92" fill="none" stroke={S} strokeWidth="4" strokeLinecap="round" />
      </Head>
      {/* Coffee cup with drip */}
      <g transform="translate(96 84) rotate(12)">
        <path d="M0 0 L30 0 L26 40 L4 40 Z" fill="#fff" stroke={S} strokeWidth="5" strokeLinejoin="round" />
        <rect x="-2" y="-8" width="34" height="10" rx="3" fill="#7c3f17" stroke={S} strokeWidth="4.5" />
        <rect x="3" y="14" width="24" height="10" fill="#22c55e" stroke={S} strokeWidth="3" />
        <path d="M6 -8 C6 4, 12 6, 10 14" fill="none" stroke="#7c3f17" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* Zzz */}
      <text x="104" y="30" fontSize="20" fill="#fff" stroke={S} strokeWidth="2.5" paintOrder="stroke" fontFamily="Supercell-Magic">Z</text>
      <text x="118" y="16" fontSize="14" fill="#fff" stroke={S} strokeWidth="2" paintOrder="stroke" fontFamily="Supercell-Magic">z</text>
    </svg>
  );
}

/* 2. Group Project Carry */
function MiniTeammate({ x, y, r, hair }: { x: number; y: number; r: number; hair: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <circle cx="0" cy="0" r="13" fill="#ffd3a8" stroke={S} strokeWidth="4" />
      <path d="M-13 -2 C-12 -16, 12 -16, 13 -2 C6 -8, -6 -8, -13 -2 Z" fill={hair} stroke={S} strokeWidth="3.5" strokeLinejoin="round" />
      {/* Sleeping eyes */}
      <path d="M-8 2 C-6 5, -3 5, -1 2" fill="none" stroke={S} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M2 2 C4 5, 7 5, 9 2" fill="none" stroke={S} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

export function GroupCarryArt() {
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      {/* Three AFK teammates piled on top */}
      <MiniTeammate x={44} y={30} r={-18} hair="#f43f5e" />
      <MiniTeammate x={72} y={18} r={6} hair="#0ea5e9" />
      <MiniTeammate x={100} y={30} r={20} hair="#eab308" />
      <g transform="translate(0 14)">
        <Head skin="#ffcf9e" shade="#ee9f62">
          {/* Headband */}
          <path d="M30 56 C50 46, 90 46, 110 56 L110 66 C90 56, 50 56, 30 66 Z" fill="#ef4444" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
          {/* Determined eyes */}
          <path d="M44 72 L60 76" stroke={S} strokeWidth="5" strokeLinecap="round" />
          <path d="M96 72 L80 76" stroke={S} strokeWidth="5" strokeLinecap="round" />
          <circle cx="53" cy="82" r="4.5" fill={S} />
          <circle cx="87" cy="82" r="4.5" fill={S} />
          {/* Gritted teeth */}
          <rect x="56" y="90" width="28" height="9" rx="2" fill="#fff" stroke={S} strokeWidth="3.5" />
          <path d="M65 90 L65 99 M74 90 L74 99" stroke={S} strokeWidth="2.5" />
          {/* Sweat drop */}
          <path d="M108 60 C114 68, 114 74, 108 76 C102 74, 102 68, 108 60 Z" fill="#7dd3fc" stroke={S} strokeWidth="3" />
        </Head>
      </g>
      {/* AFK bubble */}
      <g transform="translate(4 4)">
        <rect x="0" y="0" width="34" height="18" rx="6" fill="#fff" stroke={S} strokeWidth="3.5" />
        <text x="17" y="13.5" fontSize="10" textAnchor="middle" fill={S} fontFamily="Supercell-Magic">AFK</text>
      </g>
    </svg>
  );
}

/* 5. Exam Week Survivor */
export function ExamSurvivorArt() {
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <Head skin="#f5c9a0" shade="#d89a6a">
        {/* Head bandage */}
        <path d="M28 50 C50 38, 90 38, 112 50 L112 62 C90 52, 50 52, 28 62 Z" fill="#fff" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M30 58 C24 54, 16 60, 14 66 M30 58 C26 64, 22 72, 26 76" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <path d="M30 58 C24 54, 16 60, 14 66 M30 58 C26 64, 22 72, 26 76" fill="none" stroke={S} strokeWidth="1.5" />
        <circle cx="96" cy="54" r="4" fill="#ef4444" />
        {/* Cracked glasses */}
        <circle cx="54" cy="74" r="11" fill="#e0f2fe" stroke={S} strokeWidth="4.5" />
        <circle cx="86" cy="74" r="11" fill="#e0f2fe" stroke={S} strokeWidth="4.5" />
        <path d="M65 74 L75 74" stroke={S} strokeWidth="4" />
        <path d="M80 64 L86 72 L82 76 L90 84" fill="none" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
        {/* Spiral eyes */}
        <circle cx="54" cy="74" r="3.5" fill={S} />
        <circle cx="86" cy="74" r="3.5" fill={S} />
        {/* Wavy worried mouth */}
        <path d="M56 96 L62 92 L68 96 L74 92 L80 96 L86 92" fill="none" stroke={S} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {/* Sweat */}
        <path d="M104 72 C110 80, 110 86, 104 88 C98 86, 98 80, 104 72 Z" fill="#7dd3fc" stroke={S} strokeWidth="3" />
      </Head>
      {/* Pencil behind ear */}
      <g transform="translate(6 40) rotate(-35)">
        <rect x="0" y="0" width="44" height="11" fill="#facc15" stroke={S} strokeWidth="4" />
        <polygon points="44,0 56,5.5 44,11" fill="#fde68a" stroke={S} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="-8" y="0" width="9" height="11" fill="#f472b6" stroke={S} strokeWidth="4" />
      </g>
      {/* Energy drink can */}
      <g transform="translate(104 92) rotate(10)">
        <rect x="0" y="0" width="22" height="38" rx="4" fill="#22d3ee" stroke={S} strokeWidth="4.5" />
        <path d="M4 12 L12 8 L8 20 L18 16" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* 8. Mystery Skin Box */
export function MysteryBoxArt() {
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      {/* Glow rays */}
      <g opacity="0.55">
        <polygon points="70,70 50,0 90,0" fill="#fff" />
        <polygon points="70,70 0,30 0,70" fill="#fff" />
        <polygon points="70,70 140,30 140,70" fill="#fff" />
      </g>
      {/* Box body */}
      <polygon points="20,62 70,48 120,62 116,124 70,136 24,124" fill="#a21caf" stroke={S} strokeWidth="5.5" strokeLinejoin="round" />
      <polygon points="24,66 70,56 70,132 26,120" fill="#d946ef" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
      <polygon points="70,56 116,66 114,120 70,132" fill="#86198f" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
      {/* Lid popping open */}
      <polygon points="14,52 70,34 126,52 70,70" fill="#f0abfc" stroke={S} strokeWidth="5" strokeLinejoin="round" transform="rotate(-8 70 52) translate(0 -10)" />
      {/* Gold straps */}
      <polygon points="44,62 54,59 54,128 44,125" fill="#facc15" stroke={S} strokeWidth="3.5" strokeLinejoin="round" />
      <polygon points="86,59 96,62 94,124 86,127" fill="#ca8a04" stroke={S} strokeWidth="3.5" strokeLinejoin="round" />
      {/* Big ? */}
      <text x="70" y="114" fontSize="44" textAnchor="middle" fill="#fff" stroke={S} strokeWidth="4" paintOrder="stroke" fontFamily="Supercell-Magic">?</text>
    </svg>
  );
}
