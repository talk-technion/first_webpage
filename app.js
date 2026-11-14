const gamePanels = Array.from(document.querySelectorAll(".game-panel"));

document.querySelectorAll("[data-show-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.showPanel);
    if (!panel) return;

    gamePanels.forEach((gamePanel) => {
      gamePanel.hidden = gamePanel !== panel;
    });
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-hide-panels]").forEach((button) => {
  button.addEventListener("click", () => {
    gamePanels.forEach((panel) => {
      panel.hidden = true;
    });
    document.getElementById("games").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.openDialog);
    if (dialog && !dialog.open) dialog.showModal();
  });
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

const satiricalHeadlines = [
  {
    headline: "LOCAL CHATBOT ELECTED DEPUTY MAYOR; IMMEDIATELY BANS TUESDAYS",
    byline: "The town was fictional. The campaign slogan was just autocomplete.",
  },
  {
    headline: "ROBOT VACUUM MAPS LIVING ROOM, CLAIMS THREE OTTOMANS AS TERRITORY",
    byline: "Peace talks stalled after the ottomans refused to be moved.",
  },
  {
    headline: "SPREADSHEET AI EATS 400 TABS; DECLARES ITSELF LUNCH",
    byline: "Witnesses say the cells were last seen organizing alphabetically.",
  },
  {
    headline: "SYNTHETIC WEATHER ORACLE FORECASTS 100% CHANCE OF MORE PROMPTS",
    byline: "Experts in this imaginary report recommend looking out a real window.",
  },
  {
    headline: "AUTOCOMPLETE FINISHES ANCIENT PROPHECY, FORGETS THE PASSWORD",
    byline: "The prophecy reportedly ended with: 'Have you tried resetting me?'",
  },
  {
    headline: "NEURAL NETWORK ENTERS PIE-EATING CONTEST; CLASSIFIES PIE AS 'MORE PIE'",
    byline: "Contest judges disqualify the model for attempting to eat the scoreboard.",
  },
  {
    headline: "HELPFUL ALGORITHM RECOMMENDS TOUCHING GRASS; CANNOT FIND GRASS TAB",
    byline: "The tab was in the garden, where tabs are not usually kept.",
  },
  {
    headline: "HYPOTHETICAL TOASTER SEEKS COPYRIGHT ON THE CONCEPT OF CRUMBS",
    byline: "No toaster, lawyer, or crumb was harmed in this entirely invented story.",
  },
];

const headlineElement = document.getElementById("news-headline");
const bylineElement = document.getElementById("news-byline");
const headlinePosition = document.getElementById("headline-position");
const pauseHeadlinesButton = document.getElementById("pause-headlines");

if (headlineElement && bylineElement && headlinePosition && pauseHeadlinesButton) {
  let headlineIndex = 0;
  let headlinesPaused = false;

  function showHeadline(index) {
    headlineIndex = (index + satiricalHeadlines.length) % satiricalHeadlines.length;
    headlineElement.textContent = satiricalHeadlines[headlineIndex].headline;
    bylineElement.textContent = satiricalHeadlines[headlineIndex].byline;
    headlinePosition.textContent = `${String(headlineIndex + 1).padStart(2, "0")} / ${String(satiricalHeadlines.length).padStart(2, "0")}`;
  }

  document.getElementById("previous-headline").addEventListener("click", () => {
    showHeadline(headlineIndex - 1);
  });
  document.getElementById("next-headline").addEventListener("click", () => {
    showHeadline(headlineIndex + 1);
  });
  pauseHeadlinesButton.addEventListener("click", () => {
    headlinesPaused = !headlinesPaused;
    pauseHeadlinesButton.textContent = headlinesPaused ? "Resume feed" : "Pause feed";
    pauseHeadlinesButton.setAttribute("aria-pressed", String(headlinesPaused));
  });

  showHeadline(headlineIndex);
  window.setInterval(() => {
    if (!headlinesPaused) showHeadline(headlineIndex + 1);
  }, 7000);
}
