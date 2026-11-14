const sudokuBoard = document.getElementById("sudoku-board");
const sudokuStatus = document.getElementById("sudoku-status");
const sudokuCells = [];
let sudokuPuzzle = [];
let sudokuSolution = [];
let sudokuGivens = [];
let sudokuSelected = -1;
let sudokuWrong = new Set();
let sudokuWon = false;

function shuffled(values) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createSolvedSudoku() {
  const bands = shuffled([0, 1, 2]);
  const rows = bands.flatMap((band) => shuffled([0, 1, 2]).map((row) => band * 3 + row));
  const stacks = shuffled([0, 1, 2]);
  const columns = stacks.flatMap((stack) => shuffled([0, 1, 2]).map((column) => stack * 3 + column));
  const numbers = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  return rows.flatMap((row) =>
    columns.map((column) => numbers[(row * 3 + Math.floor(row / 3) + column) % 9]),
  );
}

function candidatesFor(grid, index) {
  const row = Math.floor(index / 9);
  const column = index % 9;
  const used = new Set();

  for (let offset = 0; offset < 9; offset += 1) {
    used.add(grid[row * 9 + offset]);
    used.add(grid[offset * 9 + column]);
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let boxY = 0; boxY < 3; boxY += 1) {
    for (let boxX = 0; boxX < 3; boxX += 1) {
      used.add(grid[(boxRow + boxY) * 9 + boxColumn + boxX]);
    }
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((number) => !used.has(number));
}

function countSudokuSolutions(grid, limit = 2) {
  let bestIndex = -1;
  let bestCandidates = null;

  for (let index = 0; index < 81; index += 1) {
    if (grid[index] !== 0) continue;

    const options = candidatesFor(grid, index);
    if (options.length === 0) return 0;
    if (bestCandidates === null || options.length < bestCandidates.length) {
      bestIndex = index;
      bestCandidates = options;
      if (options.length === 1) break;
    }
  }

  if (bestIndex === -1) return 1;

  let solutionCount = 0;
  for (const number of bestCandidates) {
    grid[bestIndex] = number;
    solutionCount += countSudokuSolutions(grid, limit - solutionCount);
    grid[bestIndex] = 0;
    if (solutionCount >= limit) return solutionCount;
  }
  return solutionCount;
}

function makeSudokuPuzzle() {
  sudokuSolution = createSolvedSudoku();
  sudokuPuzzle = sudokuSolution.slice();
  sudokuWrong.clear();
  sudokuWon = false;

  const removalOrder = shuffled(Array.from({ length: 81 }, (_, index) => index));
  let removed = 0;
  for (const index of removalOrder) {
    if (removed >= 40) break;
    const original = sudokuPuzzle[index];
    sudokuPuzzle[index] = 0;
    if (countSudokuSolutions(sudokuPuzzle.slice()) === 1) {
      removed += 1;
    } else {
      sudokuPuzzle[index] = original;
    }
  }

  sudokuGivens = sudokuPuzzle.map((value) => value !== 0);
  sudokuSelected = sudokuPuzzle.findIndex((value) => value === 0);
  sudokuStatus.textContent = "A new puzzle is ready. Good luck!";
  renderSudoku();
  if (sudokuSelected >= 0) sudokuCells[sudokuSelected].focus();
}

function findConflicts() {
  const conflicts = new Set();
  const groups = [];
  for (let row = 0; row < 9; row += 1) {
    groups.push(Array.from({ length: 9 }, (_, column) => row * 9 + column));
  }
  for (let column = 0; column < 9; column += 1) {
    groups.push(Array.from({ length: 9 }, (_, row) => row * 9 + column));
  }
  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) {
      groups.push(
        Array.from({ length: 9 }, (_, index) =>
          (boxRow * 3 + Math.floor(index / 3)) * 9 + boxColumn * 3 + (index % 3),
        ),
      );
    }
  }

  for (const group of groups) {
    const seen = new Map();
    for (const index of group) {
      const value = sudokuPuzzle[index];
      if (value === 0) continue;
      if (seen.has(value)) {
        conflicts.add(index);
        conflicts.add(seen.get(value));
      } else {
        seen.set(value, index);
      }
    }
  }
  return conflicts;
}

function renderSudoku() {
  const conflicts = findConflicts();
  for (let index = 0; index < 81; index += 1) {
    const cell = sudokuCells[index];
    const row = Math.floor(index / 9);
    const column = index % 9;
    const value = sudokuPuzzle[index];
    const selectedRow = Math.floor(sudokuSelected / 9);
    const selectedColumn = sudokuSelected % 9;
    const sharesBox =
      Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
      Math.floor(column / 3) === Math.floor(selectedColumn / 3);

    cell.textContent = value === 0 ? "" : String(value);
    cell.classList.toggle("given", sudokuGivens[index]);
    cell.classList.toggle("selected", index === sudokuSelected);
    cell.classList.toggle(
      "related",
      sudokuSelected >= 0 &&
        index !== sudokuSelected &&
        (row === selectedRow || column === selectedColumn || sharesBox),
    );
    cell.classList.toggle("conflict", conflicts.has(index));
    cell.classList.toggle("wrong", sudokuWrong.has(index));
    cell.setAttribute(
      "aria-label",
      `Row ${row + 1}, column ${column + 1}, ${value === 0 ? "empty" : `${value}${sudokuGivens[index] ? ", given" : ""}`}`,
    );
    cell.setAttribute("aria-selected", String(index === sudokuSelected));
  }
}

function buildSudokuBoard() {
  for (let index = 0; index < 81; index += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "sudoku-cell";
    cell.setAttribute("role", "gridcell");
    cell.dataset.index = String(index);
    cell.addEventListener("click", () => {
      sudokuSelected = index;
      renderSudoku();
    });
    sudokuBoard.append(cell);
    sudokuCells.push(cell);
  }
}

function enterSudokuNumber(number) {
  if (sudokuSelected < 0 || sudokuWon || sudokuGivens[sudokuSelected]) return;
  sudokuPuzzle[sudokuSelected] = number;
  sudokuWrong.clear();
  sudokuStatus.textContent = "";
  renderSudoku();
}

function eraseSudokuNumber() {
  if (sudokuSelected < 0 || sudokuWon || sudokuGivens[sudokuSelected] || sudokuPuzzle[sudokuSelected] === 0) return;
  sudokuPuzzle[sudokuSelected] = 0;
  sudokuWrong.clear();
  sudokuStatus.textContent = "";
  renderSudoku();
}

document.querySelectorAll("[data-sudoku-number]").forEach((button) => {
  button.addEventListener("click", () => enterSudokuNumber(Number(button.dataset.sudokuNumber)));
});
document.querySelector("[data-sudoku-erase]").addEventListener("click", eraseSudokuNumber);
document.getElementById("new-sudoku").addEventListener("click", makeSudokuPuzzle);
document.getElementById("check-sudoku").addEventListener("click", () => {
  if (sudokuPuzzle.some((value) => value === 0)) {
    sudokuStatus.textContent = "The grid is not full yet. Keep going!";
    return;
  }

  sudokuWrong = new Set();
  sudokuPuzzle.forEach((value, index) => {
    if (value !== sudokuSolution[index]) sudokuWrong.add(index);
  });

  if (sudokuWrong.size > 0) {
    sudokuStatus.textContent = `${sudokuWrong.size} cell${sudokuWrong.size === 1 ? "" : "s"} need another look.`;
  } else {
    sudokuWon = true;
    sudokuStatus.textContent = "Perfect! The whole grid is correct. A new puzzle awaits.";
  }
  renderSudoku();
});

document.addEventListener("keydown", (event) => {
  if (document.getElementById("sudoku-panel").hidden) return;
  const activeCell = document.activeElement.classList.contains("sudoku-cell") ? document.activeElement : null;
  if (activeCell === null) return;

  const currentIndex = Number(activeCell.dataset.index);
  const row = Math.floor(currentIndex / 9);
  const column = currentIndex % 9;
  const moves = {
    ArrowUp: row > 0 ? currentIndex - 9 : currentIndex,
    ArrowDown: row < 8 ? currentIndex + 9 : currentIndex,
    ArrowLeft: column > 0 ? currentIndex - 1 : currentIndex,
    ArrowRight: column < 8 ? currentIndex + 1 : currentIndex,
  };

  if (Object.prototype.hasOwnProperty.call(moves, event.key)) {
    event.preventDefault();
    sudokuSelected = moves[event.key];
    renderSudoku();
    sudokuCells[sudokuSelected].focus();
  } else if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    enterSudokuNumber(Number(event.key));
  } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    event.preventDefault();
    eraseSudokuNumber();
  }
});

buildSudokuBoard();
makeSudokuPuzzle();
