(() => {
  const calendar = document.querySelector(".contributions-chart");
  if (!calendar) return;

  const username = calendar.dataset.username;
  const weeksContainer = calendar.querySelector(".contribution-weeks");
  const fallback = calendar.querySelector(".contributions-fallback");
  const apiUrl = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`;

  function showUnavailable(error) {
    console.error("Unable to load GitHub contributions:", error);
    weeksContainer.hidden = true;
    fallback.hidden = false;
  }

  function renderContributions(contributions) {
    const byDate = new Map(contributions.map((day) => [day.date, day]));
    const latest = contributions.reduce((current, day) => (
      day.date > current ? day.date : current
    ), contributions[0].date);
    const [year, month, date] = latest.split("-").map(Number);
    const latestDate = new Date(Date.UTC(year, month - 1, date));
    const lastWeekStart = new Date(latestDate);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - latestDate.getUTCDay());
    const firstWeekStart = new Date(lastWeekStart);
    firstWeekStart.setUTCDate(firstWeekStart.getUTCDate() - 21 * 7);

    for (let weekIndex = 0; weekIndex < 22; weekIndex += 1) {
      const weekStart = new Date(firstWeekStart);
      weekStart.setUTCDate(weekStart.getUTCDate() + weekIndex * 7);
      const week = document.createElement("div");
      week.className = "contribution-week";
      week.setAttribute("aria-hidden", "true");

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const dayDate = new Date(weekStart);
        dayDate.setUTCDate(dayDate.getUTCDate() + dayIndex);
        const dateKey = dayDate.toISOString().slice(0, 10);
        const contribution = byDate.get(dateKey);
        const count = contribution?.count ?? 0;
        const level = Math.max(0, Math.min(4, contribution?.level ?? 0));
        const cell = document.createElement("span");
        cell.className = "contribution-day";
        cell.dataset.level = String(level);
        cell.title = `${dateKey} · ${count} 次贡献`;
        week.appendChild(cell);
      }

      weeksContainer.appendChild(week);
    }

    weeksContainer.setAttribute("aria-label", `最近五个月的 GitHub 贡献日历，${username}`);
  }

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Contribution API returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data.contributions) || data.contributions.length === 0) {
        throw new Error("Contribution API returned no daily data");
      }
      renderContributions(data.contributions);
    })
    .catch(showUnavailable);
})();
