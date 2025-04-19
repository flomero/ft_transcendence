/* tournament.ts
   ────────────────────────────────────────────────
   The single line `export {}` turns the file into an
   ES module, which is *required* for the `declare global`
   augmentation to be legal (TS2669).
*/
export {};

/*  ───── TYPES ───── */

interface Match {
  id: string;
  teamA: string;
  teamB: string;
}
type Round = Match[];
type Rounds = Round[];

/*  ───── GLOBAL AUGMENTATION ─────
    Now that the file is a module we can safely extend Window.
*/
declare global {
  interface Window {
    __ROUNDS__: Rounds;
  }
}

/*  ───── DOM REFERENCES (safe, typed) ───── */

const rounds: Rounds = window.__ROUNDS__;

const svg = document.querySelector<SVGSVGElement>("#lines")!;
const bracket = document.querySelector<HTMLElement>("#bracket")!;

/*  ───── EDGE DISCOVERY ───── */

function collectEdges(): [string, string][] {
  const edges: [string, string][] = [];

  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((match, i) => {
      const target = rounds[r + 1][Math.floor(i / 2)];
      edges.push([match.id, target.id]);
    });
  }
  return edges;
}

const edges = collectEdges();

/*  ───── DRAW / REDRAW ───── */

function drawLines(): void {
  const box = bracket.getBoundingClientRect();

  svg.setAttribute("width", `${box.width}`);
  svg.setAttribute("height", `${box.height}`);
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.innerHTML = "";

  edges.forEach(([fromId, toId]) => {
    const a = document.getElementById(fromId)!.getBoundingClientRect();
    const b = document.getElementById(toId)!.getBoundingClientRect();

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

/*  ───── BOOTSTRAP ───── */

window.addEventListener("DOMContentLoaded", drawLines);
window.addEventListener("resize", drawLines);
