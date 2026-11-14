const whistBoard = document.getElementById("whist-board");
const whistStatus = document.getElementById("whist-status");
const suitStyleSelect = document.getElementById("suit-style");
const nextDealButton = document.getElementById("next-deal");

const suits = [
  { name: "clubs", symbol: "♣", label: "clubs" },
  { name: "diamonds", symbol: "♦", label: "diamonds" },
  { name: "hearts", symbol: "♥", label: "hearts" },
  { name: "spades", symbol: "♠", label: "spades" },
];
const seatNames = ["North", "East", "South", "West"];
const seatElements = ["north", "east", "south", "west"];
const aiStyles = { 0: "tactical", 1: "bold", 3: "patient" };
const styleNames = { tactical: "Tactical", bold: "Bold", patient: "Patient" };
const rankLabels = {
  11: "Jack",
  12: "Queen",
  13: "King",
  14: "Ace",
};

let hands = [[], [], [], []];
let currentTrick = [];
let trump = suits[0];
let leader = 0;
let completedTricks = 0;
let tricks = { ns: 0, ew: 0 };
let gamePoints = { ns: 0, ew: 0 };
let gameWins = { ns: 0, ew: 0 };
let handComplete = false;
let resolvingTrick = false;
let aiTimer = null;
let trickTimer = null;

function shuffledDeck() {
  const deck = suits.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({
      suit: suit.name,
      symbol: suit.symbol,
      label: suit.label,
      rank: index + 2,
    })),
  );
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function cardName(card) {
  return `${rankLabels[card.rank] || card.rank} of ${card.label}`;
}

function cardRankText(card) {
  return rankLabels[card.rank] || String(card.rank);
}

function currentSeat() {
  return (leader + currentTrick.length) % 4;
}

function teamFor(seat) {
  return seat % 2 === 0 ? "ns" : "ew";
}

function compareForTrick(card, incumbent, ledSuit) {
  if (card.suit === incumbent.suit) return card.rank > incumbent.rank;
  if (card.suit === trump.name && incumbent.suit !== trump.name) return true;
  return card.suit === ledSuit && incumbent.suit !== trump.name && incumbent.suit !== ledSuit;
}

function winningPlay(plays) {
  if (plays.length === 0) return null;
  const ledSuit = plays[0].card.suit;
  let winner = plays[0];
  for (const play of plays.slice(1)) {
    if (compareForTrick(play.card, winner.card, ledSuit)) winner = play;
  }
  return winner;
}

function legalCardsFor(seat) {
  const hand = hands[seat];
  if (currentTrick.length === 0) return hand.slice();
  const ledSuit = currentTrick[0].card.suit;
  const followingSuit = hand.filter((card) => card.suit === ledSuit);
  return followingSuit.length > 0 ? followingSuit : hand.slice();
}

function lowestCard(cards) {
  return cards.reduce((best, card) => (card.rank < best.rank ? card : best));
}

function highestCard(cards) {
  return cards.reduce((best, card) => (card.rank > best.rank ? card : best));
}

function chooseAiCard(seat) {
  const legal = legalCardsFor(seat);
  const style = aiStyles[seat];
  const currentWinner = winningPlay(currentTrick);

  if (currentTrick.length === 0) {
    if (style === "bold") return highestCard(legal);
    if (style === "patient") return lowestCard(legal);

    const suitLengths = new Map(suits.map((suit) => [suit.name, 0]));
    for (const card of hands[seat]) {
      suitLengths.set(card.suit, suitLengths.get(card.suit) + 1);
    }
    const longestSuit = Math.max(...suitLengths.values());
    const longSuitCards = legal.filter((card) => suitLengths.get(card.suit) === longestSuit);
    return highestCard(longSuitCards);
  }

  const partnerIsWinning = currentWinner.seat === (seat + 2) % 4;
  if (partnerIsWinning) return lowestCard(legal);

  const ledSuit = currentTrick[0].card.suit;
  const winningCards = legal.filter((card) => compareForTrick(card, currentWinner.card, ledSuit));
  if (style === "bold") return winningCards.length > 0 ? highestCard(winningCards) : lowestCard(legal);
  if (style === "tactical") return winningCards.length > 0 ? lowestCard(winningCards) : lowestCard(legal);
  const economicalWin = winningCards.filter((card) => card.rank <= 9);
  return economicalWin.length > 0 ? lowestCard(economicalWin) : lowestCard(legal);
}

function createPlayedCard(play, winner) {
  const cardElement = document.createElement("span");
  cardElement.className = `played-card at-${seatElements[play.seat]}`;
  if (winner && winner.seat === play.seat) cardElement.classList.add("winning-card");
  cardElement.setAttribute("aria-label", `${seatNames[play.seat]} played ${cardName(play.card)}`);

  const rank = document.createElement("span");
  rank.className = `card-rank suit-${play.card.suit}`;
  rank.textContent = cardRankText(play.card);
  const symbol = document.createElement("span");
  symbol.className = `card-suit suit-${play.card.suit}`;
  symbol.textContent = play.card.symbol;
  cardElement.append(rank, symbol);
  return cardElement;
}

function createHandCard(card, playable) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hand-card";
  button.disabled = !playable;
  button.setAttribute("aria-label", `${cardName(card)}${playable ? "" : ", not playable now"}`);

  const rank = document.createElement("span");
  rank.className = `card-rank suit-${card.suit}`;
  rank.textContent = cardRankText(card);
  const symbol = document.createElement("span");
  symbol.className = `card-suit suit-${card.suit}`;
  symbol.textContent = card.symbol;
  button.append(rank, symbol);
  button.addEventListener("click", () => playCard(2, card));
  return button;
}

function renderWhist() {
  const turn = handComplete || resolvingTrick ? -1 : currentSeat();
  for (let seat = 0; seat < 4; seat += 1) {
    const seatElement = document.getElementById(`seat-${seatElements[seat]}`);
    seatElement.classList.toggle("active-seat", seat === turn);
    const countElement = document.getElementById(`${seatElements[seat]}-count`);
    if (seat === 2) {
      countElement.textContent = `${hands[seat].length} cards`;
      continue;
    }

    countElement.textContent = `${hands[seat].length} cards`;
    const backs = document.getElementById(`${seatElements[seat]}-cards`);
    backs.replaceChildren();
    for (let index = 0; index < Math.min(hands[seat].length, 5); index += 1) {
      const back = document.createElement("span");
      back.className = "card-back";
      backs.append(back);
    }
  }

  const southHand = document.getElementById("south-hand");
  southHand.replaceChildren();
  const legalIds = new Set(legalCardsFor(2).map((card) => card));
  const sortedHand = hands[2].slice().sort((first, second) => {
    const firstSuit = suits.findIndex((suit) => suit.name === first.suit);
    const secondSuit = suits.findIndex((suit) => suit.name === second.suit);
    return firstSuit - secondSuit || second.rank - first.rank;
  });
  for (const card of sortedHand) {
    const canPlay = !handComplete && !resolvingTrick && currentSeat() === 2 && legalIds.has(card);
    southHand.append(createHandCard(card, canPlay));
  }

  const trickElement = document.getElementById("current-trick");
  trickElement.replaceChildren();
  const winner = winningPlay(currentTrick);
  for (const play of currentTrick) {
    trickElement.append(createPlayedCard(play, winner));
  }

  document.getElementById("ns-points").textContent = String(gamePoints.ns);
  document.getElementById("ew-points").textContent = String(gamePoints.ew);
  document.getElementById("ns-tricks").textContent = String(tricks.ns);
  document.getElementById("ew-tricks").textContent = String(tricks.ew);
  document.getElementById("ns-wins").textContent = String(gameWins.ns);
  document.getElementById("ew-wins").textContent = String(gameWins.ew);
  document.getElementById("trump-indicator").textContent = trump.symbol;
  document.getElementById("trump-indicator").className = `suit-${trump.name}`;
  document.getElementById("trick-number").textContent = String(
    handComplete ? 13 : Math.min(completedTricks + 1, 13),
  );
  nextDealButton.hidden = !handComplete;
}

function describeTurn() {
  const seat = currentSeat();
  if (seat === 2) {
    const ledSuit = currentTrick.length > 0 ? suits.find((suit) => suit.name === currentTrick[0].card.suit) : null;
    whistStatus.textContent = ledSuit && hands[2].some((card) => card.suit === ledSuit.name)
      ? `Your turn. Follow ${ledSuit.symbol} if you can.`
      : "Your turn. Choose a card to lead.";
  } else {
    whistStatus.textContent = `${seatNames[seat]} (${styleNames[aiStyles[seat]]}) is choosing a card…`;
  }
}

function playCard(seat, card) {
  if (handComplete || resolvingTrick || currentSeat() !== seat) return;
  const legal = legalCardsFor(seat);
  if (!legal.includes(card)) {
    if (seat === 2) whistStatus.textContent = "You must follow the suit led if you have one.";
    return;
  }

  hands[seat].splice(hands[seat].indexOf(card), 1);
  currentTrick.push({ seat, card });
  renderWhist();

  if (currentTrick.length === 4) {
    resolvingTrick = true;
    const winner = winningPlay(currentTrick);
    renderWhist();
    whistStatus.textContent = `${seatNames[winner.seat]} wins the trick.`;
    trickTimer = window.setTimeout(finishTrick, 1000);
    return;
  }

  describeTurn();
  if (currentSeat() !== 2) scheduleAiTurn();
}

function scheduleAiTurn() {
  if (handComplete || resolvingTrick || currentSeat() === 2) return;
  window.clearTimeout(aiTimer);
  aiTimer = window.setTimeout(() => {
    const seat = currentSeat();
    const card = chooseAiCard(seat);
    playCard(seat, card);
  }, 550);
}

function finishTrick() {
  const winner = winningPlay(currentTrick);
  if (!winner) return;

  tricks[teamFor(winner.seat)] += 1;
  completedTricks += 1;
  leader = winner.seat;
  currentTrick = [];
  resolvingTrick = false;

  if (hands.every((hand) => hand.length === 0)) {
    finishHand();
    return;
  }

  renderWhist();
  describeTurn();
  if (currentSeat() !== 2) scheduleAiTurn();
}

function finishHand() {
  handComplete = true;
  const nsEarned = Math.max(0, tricks.ns - 6);
  const ewEarned = Math.max(0, tricks.ew - 6);
  gamePoints.ns += nsEarned;
  gamePoints.ew += ewEarned;

  let gameWinner = null;
  if (gamePoints.ns >= 7) gameWinner = "ns";
  if (gamePoints.ew >= 7) gameWinner = "ew";
  if (gameWinner) {
    gameWins[gameWinner] += 1;
    gamePoints[gameWinner] = 0;
    const winningTeam = gameWinner === "ns" ? "North and South" : "East and West";
    whistStatus.textContent = `${winningTeam} win the game! Deal the next hand for a rematch.`;
  } else {
    const details = [];
    if (nsEarned > 0) details.push(`North/South score ${nsEarned}`);
    if (ewEarned > 0) details.push(`East/West score ${ewEarned}`);
    whistStatus.textContent = details.length > 0
      ? `Hand complete. ${details.join("; ")}. Deal the next hand.`
      : "Hand complete: no tricks above six, so no points this hand. Deal the next hand.";
  }

  renderWhist();
}

function dealNextHand() {
  window.clearTimeout(aiTimer);
  window.clearTimeout(trickTimer);
  const deck = shuffledDeck();
  hands = [[], [], [], []];
  deck.forEach((card, index) => hands[index % 4].push(card));
  trump = suits[Math.floor(Math.random() * suits.length)];
  leader = Math.floor(Math.random() * 4);
  completedTricks = 0;
  tricks = { ns: 0, ew: 0 };
  currentTrick = [];
  handComplete = false;
  resolvingTrick = false;
  whistStatus.textContent = `New hand. ${trump.symbol} is trump. ${seatNames[leader]} leads.`;
  renderWhist();
  if (currentSeat() !== 2) scheduleAiTurn();
}

document.getElementById("whist-help-button").addEventListener("click", () => {
  const dialog = document.getElementById("whist-dialog");
  if (!dialog.open) dialog.showModal();
});
nextDealButton.addEventListener("click", dealNextHand);
suitStyleSelect.addEventListener("change", () => {
  whistBoard.dataset.suitStyle = suitStyleSelect.value;
});

dealNextHand();
