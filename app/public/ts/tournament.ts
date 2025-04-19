/* tournament.ts – HARD‑CODED EDGE VERSION
   compile with:  tsc public/ts/tournament.ts --target es2020 --outDir public/js
*/
export {}; // make this file a module (needed for declare global)

/* ───── global data injected by Handlebars ───── */
type Match = { id: string; teamA: string; teamB: string };
type Round = Match[];
type Rounds = Round[];

declare global {
  interface Window {
    __ROUNDS__: Rounds;
  }
}

const svg = document.querySelector<SVGSVGElement>("#lines")!;
const bracket = document.querySelector<HTMLElement>("#bracket")!;

/* ───── HARD‑CODED EDGE LIST ─────
   ids must match the ones rendered into the HTML (r0m0 … r2m0)
*/
const edges: [string, string][] = [
  ["r0m0", "r1m0"],
  ["r0m1", "r1m0"],
  ["r0m2", "r1m1"],
  ["r0m3", "r1m1"],
  ["r1m0", "r2m0"],
  ["r1m1", "r2m0"],
];

/* ───── DRAW ROUTINE ───── */
function drawLines(): void {
  console.log("Drawing lines...");
  const box = bracket.getBoundingClientRect();

  svg.setAttribute("width", `${box.width}`);
  svg.setAttribute("height", `${box.height}`);
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.innerHTML = "";

  edges.forEach(([from, to]) => {
    const a = document.getElementById(from)!.getBoundingClientRect();
    const b = document.getElementById(to)!.getBoundingClientRect();

    const x1 = a.right - box.left;
    const y1 = a.top - box.top + a.height / 2;
    const x2 = b.left - box.left;
    const y2 = b.top - box.top + b.height / 2;
    const midX = (x1 + x2) / 2;

    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M${x1},${y1} H${midX} V${y2} H${x2}`);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#999");
    p.setAttribute("stroke-width", "2");
    svg.appendChild(p);
  });
}

/* ───── BOOTSTRAP ───── */
window.addEventListener("DOMContentLoaded", drawLines);
window.addEventListener("resize", drawLines);
