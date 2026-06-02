/**
 * Server-renderable SVG chart with axes, grid, and a smoothed series.
 * For Phase 1 — no uPlot dep, no client component needed. Replace later
 * with a uPlot wrapper for interactivity (zoom, crosshair).
 */
type Props = {
  data: number[];
  label: string;
  unit?: string;
  color?: string;
  height?: number;
  yFormat?: (v: number) => string;
  /** baseline value for fill area */
  baseline?: number;
};

export function BigChart({
  data,
  label,
  unit,
  color = "var(--color-bone)",
  height = 180,
  yFormat = (v) => v.toFixed(2),
  baseline,
}: Props) {
  const width = 600;
  const padL = 38;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const step = innerW / (data.length - 1);
  const points = data.map((v, i) => {
    const x = padL + i * step;
    const y = padT + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });
  const linePath = "M" + points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  const areaPath = `${linePath} L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * (yTicks - i)) / yTicks);
  const xTicks = 6;
  const xLabels = Array.from({ length: xTicks + 1 }, (_, i) => Math.round((data.length * i) / xTicks));

  const last = data[data.length - 1];
  const first = data[0];
  const delta = last - first;
  const pct = (delta / Math.abs(first || 1)) * 100;

  return (
    <div className="border border-rule bg-ink-2/40">
      <div className="flex items-center justify-between border-b border-rule px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] text-bone">{label}</span>
          {unit && <span className="font-mono text-[10px] text-bone-faint">{unit}</span>}
        </div>
        <div className="flex items-baseline gap-2 font-mono text-[11px] tabular">
          <span className="text-bone">{yFormat(last)}</span>
          <span className={delta < 0 ? "text-lime" : delta > 0 ? "text-rust" : "text-bone-faint"}>
            {delta < 0 ? "↘" : delta > 0 ? "↗" : "→"} {Math.abs(pct).toFixed(1)}%
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" preserveAspectRatio="none">
        {/* horizontal grid */}
        {yLabels.map((v, i) => {
          const y = padT + (innerH * i) / yTicks;
          return (
            <g key={`y-${i}`}>
              <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="var(--color-rule)" strokeDasharray="2 4" />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--color-bone-faint)"
                fontFamily="var(--font-mono)"
              >
                {yFormat(v)}
              </text>
            </g>
          );
        })}
        {/* vertical ticks */}
        {xLabels.map((v, i) => {
          const x = padL + (innerW * i) / xTicks;
          return (
            <g key={`x-${i}`}>
              <line x1={x} x2={x} y1={padT + innerH} y2={padT + innerH + 3} stroke="var(--color-rule-2)" />
              <text
                x={x}
                y={padT + innerH + 14}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-bone-faint)"
                fontFamily="var(--font-mono)"
              >
                {v}
              </text>
            </g>
          );
        })}
        {/* baseline */}
        {baseline !== undefined && (
          <line
            x1={padL}
            x2={padL + innerW}
            y1={padT + innerH - ((baseline - min) / range) * innerH}
            y2={padT + innerH - ((baseline - min) / range) * innerH}
            stroke="var(--color-amber)"
            strokeDasharray="1 3"
            opacity={0.7}
          />
        )}
        {/* area + line */}
        <path d={areaPath} fill={color} opacity={0.08} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
        {/* last point dot */}
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r={3}
          fill={color}
        />
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r={6}
          fill={color}
          opacity={0.2}
        />
      </svg>
    </div>
  );
}
