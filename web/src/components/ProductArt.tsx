import type { CategoryId } from '../data/catalog';

/** Ilustración geométrica original, decorativa; no es una fotografía del producto. */
export default function ProductArt({ category }: { category: CategoryId }) {
  return <div className={`product-art art-${category}`} aria-hidden="true">
    <svg viewBox="0 0 240 160" fill="none">
      <path d="M20 120H75V40H175V105H220M20 60H48V140H195V25" stroke="currentColor" opacity=".15" />
      {category === 'componentes' ? <>
        <path d="M25 80H80M160 80H215" stroke="currentColor" strokeWidth="5" />
        <rect x="76" y="52" width="88" height="56" rx="18" fill="currentColor" />
        <path d="M100 53V107M120 53V107M145 53V107" stroke="#121214" strokeWidth="7" />
      </> : category === 'desarrollo' ? <>
        <rect x="60" y="30" width="120" height="100" rx="8" stroke="currentColor" strokeWidth="3" />
        <rect x="98" y="57" width="44" height="44" rx="4" fill="currentColor" />
        {[0, 1, 2, 3, 4, 5].map(n => <path key={n} d={`M${75 + n * 18} 22v16m0 84v16`} stroke="currentColor" strokeWidth="5" />)}
        <path d="M70 48H89V112H163V47H151" stroke="currentColor" />
      </> : category === 'herramientas' ? <>
        <rect x="80" y="20" width="80" height="120" rx="14" fill="currentColor" />
        <rect x="91" y="34" width="58" height="31" rx="3" fill="#121214" />
        <path d="M103 49h9m7 0h18" stroke="currentColor" strokeWidth="3" />
        <circle cx="120" cy="100" r="18" fill="#121214" /><path d="M120 100l8-11" stroke="currentColor" strokeWidth="4" />
      </> : <>
        <rect x="55" y="40" width="130" height="80" rx="12" stroke="currentColor" strokeWidth="4" />
        <path d="M186 65h14v30h-14" fill="currentColor" />
        <path d="M128 52l-29 35h23l-9 24 31-35h-23l7-24Z" fill="currentColor" />
      </>}
    </svg>
  </div>;
}
