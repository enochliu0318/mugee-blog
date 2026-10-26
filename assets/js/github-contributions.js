(() => {
  var calendar = document.querySelector(".contributions-chart");
  if (!calendar) return;

  var username = calendar.dataset.username;
  var weeksContainer = calendar.querySelector(".contribution-weeks");
  var fallback = calendar.querySelector(".contributions-fallback");
  var apiUrl = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`;

  function fetchFreshContributions() {
    var freshUrl = new URL(apiUrl);
    freshUrl.searchParams.set("_", Date.now().toString());
    return fetch(freshUrl, { cache: "reload" });
  }

  function showUnavailable(error) {
    console.error("Unable to load GitHub contributions:", error);
    weeksContainer.hidden = true;
    fallback.hidden = false;
  }

  fetch(apiUrl)
    .then((response) => response.status === 304 ? fetchFreshContributions() : response)
    .then((response) => {
      if (!response.ok) throw new Error(`Contribution API returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data.contributions) || data.contributions.length === 0) {
        throw new Error("Contribution API returned no daily data");
      }

      var contributions = data.contributions;
      var byDate = new Map(contributions.map((day) => [day.date, day]));
      var latestDateParts = contributions.reduce((current, day) => (
        day.date > current ? day.date : current
      ), contributions[0].date).split("-").map(Number);
      var latestDate = new Date(Date.UTC(latestDateParts[0], latestDateParts[1] - 1, latestDateParts[2]));
      var lastWeekStart = new Date(latestDate);
      lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - latestDate.getUTCDay());
      var firstWeekStart = new Date(lastWeekStart);
      firstWeekStart.setUTCDate(firstWeekStart.getUTCDate() - 21 * 7);

      for (var weekIndex = 0; weekIndex < 22; weekIndex += 1) {
        var weekStart = new Date(firstWeekStart);
        weekStart.setUTCDate(weekStart.getUTCDate() + weekIndex * 7);
        var week = document.createElement("div");
        week.className = "contribution-week";
        week.setAttribute("aria-hidden", "true");

        for (var dayIndex = 0; dayIndex < 7; dayIndex += 1) {
          var dayDate = new Date(weekStart);
          dayDate.setUTCDate(dayDate.getUTCDate() + dayIndex);
          var dateKey = dayDate.toISOString().slice(0, 10);
          var contribution = byDate.get(dateKey);
          var count = contribution?.count ?? 0;
          var level = Math.max(0, Math.min(4, contribution?.level ?? 0));
          var cell = document.createElement("span");
          cell.className = "contribution-day";
          cell.dataset.level = String(level);
          cell.title = `${dateKey} · ${count} 次贡献`;
          week.appendChild(cell);
        }

        weeksContainer.appendChild(week);
      }

      weeksContainer.setAttribute("aria-label", `最近五个月的 GitHub 贡献日历，${username}`);
    })
    .catch(showUnavailable);
})();
