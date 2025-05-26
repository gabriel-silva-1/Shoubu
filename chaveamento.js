const svg = document.getElementById("bracket");
const connectionMap = {}; // Maps source box ID to its connected target

function generatePlayerBracket(players) {
  function getBracketHeight(players, boxHeight = 30, gapY = 20, margin = 100) {
    const totalBoxes = players;
    return totalBoxes * boxHeight + (totalBoxes - 1) * gapY + margin;
  }

  svg.innerHTML = '';
  svg.setAttribute("height", getBracketHeight(players));
  const rounds = Math.log2(players);
  const boxWidth = 120, boxHeight = 30;
  const gapX = 160, gapY = 20;
  const centerY = svg.height.baseVal.value / 2;

  const positions = [];

  for (let r = 0; r <= rounds; r++) {
    const entries = players / (2 ** r);
    const round = [];

    const totalHeight = entries * boxHeight + (entries - 1) * gapY;
    const startY = centerY - totalHeight / 2;
    const x = r * gapX;

    for (let i = 0; i < entries; i++) {
      const y = startY + i * (boxHeight + gapY);
      const id = `r${r}p${i}`;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "player-box");
      group.setAttribute("onclick", `editPlayer("${id}")`);

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", boxWidth);
      rect.setAttribute("height", boxHeight);
      rect.setAttribute("fill", "white");
      rect.setAttribute("stroke", "black");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x + 10);
      text.setAttribute("y", y + 20);
      text.setAttribute("id", `${id}-text`);
      text.textContent = r === 0 ? `Player ${i + 1}` : '';

      group.appendChild(rect);
      group.appendChild(text);
      svg.appendChild(group);

      round.push({ x, y, id });
    }

    positions.push(round);
  }

  // Connect lines and map source to target
  for (let r = 0; r < rounds; r++) {
    const from = positions[r];
    const to = positions[r + 1];

    for (let i = 0; i < to.length; i++) {
      const source1 = from[i * 2];
      const source2 = from[i * 2 + 1];
      const target = to[i];

      // Map connections
      const sourceId1 = `r${r}p${i * 2}`;
      const sourceId2 = `r${r}p${i * 2 + 1}`;
      const targetId = `r${r + 1}p${i}`;
      connectionMap[sourceId1] = targetId;
      connectionMap[sourceId2] = targetId;

      // Vertical line
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute("x1", source1.x + boxWidth);
      vLine.setAttribute("y1", source1.y + boxHeight / 2);
      vLine.setAttribute("x2", source1.x + boxWidth);
      vLine.setAttribute("y2", source2.y + boxHeight / 2);
      vLine.setAttribute("stroke", "black");
      svg.appendChild(vLine);

      // Horizontal lines to target
      [source1, source2].forEach(src => {
        const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hLine.setAttribute("x1", src.x + boxWidth);
        hLine.setAttribute("y1", src.y + boxHeight / 2);
        hLine.setAttribute("x2", target.x);
        hLine.setAttribute("y2", target.y + boxHeight / 2);
        hLine.setAttribute("stroke", "black");
        svg.appendChild(hLine);
      });
    }
  }
}

function editPlayer(id) {
  const newText = prompt("Enter player name:");
  if (newText !== null) {
    const textElem = document.getElementById(id + '-text');
    if (textElem) textElem.textContent = newText;
  }
}

// Bracket size options: 2, 4, 8, 16, 32
generatePlayerBracket(16);

const matchControl = document.getElementById('match-control');
let currentMatch = null;
let currentMatchIndex = 0;
let matches = [];
let playedMatches = [];

function extractInitialMatches() {
  const textElements = Array.from(svg.querySelectorAll("text"))
    .filter(t => t.id.startsWith("r0p")); // only round 0

  matches = [];
  for (let i = 0; i < textElements.length; i += 2) {
    const player1 = textElements[i].textContent;
    const player2 = textElements[i + 1]?.textContent || "TBD";
    matches.push({
      player1,
      player2,
      id1: `r0p${i}`,
      id2: `r0p${i + 1}`
    });
  }
}

function setMatchSelectorState() {
  extractInitialMatches();
  matchControl.innerHTML = '';

  const label = document.createElement('label');
  label.textContent = "Select Match:";
  const select = document.createElement('select');
  select.id = "match-select";

  matches.forEach((match, idx) => {
    if (!playedMatches.includes(idx)) {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = `${match.player1} vs ${match.player2}`;
      select.appendChild(option);
    }
  });

  if (select.options.length > 0) {
    const button = document.createElement('button');
    button.textContent = "Start Match";
    button.onclick = () => {
      currentMatchIndex = parseInt(select.value, 10);
      currentMatch = matches[currentMatchIndex];
      setCurrentMatchState();
    };
    matchControl.appendChild(label);
    matchControl.appendChild(select);
    matchControl.appendChild(button);
  } else {
    matchControl.textContent = "All matches have been played.";
  }
}

function setCurrentMatchState() {
  matchControl.innerHTML = '';

  const title = document.createElement('div');
  title.textContent = `Current Match: ${currentMatch.player1} vs ${currentMatch.player2}`;

  const button = document.createElement('button');
  button.textContent = "End Match";
  button.onclick = () => {
    setWinnerSelectState();
  };

  matchControl.appendChild(title);
  matchControl.appendChild(button);
}

function setWinnerSelectState() {
  matchControl.innerHTML = '';

  const title = document.createElement('div');
  title.textContent = "Select Winner:";

  const btn1 = document.createElement('button');
  btn1.textContent = currentMatch.player1;
  btn1.onclick = () => handleWinner(currentMatch.player1);

  const btn2 = document.createElement('button');
  btn2.textContent = currentMatch.player2;
  btn2.onclick = () => handleWinner(currentMatch.player2);

  matchControl.appendChild(title);
  matchControl.appendChild(btn1);
  matchControl.appendChild(btn2);
}

function handleWinner(winner) {
  const match = matches[currentMatchIndex];
  const sourceId = winner === match.player1 ? match.id1 : match.id2;
  const targetId = connectionMap[sourceId] + "-text";

  const nextTextElem = document.getElementById(targetId);
  if (nextTextElem) {
    nextTextElem.textContent = winner;
  }

  playedMatches.push(currentMatchIndex);
  setMatchSelectorState();
}

// Start UI
setMatchSelectorState();
