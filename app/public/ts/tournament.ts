export {}; // turn file into a module so global augmentation is legal

/* ---------- data types ---------- */
type Match = { id: string; teamA: string; teamB: string };
type Round = Match[];
type Rounds = Round[];

type Connections =
  | { auto: true; edges: never[] }
  | { auto: false; edges: [string, string][] };

declare global {
  interface Window {
    __ROUNDS__: Rounds;
    __CONNECTIONS__: Connections;
  }
}

/* ---------- DOM ---------- */
const rounds = window.__ROUNDS__;
const connections = window.__CONNECTIONS__;
const svg = document.querySelector<SVGSVGElement>("#lines")!;
const bracket = document.querySelector<HTMLElement>("#bracket")!;

/* ---------- auto‑edge builder ---------- */
function buildAutoEdges(): [string, string][] {
  console.log("Building auto edges");
  const list: [string, string][] = [];
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((match, i) => {
      const target = rounds[r + 1][Math.floor(i / 2)];
      list.push([match.id, target.id]);
    });
  }
  return list;
}

/* choose strategy */
const edges: [string, string][] = connections.auto
  ? buildAutoEdges()
  : connections.edges;

/* ---------- render ---------- */
function drawLines(): void {
  console.log("Drawing Lines");
  console.log("Edges", edges);
  console.log(connections.auto);

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

window.addEventListener("DOMContentLoaded", drawLines);
window.addEventListener("resize", drawLines);
