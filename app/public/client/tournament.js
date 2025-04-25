class TournamentBracket {
  constructor() {
    this.rounds = window.__ROUNDS__;
    this.connections = window.__CONNECTIONS__;
    this.svg = document.querySelector("#lines");
    this.bracket = document.querySelector("#bracket");
    this.edges = this.connections.auto
      ? this.buildAutoEdges()
      : this.connections.edges;
    this.drawLines = this.drawLines.bind(this);
    this.init();
  }
  buildAutoEdges() {
    console.log("Building auto edges");
    const list = [];
    for (let r = 0; r < this.rounds.length - 1; r++) {
      const currentMatches = this.rounds[r].matches;
      const nextMatches = this.rounds[r + 1].matches;
      currentMatches.forEach((match, i) => {
        const target = nextMatches[Math.floor(i / 2)];
        if (match.id && target.id) {
          list.push([match.id, target.id]);
        } else {
          console.error("Match or target ID is undefined", { match, target });
        }
      });
    }
    return list;
  }
  init() {
    this.drawLines();
    window.addEventListener("resize", this.drawLines);
    window.drawTournamentLines = this.drawLines;
  }
  destroy() {
    window.removeEventListener("resize", this.drawLines);
    delete window.drawTournamentLines;
  }
  drawLines() {
    console.log("Drawing Lines");
    console.log("Edges", this.edges);
    console.log(this.connections.auto);
    const box = this.bracket.getBoundingClientRect();
    this.svg.setAttribute("width", `${box.width}`);
    this.svg.setAttribute("height", `${box.height}`);
    this.svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    this.svg.innerHTML = "";
    this.edges.forEach((edge) => {
      const [from, to, offset = 0] = edge;
      const a = document.getElementById(from).getBoundingClientRect();
      const b = document.getElementById(to).getBoundingClientRect();
      const x1 = a.right - box.left;
      const y1 = a.top - box.top + a.height / 2;
      const x2 = b.left - box.left;
      const y2 = b.top - box.top + b.height / 2;
      const midX = (x1 + x2) / 2 + offset;
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", `M${x1},${y1} H${midX} V${y2} H${x2}`);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#999");
      p.setAttribute("stroke-width", "2");
      this.svg.appendChild(p);
    });
  }
}
export default TournamentBracket;
//# sourceMappingURL=tournament.js.map
