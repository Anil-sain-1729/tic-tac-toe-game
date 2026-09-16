const cells = [...document.querySelectorAll(".cell")];
const boardEl = document.getElementById("board");
const winLine = document.getElementById("winLine");
const statusEl = document.getElementById("status");
const humanModeBtn = document.getElementById("humanMode");
const robotModeBtn = document.getElementById("robotMode");
const symbolSelect = document.getElementById("symbol");
const difficultySelect = document.getElementById("difficulty");
const difficultyWrap = document.getElementById("difficultyWrap");
const opponentTitle = document.getElementById("opponentTitle");
const humanScoreEl = document.getElementById("humanScore");
const robotScoreEl = document.getElementById("robotScore");

const wins = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

let board = Array(9).fill("");
let current = "X";
let gameOver = false;
let mode = "robot";
let human = "X";
let robot = "O";
let history = [];
let scores = { human: 0, robot: 0 };

function setStatus(text, type = "normal") {
  statusEl.textContent = text;
  statusEl.style.background = type === "win" ? "#d7f5df" : type === "lose" ? "#ffe0e5" : "#d7f5df";
  statusEl.style.color = type === "lose" ? "#d51e3b" : "#0b8a35";
}

function render() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
    cell.className = "cell";
    if (board[i]) cell.classList.add(board[i].toLowerCase());
  });
}

function result(b = board) {
  for (let i = 0; i < wins.length; i++) {
    const [a,b1,c] = wins[i];
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
      return { winner: b[a], line: i };
    }
  }
  return b.every(Boolean) ? { winner: "draw", line: -1 } : null;
}

function drawWinningLine(lineIndex) {
  if (lineIndex < 0) return;
  const [a, b, c] = wins[lineIndex];
  const first = cells[a].getBoundingClientRect();
  const last = cells[c].getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();

  const x1 = first.left + first.width / 2 - boardRect.left;
  const y1 = first.top + first.height / 2 - boardRect.top;
  const x2 = last.left + last.width / 2 - boardRect.left;
  const y2 = last.top + last.height / 2 - boardRect.top;

  const length = Math.hypot(x2-x1, y2-y1);
  const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;

  winLine.style.width = `${length}px`;
  winLine.style.left = `${x1}px`;
  winLine.style.top = `${y1 - 4}px`;
  winLine.style.transform = `rotate(${angle}deg)`;
  winLine.classList.add("show");
}

function hideLine() {
  winLine.classList.remove("show");
}

function makeMove(index, player) {
  if (board[index] || gameOver) return false;
  history.push([...board]);
  board[index] = player;
  render();
  return true;
}

function finish() {
  const r = result();
  if (!r) {
    current = current === "X" ? "O" : "X";
    updateTurn();
    return;
  }

  gameOver = true;

  if (r.winner === "draw") {
    setStatus("Game Draw!");
    return;
  }

  drawWinningLine(r.line);

  if (mode === "human") {
    if (r.winner === human) {
      scores.human++;
      setStatus(`Player ${r.winner} Wins!`, "win");
    } else {
      scores.robot++;
      setStatus(`Player ${r.winner} Wins!`, "lose");
    }
  } else {
    if (r.winner === human) {
      scores.human++;
      setStatus("You Win!", "win");
    } else {
      scores.robot++;
      setStatus("Robot Wins!", "lose");
    }
  }

  updateScores();
}

function updateTurn() {
  if (mode === "robot") {
    setStatus(current === human ? "Your Turn" : "Robot's Turn");
  } else {
    setStatus(`Player ${current}'s Turn`);
  }
}

function updateScores() {
  humanScoreEl.textContent = scores.human;
  robotScoreEl.textContent = scores.robot;
}

function newGame() {
  board = Array(9).fill("");
  history = [];
  gameOver = false;
  hideLine();
  render();

  current = "X";
  if (mode === "robot" && human === "O") {
    current = "X";
    updateTurn();
    setTimeout(robotMove, 350);
  } else {
    updateTurn();
  }
}

function available(b) {
  return b.map((v,i) => v ? null : i).filter(v => v !== null);
}

function randomMove() {
  const a = available(board);
  return a[Math.floor(Math.random() * a.length)];
}

function findWinningMove(player) {
  for (const i of available(board)) {
    const copy = [...board];
    copy[i] = player;
    if (result(copy)?.winner === player) return i;
  }
  return null;
}

function minimax(b, maximizing) {
  const r = result(b);
  if (r?.winner === robot) return 10;
  if (r?.winner === human) return -10;
  if (r?.winner === "draw") return 0;

  const moves = available(b);
  if (maximizing) {
    let best = -Infinity;
    for (const i of moves) {
      b[i] = robot;
      best = Math.max(best, minimax(b, false));
      b[i] = "";
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of moves) {
      b[i] = human;
      best = Math.min(best, minimax(b, true));
      b[i] = "";
    }
    return best;
  }
}

function bestMove() {
  let bestScore = -Infinity;
  let move = available(board)[0];

  for (const i of available(board)) {
    board[i] = robot;
    const score = minimax(board, false);
    board[i] = "";
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }
  return move;
}

function robotMove() {
  if (mode !== "robot" || gameOver || current !== robot) return;

  const level = difficultySelect.value;
  let move;

  if (level === "easy") {
    move = randomMove();
  } else if (level === "medium") {
    move = findWinningMove(robot);
    if (move === null) move = findWinningMove(human);
    if (move === null) move = Math.random() < 0.5 ? randomMove() : bestMove();
  } else {
    move = bestMove();
  }

  if (move !== undefined) {
    makeMove(move, robot);
    finish();
  }
}

cells.forEach(cell => {
  cell.addEventListener("click", () => {
    const index = Number(cell.dataset.index);
    if (gameOver) return;

    if (mode === "robot" && current !== human) return;
    if (!makeMove(index, current)) return;

    finish();

    if (mode === "robot" && !gameOver && current === robot) {
      setTimeout(robotMove, 350);
    }
  });
});

humanModeBtn.addEventListener("click", () => {
  mode = "human";
  humanModeBtn.classList.add("active");
  robotModeBtn.classList.remove("active");
  difficultyWrap.style.visibility = "hidden";
  opponentTitle.textContent = "Player 2";
  human = "X";
  robot = "O";
  newGame();
});

robotModeBtn.addEventListener("click", () => {
  mode = "robot";
  robotModeBtn.classList.add("active");
  humanModeBtn.classList.remove("active");
  difficultyWrap.style.visibility = "visible";
  opponentTitle.textContent = "Robot";
  human = symbolSelect.value;
  robot = human === "X" ? "O" : "X";
  newGame();
});

symbolSelect.addEventListener("change", () => {
  human = symbolSelect.value;
  robot = human === "X" ? "O" : "X";
  newGame();
});

document.getElementById("newGame").addEventListener("click", newGame);

document.getElementById("undo").addEventListener("click", () => {
  if (!history.length || gameOver) return;

  if (mode === "robot") {
    // Undo both the player's and robot's latest moves when possible.
    board = history.pop();
    if (history.length && current === robot) {
      board = history.pop();
    }
  } else {
    board = history.pop();
  }

  gameOver = false;
  hideLine();
  current = "X";
  render();
  updateTurn();
});

document.getElementById("resetScore").addEventListener("click", () => {
  scores = { human: 0, robot: 0 };
  updateScores();
  newGame();
});

window.addEventListener("resize", () => {
  const r = result();
  if (r && r.winner !== "draw" && gameOver) drawWinningLine(r.line);
});

difficultyWrap.style.visibility = "visible";
updateScores();
newGame();
