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
