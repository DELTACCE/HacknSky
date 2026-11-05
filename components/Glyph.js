// Small low-poly pictograms used in cards. Pure SVG, no assets.
const C = {
  paper: "#f6f2e8",
  emerald: "#0b3d2e",
  forest: "#1f5130",
  sage: "#8fa98a",
  sky: "#bfe3f2",
  water: "#69c4e2",
  lime: "#b8f04a",
  wood: "#a9815b",
};

const P = ({ pts, fill }) => <polygon points={pts} fill={fill} />;

const GLYPHS = {
  sky: (
    <>
      <P pts="4,12 14,10 12,18" fill={C.forest} />
      <P pts="44,12 34,10 36,18" fill={C.forest} />
      <P pts="4,36 14,38 12,30" fill={C.sage} />
      <P pts="44,36 34,38 36,30" fill={C.sage} />
      <P pts="24,14 34,24 24,34 14,24" fill={C.emerald} />
      <P pts="24,20 28,24 24,28 20,24" fill={C.lime} />
    </>
  ),
  canopy: (
    <>
      <P pts="12,30 16,30 16,43 12,43" fill={C.wood} />
      <P pts="32,32 36,32 36,43 32,43" fill={C.wood} />
      <P pts="14,6 26,32 2,32" fill={C.forest} />
      <P pts="34,10 47,35 21,35" fill={C.emerald} />
      <P pts="14,6 20,19 14,17" fill={C.sage} />
    </>
  ),
  river: (
    <>
      <P pts="2,10 14,5 26,10 38,5 46,8 46,16 38,13 26,18 14,13 2,18" fill={C.water} />
      <P pts="2,22 14,17 26,22 38,17 46,20 46,28 38,25 26,30 14,25 2,30" fill={C.sky} />
      <P pts="2,34 14,29 26,34 38,29 46,32 46,40 38,37 26,42 14,37 2,42" fill={C.water} />
    </>
  ),
  summit: (
    <>
      <P pts="2,43 20,10 30,28 36,19 47,43" fill={C.emerald} />
      <P pts="20,10 26,21 20,18 14,22" fill={C.paper} />
      <P pts="36,19 36,7 45,11 36,13" fill={C.lime} />
    </>
  ),
  wave: (
    <>
      <P pts="2,16 12,10 22,16 32,10 46,16 46,24 32,18 22,24 12,18 2,24" fill={C.water} />
      <P pts="2,30 12,24 22,30 32,24 46,30 46,40 2,40" fill={C.sky} />
      <P pts="30,6 36,2 40,8 34,10" fill={C.lime} />
    </>
  ),
  slide: (
    <>
      <P pts="6,44 6,8 15,8 15,44" fill={C.sage} />
      <polyline points="15,10 40,18 18,28 41,40" fill="none" stroke={C.lime} strokeWidth="5" strokeLinejoin="round" />
      <P pts="2,44 46,44 46,47 2,47" fill={C.water} />
    </>
  ),
  lazy: (
    <>
      <polygon
        points="24,6 36,11 41,24 36,37 24,42 12,37 7,24 12,11"
        fill="none"
        stroke={C.water}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <P pts="24,18 30,24 24,30 18,24" fill={C.lime} />
    </>
  ),
  trek: (
    <>
      <P pts="2,43 22,6 46,43" fill={C.forest} />
      <P pts="22,6 28,17 22,15 17,18" fill={C.paper} />
      <P pts="19,43 29,43 26,30 23,30" fill={C.sage} />
      <P pts="22,30 26,30 25,22 23,22" fill={C.lime} />
    </>
  ),
  sunset: (
    <>
      <P pts="24,6 35,12 35,26 24,32 13,26 13,12" fill={C.lime} />
      <P pts="2,30 46,30 46,44 2,44" fill={C.emerald} />
      <P pts="2,34 14,30 26,36 38,30 46,34 46,44 2,44" fill={C.forest} />
    </>
  ),
  night: (
    <>
      <P pts="30,4 40,12 40,26 30,36 20,30 28,22 24,12" fill={C.sky} />
      <P pts="8,10 11,14 8,18 5,14" fill={C.lime} />
      <P pts="14,30 16,33 14,36 12,33" fill={C.lime} />
      <P pts="2,44 20,36 30,42 46,36 46,47 2,47" fill={C.forest} />
    </>
  ),
};

export default function Glyph({ name, size = 44, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  );
}
