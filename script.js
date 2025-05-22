let sleepLog = JSON.parse(localStorage.getItem("sleepLog")) || [];
let startTime = localStorage.getItem("startTime")
  ? new Date(localStorage.getItem("startTime"))
  : null;

// Timer interval
let timerInterval = null;
let lastDisplayedLogs = [];
let lastDisplayedTitle = "";
let isSummaryVisible = false;

// Chart.js instances
let barChartInstance, pieChartInstance, lineChartInstance, feedStackedInstance;

function saveLog() {
  localStorage.setItem("sleepLog", JSON.stringify(sleepLog));
}

function startSleep() {
  if (startTime) {
    return alert("🛑 Sleep already started at " + startTime.toLocaleTimeString());
  }
  startTime = new Date();
  localStorage.setItem("startTime", startTime.toISOString());
  alert("✅ Sleep started at " + startTime.toLocaleTimeString());
  startTimer();
}

function endSleep() {
  if (!startTime) return alert("Please start sleep first.");

  const endTime = new Date();
  const durationMs = endTime - startTime;
  const durationStr = new Date(durationMs).toISOString().substr(11, 8);
  const durationSec = durationMs / 1000;

  let sessionType = "Nap";
  if (durationSec >= 3600) sessionType = "Sleep Session";
  else if (durationSec >= 1800) sessionType = "Mid Nap";

  const fedBefore = confirm("🍼 Was the baby fed BEFORE this sleep session?");
  const feedStatus = fedBefore ? "before" : "after";

  sleepLog.push({
    date: startTime.toISOString().split("T")[0],
    // startTime: startTime.toLocaleTimeString(),
    // endTime: endTime.toLocaleTimeString(),
    startTime: startTime.toTimeString().slice(0, 5),
    endTime: endTime.toTimeString().slice(0, 5),
    duration: durationStr,
    feeding: feedStatus,
    sessionType
  });

  saveLog();
  localStorage.removeItem("startTime");
  startTime = null;
  stopTimer();
  alert("✅ Sleep session saved.");
}

function toSeconds(timeStr) {
  const [h, m, s] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600),
        m = Math.floor((seconds % 3600) / 60),
        s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function showView(view) {
  const logOutput = document.getElementById("log-output");
  const chartSection = document.getElementById("chart-section");
  const copyBtn = document.getElementById("copy-summary-btn");
  const backBtn = document.getElementById("back-button");

  if (logOutput) logOutput.classList.add("hidden");
  if (chartSection) chartSection.classList.add("hidden");
  if (copyBtn) copyBtn.classList.add("hidden");
  if (backBtn) backBtn.classList.remove("hidden");

  if (view === "log" && logOutput) logOutput.classList.remove("hidden");
  else if (view === "chart" && chartSection) chartSection.classList.remove("hidden");
}

function displayLogs(logs, title, forceShow = false) {
  const logOutput = document.getElementById("log-output");

  const sameTitle = title === lastDisplayedTitle;
  const sameLength = logs.length === lastDisplayedLogs.length;
  const sameLogs = sameLength && logs.every((l, i) =>
    JSON.stringify(l) === JSON.stringify(lastDisplayedLogs[i])
  );

  if (!forceShow && isSummaryVisible && sameTitle && sameLogs) {
    logOutput.classList.add("hidden");
    isSummaryVisible = false;
    return;
  }

  lastDisplayedLogs = logs;
  lastDisplayedTitle = title;
  isSummaryVisible = true;
  showView("log");

  const summaryText = document.getElementById("summary-text");
  const copyBtn = document.getElementById("copy-summary-btn");
  if (!summaryText) return;

  let output = `${title}\n\n`;
  if (!logs.length) {
    output += "❌ No sessions found.";
  } else {
    const total = logs.reduce((sum, l) => sum + toSeconds(l.duration), 0);
    const avgMin = Math.round(total / (logs.length * 60));
    const typeCounts = { Nap: 0, "Mid Nap": 0, "Sleep Session": 0 };
    const feedCounts = { before: 0, after: 0 };

    logs.forEach(l => {
      typeCounts[l.sessionType]++;
      feedCounts[l.feeding]++;
    });

    const avgStr = avgMin >= 60 
      ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m` 
      : `${avgMin}m`;
    output += `🛌 ${logs.length} sessions | ⏱ Total: ${formatDuration(total)} | 🧮 Avg: ${avgStr}\n`;
    output += `📊 Types: ${typeCounts.Nap} Nap, ${typeCounts["Mid Nap"]} Mid-Nap, ${typeCounts["Sleep Session"]} Sleep\n`;
    output += `🍽️ Feeding: ${feedCounts.before} before, ${feedCounts.after} after\n\n`;

    logs.forEach((l) => {
      const globalIndex = sleepLog.findIndex(s =>
        s.date === l.date &&
        s.startTime === l.startTime &&
        s.endTime === l.endTime &&
        s.duration === l.duration &&
        s.sessionType === l.sessionType &&
        s.feeding === l.feeding
      );

      const durMin = Math.round(toSeconds(l.duration) / 60),
            h = Math.floor(durMin / 60),
            m = durMin % 60,
            durStr = h ? `${h}h ${m}m` : `${m}m`;

      const sessionText = `🕒 ${l.startTime} → ${l.endTime} | ${durStr} | 💤 ${l.sessionType} | 🍽️ ${l.feeding}`;
      output += `<span class="deletable"
        title="💡Click to ${isEditMode ? 'edit' : 'delete'} this session"
        data-global-index="${globalIndex}"
        data-date="${l.date}"
      >${sessionText}</span>\n`;
    });
  }

  summaryText.innerHTML = output;

  summaryText.querySelectorAll(".deletable").forEach(el => {
    el.addEventListener("click", () => {
      const globalIndex = +el.dataset.globalIndex;
      const date = el.dataset.date;

      if (globalIndex === -1 || !sleepLog[globalIndex]) return;

      if (isEditMode) {
        openEditForm(globalIndex, sleepLog[globalIndex]);
      } else {
        const session = sleepLog[globalIndex];
        const logsOnDate = sleepLog.filter(l => l.date === date);
        const relativeIndex = logsOnDate.findIndex(l =>
          l.startTime === session.startTime &&
          l.endTime === session.endTime &&
          l.duration === session.duration
        );
        deleteSession(relativeIndex, date);
      }
    });
  });

  if (copyBtn && logs.length) copyBtn.classList.remove("hidden");
}

function showToday() {
  const today = new Date().toISOString().split("T")[0];
  displayLogs(
    sleepLog.filter(l => l.date === today),
    `🗓️ Summary for ${today}`
  );
}

function showAll(forceShow = false) {
  const logOutput = document.getElementById("log-output");

  if (!forceShow && isSummaryVisible && lastDisplayedTitle === "📊 Overall Sleep Summary by Day:") {
    logOutput.classList.add("hidden");
    isSummaryVisible = false;
    return;
  }

  showView("log");

  const summaryText = document.getElementById("summary-text");
  const copyBtn = document.getElementById("copy-summary-btn");
  if (!summaryText) return;

  summaryText.innerHTML = "";
  if (copyBtn) copyBtn.classList.add("hidden");

  const grouped = {};
  sleepLog.forEach(l => {
    grouped[l.date] = grouped[l.date] || [];
    grouped[l.date].push(l);
  });

  const dates = Object.keys(grouped).sort();
  let output = "📊 Overall Sleep Summary by Day:\n";

  lastDisplayedLogs = [...sleepLog];
  lastDisplayedTitle = "📊 Overall Sleep Summary by Day:";

  if (dates.length === 0) {
    output = "❌ No sessions found.";
  } else {
    let totalSessions = 0, totalTime = 0;

    dates.forEach(date => {
      const dayLogs = grouped[date];
      const dayTotal = dayLogs.reduce((sum, l) => sum + toSeconds(l.duration), 0);
      totalSessions += dayLogs.length;
      totalTime += dayTotal;

      output += `\n🗓️ ${date} | 🛌 ${dayLogs.length} | ⏱ ${formatDuration(dayTotal)}\n`;

      dayLogs.forEach((session) => {
        const globalIndex = sleepLog.findIndex(l =>
          l.date === session.date &&
          l.startTime === session.startTime &&
          l.endTime === session.endTime &&
          l.duration === session.duration &&
          l.sessionType === session.sessionType &&
          l.feeding === session.feeding
        );

        const mins = Math.round(toSeconds(session.duration) / 60),
              h = Math.floor(mins / 60),
              m = mins % 60,
              durStr = h ? `${h}h ${m}m` : `${m}m`;

        const sessionText = `🛏️ ${session.startTime} → ${session.endTime} | ${durStr} | 🍽️ ${session.feeding}`;
        output += `<span 
          class="deletable" 
          title="💡Click to ${isEditMode ? 'edit' : 'delete'} this session"
          data-global-index="${globalIndex}"
          data-date="${session.date}"
        >${sessionText}</span>\n`;
      });
    });

    output += `\n🗓️ ${dates.length} days | 🛌 ${totalSessions} total | ⏱ ${formatDuration(totalTime)}`;
  }

  summaryText.innerHTML = output;

  summaryText.querySelectorAll(".deletable").forEach(el => {
    el.addEventListener("click", () => {
      const globalIndex = +el.dataset.globalIndex;
      const date = el.dataset.date;

      if (globalIndex === -1 || !sleepLog[globalIndex]) return;

      if (isEditMode) {
        openEditForm(globalIndex, sleepLog[globalIndex]);
      } else {
        const session = sleepLog[globalIndex];
        const logsOnDate = sleepLog.filter(l => l.date === date);
        const relativeIndex = logsOnDate.findIndex(l =>
          l.startTime === session.startTime &&
          l.endTime === session.endTime &&
          l.duration === session.duration
        );
        deleteSession(relativeIndex, date, "all");
      }
    });
  });

  if (copyBtn && dates.length > 0) copyBtn.classList.remove("hidden");
  isSummaryVisible = true;
}

function searchByDate() {
  const input = document.getElementById("date-input");
  if (!input || !input.value) return alert("Please pick a date.");
  displayLogs(
    sleepLog.filter(l => l.date === input.value),
    `🗓️ Sessions for ${input.value}`
  );
}

function copySummary() {
  const text = document.getElementById("summary-text");
  if (!text || !text.textContent.trim()) return alert("ℹ️ Nothing to copy.");
  navigator.clipboard.writeText(text.textContent).then(() => alert("📋 Summary copied!"));
}

function exportToExcel() {
  if (!sleepLog.length) return alert("No data to export.");
  const ws = XLSX.utils.json_to_sheet(sleepLog, {
    header: ["date", "startTime", "endTime", "duration", "feeding", "sessionType"]
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SleepLog");
  XLSX.writeFile(wb, "baby-sleep-logs.xlsx");
}

// Chart view
function showChart() {
  showView("chart");

  // Destroy existing charts to prevent duplicates
  [barChartInstance, pieChartInstance, lineChartInstance, feedStackedInstance].forEach(c => c?.destroy());

  const grouped = {};
  const typeTotals = {};
  const feedByDate = {};
  const avgSessionLengths = {};

  // Normalize session type names
  const typeMap = {
    "Nap": "Nap",
    "Mid Nap": "Mid-Nap",
    "Sleep Session": "Sleep Session"
  };

  sleepLog.forEach(log => {
    const date = log.date;

    // Group sessions by date
    grouped[date] = grouped[date] || [];
    grouped[date].push(log);

    // Normalize and count session types
    const normalizedType = typeMap[log.sessionType] || "Other";
    typeTotals[normalizedType] = (typeTotals[normalizedType] || 0) + 1;

    // Track feeding counts
    feedByDate[date] = feedByDate[date] || { before: 0, after: 0 };
    feedByDate[date][log.feeding] = (feedByDate[date][log.feeding] || 0) + 1;

    // Track session durations per day
    avgSessionLengths[date] = avgSessionLengths[date] || [];
    avgSessionLengths[date].push(toSeconds(log.duration));
  });

  const dates = Object.keys(grouped).sort();
  const ctx = id => {
    const el = document.getElementById(id);
    return el ? el.getContext("2d") : null;
  };

  // Bar chart: Total sleep per day
  if (ctx("barChart")) {
    barChartInstance = new Chart(ctx("barChart"), {
      type: "bar",
      data: {
        labels: dates,
        datasets: [{
          label: "Total Sleep (min)",
          data: dates.map(d => grouped[d].reduce((s, l) => s + toSeconds(l.duration), 0) / 60)
        }]
      }
    });
  }

  // Pie chart: Sleep session type distribution
  if (ctx("typePieChart")) {
    pieChartInstance = new Chart(ctx("typePieChart"), {
      type: "pie",
      data: {
        labels: Object.keys(typeTotals),
        datasets: [{
          data: Object.values(typeTotals)
        }]
      }
    });
  }

  // Line chart: Daily average session duration and 7-day rolling average
  const avg7 = dates.map((_, i) => {
    const slice = dates.slice(Math.max(0, i - 6), i + 1);
    const sum = slice.reduce((s, d) => s + avgSessionLengths[d].reduce((a, b) => a + b, 0), 0);
    const count = slice.reduce((c, d) => c + avgSessionLengths[d].length, 0);
    return count ? Math.round(sum / count / 60) : 0;
  });

  if (ctx("lineChart")) {
    lineChartInstance = new Chart(ctx("lineChart"), {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Avg Session (min)",
            data: dates.map(d =>
              Math.round(avgSessionLengths[d].reduce((a, b) => a + b, 0) / avgSessionLengths[d].length / 60)
            )
          },
          {
            label: "7-Day Avg",
            data: avg7,
            borderDash: [5, 5]
          }
        ]
      }
    });
  }

  // Stacked feeding chart
  if (ctx("feedStackedChart")) {
    feedStackedInstance = new Chart(ctx("feedStackedChart"), {
      type: "bar",
      data: {
        labels: dates,
        datasets: ["before", "after"].map(feeding => ({
          label: `Fed ${feeding}`,
          data: dates.map(d => feedByDate[d]?.[feeding] || 0)
        }))
      },
      options: {
        scales: {
          x: { stacked: true },
          y: { stacked: true }
        }
      }
    });
  }
}

// Dark mode toggle
function toggleDarkMode() {
  const isDark = document.getElementById("darkToggle")?.checked;
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("darkMode", isDark ? "true" : "false");

  // Update theme-color meta tag
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", isDark ? "#121212" : "#add8e6");
  }
}

// Timer functions
function updateTimerDisplay() {
  const timerDisplay = document.getElementById("timer-display");
  const timerText = document.getElementById("timer-elapsed");
  if (!startTime || !timerDisplay || !timerText) return;

  const now = new Date();
  const elapsed = Math.floor((now - startTime) / 1000);
  timerText.textContent = formatDuration(elapsed);
  timerDisplay.classList.remove("hidden");
}

function startTimer() {
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const timerDisplay = document.getElementById("timer-display");
  if (timerDisplay) timerDisplay.classList.add("hidden");
}

// Route functions
function RefreshPage() {
  location.reload();
}

function goToHome () {
  window.location.href = "../index.html";
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("darkMode") === "true";
  const toggle = document.getElementById("darkToggle");

  if (toggle) toggle.checked = saved;

  // Apply .dark class to body if saved preference is dark
  document.body.classList.toggle("dark", saved);

  // Update theme color
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", saved ? "#121212" : "#add8e6");
  }

  // Hide back button by default
  const backBtn = document.getElementById("back-button");
  if (backBtn) backBtn.classList.add("hidden");

  if (document.getElementById("chart-section")) {
    showChart();
  }
  if (startTime) startTimer();
});

function deleteSession(index, date, source = "today") {
  const filtered = sleepLog.filter(l => l.date === date);
  if (!filtered[index]) return;

  if (confirm("Are you sure you want to delete this session?")) {
    const globalIndex = sleepLog.findIndex(l =>
      l.date === date &&
      l.startTime === filtered[index].startTime &&
      l.endTime === filtered[index].endTime
    );

    if (globalIndex !== -1) {
      sleepLog.splice(globalIndex, 1);
      saveLog();
      alert("🗑️ Session deleted.");

      // 🔁 Restore correct view
      if (lastDisplayedTitle === "📊 Overall Sleep Summary by Day:") {
        showAll(true);
      } else if (lastDisplayedLogs.length && lastDisplayedLogs[0].date === date) {
        displayLogs(
          sleepLog.filter(l => l.date === date),
          `🗓️ Summary for ${date}`,
          true
        );
      } else {
        displayLogs(
          sleepLog.filter(l => l.date === date),
          `🗓️ Sessions for ${date}`,
          true
        );
      }
    }
  }
}


let isEditMode = false;

function enableEditMode() {
  if (lastDisplayedLogs.length === 0) {
    alert("ℹ️ Please display a summary first (Today, All Sessions, or Search) before editing.");
    return;
  }

  isEditMode = !isEditMode;
  const btn = document.getElementById("editModeBtn");
  if (btn) {
    btn.textContent = isEditMode ? "✅ Done Editing" : "✏️ Edit Mode";
    btn.style.backgroundColor = isEditMode ? "#dcb946" : "";
  }

  // Ensure summary is displayed when toggling Edit Mode
  if (lastDisplayedTitle === "📊 Overall Sleep Summary by Day:") {
    showAll(true);
  } else {
    displayLogs(lastDisplayedLogs, lastDisplayedTitle, true);
  }
}

function addNewSession() {
  openEditForm(-1);
}

function openEditForm(index = -1, data = null) {
  document.getElementById("edit-form-modal").classList.remove("hidden");
  document.getElementById("edit-index").value = index;

  if (data) {
    document.getElementById("edit-date").value = data.date;
    document.getElementById("edit-start").value = formatForTimeInput(data.startTime);
    document.getElementById("edit-end").value = formatForTimeInput(data.endTime);
    document.getElementById("edit-feed").value = data.feeding;
    document.getElementById("edit-type").value = data.sessionType;
  } else {
    document.querySelector("#edit-form-modal form").reset();
  }
}


function closeEditForm() {
  document.getElementById("edit-form-modal").classList.add("hidden");
}

function submitEditForm(e) {
  e.preventDefault();

  const index = parseInt(document.getElementById("edit-index").value);
  const date = document.getElementById("edit-date").value;
  const start = document.getElementById("edit-start").value;
  const end = document.getElementById("edit-end").value;
  const feed = document.getElementById("edit-feed").value;
  const type = document.getElementById("edit-type").value;
  const duration = calcDuration(start, end);

  const session = {
    date,
    startTime: formatToTimeString(start),
    endTime: formatToTimeString(end),
    duration,
    feeding: feed,
    sessionType: type
  };

  if (index === -1) {
    sleepLog.push(session);
  } else {
    sleepLog[index] = session;
  }

  saveLog();
  closeEditForm();
  alert("✅ Session saved.");

  // 🔁 Reactivate the view based on current context
  if (lastDisplayedTitle === "📊 Overall Sleep Summary by Day:") {
    showAll(true); // force refresh
  } else if (lastDisplayedLogs.length && lastDisplayedLogs[0].date === date) {
    displayLogs(
      sleepLog.filter(l => l.date === date),
      `🗓️ Summary for ${date}`,
      true
    );
  } else {
    // Home page fallback: just show the new date's summary
    displayLogs(
      sleepLog.filter(l => l.date === date),
      `🗓️ Sessions for ${date}`,
      true
    );
  }
}

function to24hr(timeStr) {
  const d = new Date("1970-01-01T" + timeStr);
  return d.toTimeString().split(" ")[0].slice(0, 5);
}

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  return formatDuration(mins * 60);
}

// Update displayLogs() event listeners
function getGlobalIndex(session) {
  return sleepLog.findIndex(l =>
    l.date === session.date &&
    l.startTime === session.startTime &&
    l.endTime === session.endTime &&
    l.duration === session.duration
  );
}

function formatForTimeInput(timeStr) {
  // Converts "2:30:00 PM" or "14:30:00" → "14:30"
  const date = new Date(`1970-01-01T${timeStr}`);
  if (isNaN(date)) {
    // fallback for "2:30:00 PM"
    const parsed = new Date(`1970-01-01 ${timeStr}`);
    return parsed.toTimeString().slice(0, 5);
  }
  return date.toTimeString().slice(0, 5);
}

function formatToTimeString(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0);
  return date.toTimeString().slice(0, 5); // "HH:MM"
}