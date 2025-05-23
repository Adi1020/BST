
---

# 👶 Baby Sleep Tracker — SV 2.1.0

A simple, installable web app to help you track your baby's sleep sessions. Start and stop timers, view sleep summaries and charts, and export logs — all stored locally in your browser.

## 🚀 Features

* 💤 **Start/Stop Sleep Timer**
  Easily record the beginning and end of each sleep session.

* 📆 **Date Search**
  Look up sessions by specific dates.

* 📊 **Summaries and Charts**

  * View today’s or all-time summaries.
  * Interactive charts: bar, pie, line, and stacked bar visualizations.

* 📋 **Copyable Summary**
  Quickly copy daily or full summaries to clipboard.

* 📤 **Export to Excel**
  Download all sleep sessions as a `.xlsx` spreadsheet.

* 🌙 **Dark Mode**
  Toggle-friendly dark theme for night use.

* 📱 **Progressive Web App (PWA)**
  Install with one tap on mobile or desktop. Works offline using service workers.

* 💾 **Local Storage**
  All data is stored in your browser — no accounts or servers.

---

## 📁 Project Structure

```
📦 root/
├── index.html             # Main sleep timer interface
├── summary.html           # Summarized logs view
├── chart.html             # Chart-based visualization
├── export.html            # Excel export functionality
├── styles.css             # App styling (light/dark mode supported)
├── script.js              # App logic and DOM interaction
├── service-worker.js      # Offline caching and PWA support
├── manifest.json          # PWA metadata
└── icon/                  # App icons and favicon
```

---

## 📲 Installation

1. Open the app in your browser (via `index.html` or deployed URL).
2. Click the **install** prompt in your address bar or settings.
3. App now runs standalone and offline!

---

## 🛠️ Technologies Used

* **HTML/CSS/JS**: Frontend structure and styling
* **Chart.js**: For interactive visual analytics
* **SheetJS**: Export to Excel functionality
* **Service Worker**: Offline capabilities
* **LocalStorage API**: Persistent session data

---

## 🧪 How It Works

* Start a session ➜ Timer runs and logs begin.
* End a session ➜ Duration, feeding info, and type are recorded.
* All data is stored locally and visualized or exported at any time.

---

## 📦 Version

**SV 2.1.0**

* Cache name: `sleep-tracker-cache-v2.1`
* Added stacked feeding chart and deletion support.
* Enhanced offline functionality and responsive design.

---

## 👤 Author

Developed by **🃏 POCO\_dev**

---


