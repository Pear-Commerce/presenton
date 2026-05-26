const PALETTES = [
  ["0B1F3A", "75AADB", "D4A24C", "FFFFFF"],
  ["071425", "7DD3FC", "F97316", "F8FAFC"],
  ["111827", "A7F3D0", "FDE68A", "E5E7EB"],
  ["172033", "8B5CF6", "22D3EE", "F9FAFB"],
] as const;

function hashPrompt(prompt: string): number {
  let hash = 2166136261;
  for (const char of prompt.toLowerCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateSvgFromPrompt(prompt: string): string {
  const seed = hashPrompt(prompt || "abstract system diagram");
  const lower = prompt.toLowerCase();
  const palette = pick(PALETTES, seed);
  const [bg, primary, accent, light] = palette;
  const motif = lower.includes("flow") || lower.includes("journey")
    ? "flow"
    : lower.includes("map") || lower.includes("network") || lower.includes("system")
      ? "network"
      : lower.includes("radar") || lower.includes("signal") || lower.includes("focus")
        ? "radar"
        : lower.includes("grid") || lower.includes("matrix") || lower.includes("plan")
          ? "grid"
          : pick(["flow", "network", "radar", "grid"] as const, seed, 3);

  if (motif === "network") return networkSvg(prompt, bg, primary, accent, light, seed);
  if (motif === "radar") return radarSvg(prompt, bg, primary, accent, light, seed);
  if (motif === "grid") return gridSvg(prompt, bg, primary, accent, light, seed);
  return flowSvg(prompt, bg, primary, accent, light, seed);
}

function networkSvg(
  prompt: string,
  bg: string,
  primary: string,
  accent: string,
  light: string,
  seed: number,
) {
  const points = Array.from({ length: 7 }, (_, index) => {
    const x = 110 + ((seed >> (index % 12)) % 560) + index * 18;
    const y = 70 + ((seed >> ((index + 5) % 14)) % 330);
    return { x: Math.min(730, x), y: Math.min(430, y) };
  });
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <desc>${esc(prompt)}</desc>
  <rect width="800" height="500" rx="34" fill="#${bg}"/>
  <circle cx="400" cy="250" r="210" fill="#${primary}" opacity="0.08"/>
  <g fill="none" stroke="#${primary}" stroke-width="3" stroke-opacity="0.38">
    ${points.map((point, index) => {
      const next = points[(index + 2) % points.length];
      return `<path d="M${point.x} ${point.y} C${(point.x + next.x) / 2} ${point.y - 80}, ${(point.x + next.x) / 2} ${next.y + 80}, ${next.x} ${next.y}"/>`;
    }).join("")}
  </g>
  <g>
    ${points.map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="${index === 0 ? 34 : 14 + (index % 3) * 5}" fill="#${index === 0 ? light : index % 2 ? primary : accent}" opacity="${index === 0 ? 0.96 : 0.88}"/>`).join("")}
  </g>
</svg>`;
}

function flowSvg(
  prompt: string,
  bg: string,
  primary: string,
  accent: string,
  light: string,
  seed: number,
) {
  const lift = 45 + (seed % 80);
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <desc>${esc(prompt)}</desc>
  <rect width="800" height="500" rx="34" fill="#${light}"/>
  <path d="M-60 ${320 - lift} C150 60, 258 440, 420 210 C570 -5, 650 340, 860 130" fill="none" stroke="#${primary}" stroke-width="52" stroke-linecap="round" opacity="0.9"/>
  <path d="M-40 ${370 - lift / 2} C150 170, 310 470, 460 300 C610 145, 720 380, 860 245" fill="none" stroke="#${accent}" stroke-width="18" stroke-linecap="round" opacity="0.78"/>
  <g fill="#${bg}">
    <circle cx="180" cy="${180 - lift / 3}" r="30"/>
    <circle cx="420" cy="210" r="42"/>
    <circle cx="650" cy="${260 - lift / 4}" r="30"/>
  </g>
  <g fill="#${bg}" opacity="0.1">
    <rect x="70" y="62" width="140" height="42" rx="21"/>
    <rect x="560" y="382" width="170" height="42" rx="21"/>
  </g>
</svg>`;
}

function radarSvg(
  prompt: string,
  bg: string,
  primary: string,
  accent: string,
  light: string,
  seed: number,
) {
  const angle = 20 + (seed % 90);
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <desc>${esc(prompt)}</desc>
  <rect width="800" height="500" rx="34" fill="#${bg}"/>
  <g transform="translate(400 250)">
    <circle r="190" fill="#${primary}" opacity="0.08"/>
    <g fill="none" stroke="#${primary}" stroke-opacity="0.34" stroke-width="2">
      <circle r="60"/><circle r="120"/><circle r="180"/>
      <path d="M-210 0H210M0-210V210M-150-150L150 150M150-150L-150 150"/>
    </g>
    <path d="M0 0 L175 -72 A190 190 0 0 1 ${Math.cos(angle) * 190} ${Math.sin(angle) * 190} Z" fill="#${accent}" opacity="0.34"/>
    <circle cx="-82" cy="72" r="10" fill="#${accent}"/>
    <circle cx="96" cy="-110" r="8" fill="#${light}"/>
    <circle cx="134" cy="92" r="13" fill="#${primary}"/>
  </g>
</svg>`;
}

function gridSvg(
  prompt: string,
  bg: string,
  primary: string,
  accent: string,
  light: string,
  seed: number,
) {
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <desc>${esc(prompt)}</desc>
  <rect width="800" height="500" rx="34" fill="#${bg}"/>
  <g transform="translate(82 70)">
    ${Array.from({ length: 12 }, (_, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const hot = (index + seed) % 5 === 0;
      return `<rect x="${col * 160}" y="${row * 112}" width="126" height="78" rx="16" fill="#${hot ? accent : primary}" opacity="${hot ? 0.9 : 0.28}"/>`;
    }).join("")}
    <path d="M63 39 H543 M223 39 V263 M383 39 V263" stroke="#${light}" stroke-width="3" stroke-opacity="0.24"/>
    <circle cx="${63 + (seed % 4) * 160}" cy="${39 + ((seed >> 3) % 3) * 112}" r="24" fill="#${light}"/>
  </g>
</svg>`;
}
