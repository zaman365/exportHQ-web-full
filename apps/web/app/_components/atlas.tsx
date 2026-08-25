const ROUTES = [
  "M112 402 Q 208 262 302 248",
  "M302 248 Q 418 148 528 172",
  "M528 172 Q 646 196 702 328",
  "M528 172 Q 692  96 838 196",
  "M302 248 Q 348 384 432 468",
  "M432 468 Q 546 542 646 516",
  "M646 516 Q 726 442 702 328",
  "M112 402 Q 262 512 432 468"
];

const PORTS: Array<{ x: number; y: number; r: number; hub?: boolean }> = [
  { x: 112, y: 402, r: 4 },
  { x: 302, y: 248, r: 5, hub: true },
  { x: 528, y: 172, r: 4 },
  { x: 702, y: 328, r: 5, hub: true },
  { x: 838, y: 196, r: 3.5 },
  { x: 432, y: 468, r: 4 },
  { x: 646, y: 516, r: 3.5 }
];

/** Decorative trade-route field used behind the hero and closing call to action. */
export function Atlas({ id = "atlas" }: { id?: string }) {
  return (
    <svg className="atlas" viewBox="0 0 900 620" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-route`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8f24e" stopOpacity="0.05" />
          <stop offset="45%" stopColor="#c8f24e" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#78c2d6" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`${id}-fade`} cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="900" height="620" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>

      <g mask={`url(#${id}-mask)`}>
        <g className="atlas-graticule">
          {[92, 184, 276, 368, 460, 552].map((y) => (
            <path key={`lat-${y}`} d={`M0 ${y} Q 450 ${y - 46} 900 ${y}`} />
          ))}
          {[150, 300, 450, 600, 750].map((x) => (
            <path key={`lon-${x}`} d={`M${x} 0 Q ${x + 52} 310 ${x} 620`} />
          ))}
        </g>

        <g className="atlas-routes" stroke={`url(#${id}-route)`}>
          {ROUTES.map((d, index) => (
            <path key={d} d={d} style={{ animationDelay: `${index * -1.9}s` }} />
          ))}
        </g>

        <g className="atlas-ports">
          {PORTS.map((port, index) => (
            <g key={`${port.x}-${port.y}`} className={port.hub ? "is-hub" : undefined}>
              <circle className="atlas-pulse" cx={port.x} cy={port.y} r={port.r} style={{ animationDelay: `${index * 0.65}s` }} />
              <circle className="atlas-port" cx={port.x} cy={port.y} r={port.r} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

/** Orbit diagram: three named layers of export work circling one shared record. */
export function OrbitDiagram() {
  return (
    <div className="orbit" aria-hidden="true">
      <svg viewBox="0 0 420 420" fill="none" focusable="false">
        <g className="orbit-rings">
          <circle className="orbit-ring" cx="210" cy="210" r="196" />
          <circle className="orbit-ring" cx="210" cy="210" r="148" />
          <circle className="orbit-ring" cx="210" cy="210" r="98" />
        </g>
        <g className="orbit-spoke">
          <path d="M210 152V62" />
          <path d="m210 268 78 62" />
          <path d="M210 268 132 330" />
        </g>
        <circle className="orbit-core" cx="210" cy="210" r="58" />
        <g className="orbit-globe">
          <circle cx="210" cy="210" r="30" />
          <path d="M210 180c-9.6 8.4-14.7 19.2-14.7 30s5.1 21.6 14.7 30c9.6-8.4 14.7-19.2 14.7-30s-5.1-21.6-14.7-30Z" />
          <path d="M181 210h58" />
        </g>
      </svg>
      <span className="orbit-node node-readiness">Readiness</span>
      <span className="orbit-node node-buyers">Buyers</span>
      <span className="orbit-node node-trade">Trade</span>
    </div>
  );
}
