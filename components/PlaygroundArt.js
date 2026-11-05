// Flat low-poly illustration of the water park. Pure SVG polygons.
export default function PlaygroundArt({ className = "" }) {
  return (
    <svg
      viewBox="0 0 640 400"
      className={className}
      role="img"
      aria-label="Illustration of a low-poly water park with two slides, a pool and umbrellas beneath green hills"
    >
      <rect width="640" height="400" fill="#bfe3f2" />
      {/* sun */}
      <polygon points="520,44 552,62 552,98 520,116 488,98 488,62" fill="#b8f04a" />
      {/* far hills */}
      <polygon points="0,230 90,120 170,190 250,100 350,200 430,130 520,200 640,110 640,400 0,400" fill="#8fa98a" />
      <polygon points="250,100 285,150 250,140 222,158" fill="#e9f1e6" />
      <polygon points="640,110 600,160 626,158 640,170" fill="#e9f1e6" />
      {/* near hills */}
      <polygon points="0,290 120,210 230,270 360,215 480,275 640,220 640,400 0,400" fill="#1f5130" />
      <polygon points="120,210 160,240 120,238 90,252" fill="#2c6e44" />
      <polygon points="360,215 400,246 360,240 330,256" fill="#2c6e44" />
      {/* pines */}
      {[
        [40, 300],
        [78, 320],
        [560, 305],
        [596, 326],
      ].map(([x, y], i) => (
        <g key={i}>
          <polygon points={`${x},${y - 46} ${x + 15},${y} ${x - 15},${y}`} fill="#0b3d2e" />
          <polygon points={`${x},${y - 66} ${x + 11},${y - 30} ${x - 11},${y - 30}`} fill="#174a30" />
        </g>
      ))}
      {/* ground + pool deck */}
      <polygon points="0,340 640,330 640,400 0,400" fill="#0b3d2e" />
      <polygon points="150,336 490,330 520,380 120,386" fill="#f6f2e8" />
      {/* pool */}
      <polygon points="178,344 462,340 484,372 154,376" fill="#69c4e2" />
      <polygon points="178,344 270,342 250,372 154,376" fill="#7fd0ea" />
      <polygon points="330,342 462,340 484,372 360,372" fill="#58b3d2" />
      {/* slide tower 1 */}
      <polygon points="168,150 208,150 208,340 168,340" fill="#f6f2e8" />
      <polygon points="168,150 188,134 208,150" fill="#1f5130" />
      <polyline
        points="206,160 318,190 232,236 330,284 262,330 300,346"
        fill="none"
        stroke="#b8f04a"
        strokeWidth="18"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* slide tower 2 */}
      <polygon points="432,190 468,190 468,340 432,340" fill="#f6f2e8" />
      <polygon points="432,190 450,174 468,190" fill="#1f5130" />
      <polyline
        points="432,200 372,226 424,262 366,296 392,336"
        fill="none"
        stroke="#69c4e2"
        strokeWidth="16"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* umbrellas */}
      {[
        [96, "#b8f04a"],
        [540, "#f6f2e8"],
        [586, "#bfe3f2"],
      ].map(([x, c], i) => (
        <g key={i}>
          <rect x={x - 2} y="342" width="4" height="38" fill="#26332d" />
          <polygon points={`${x - 26},344 ${x},322 ${x + 26},344`} fill={c} />
        </g>
      ))}
      {/* ripples */}
      <polygon points="226,356 252,354 240,362" fill="#e9f8ff" />
      <polygon points="372,358 400,356 388,364" fill="#e9f8ff" />
    </svg>
  );
}
