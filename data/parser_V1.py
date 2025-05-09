import tkinter as tk
from tkinter import filedialog
import pandas as pd
import datetime

df = pd.DataFrame()

def load_excel():
    global df
    file_path = filedialog.askopenfilename(filetypes=[("Excel files", "*.xlsx")])
    if file_path:
        try:
            df = pd.read_excel(file_path)
            df.columns = df.columns.str.strip()
            df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
            status_label.config(text=f"Loaded: {file_path.split('/')[-1]}")
            text_box.delete(1.0, tk.END)
            text_box.insert(tk.END, "✅ File loaded. Choose an action.")
        except Exception as e:
            status_label.config(text=f"❌ Load error: {e}")

def process_day_summary():
    global df
    if df.empty:
        text_box.delete(1.0, tk.END)
        text_box.insert(tk.END, "❌ No sleep log data loaded.")
        return

    today = datetime.datetime.today().strftime('%Y-%m-%d')
    group = df[df['Date'] == today]
    valid_durations = []
    output = f"🗓️ {today} - Today's Sleep Summary\n\n"

    for _, row in group.iterrows():
        try:
            td = pd.to_timedelta("0:0:" + row['Duration']) if row['Duration'].count(":") == 1 else pd.to_timedelta(row['Duration'])
            valid_durations.append(td)
            output += f"  💤 {row['StartTime']} → {row['EndTime']} ({row['Duration']})\n"
        except:
            continue

    total = sum(valid_durations, pd.Timedelta(seconds=0))
    if valid_durations:
        output += f"\n  ⏱ Total: {str(total)} ({len(valid_durations)} sessions)"
    else:
        output += "No sessions recorded for today."

    text_box.delete(1.0, tk.END)
    text_box.insert(tk.END, output)

def process_overall_summary():
    global df
    if df.empty:
        text_box.delete(1.0, tk.END)
        text_box.insert(tk.END, "❌ No data loaded.")
        return

    output = "📊 Overall Sleep Summary by Day\n\n"
    total_sessions = 0
    total_time = pd.Timedelta(seconds=0)

    for date in sorted(df['Date'].unique()):
        group = df[df['Date'] == date]
        valid_durations = []
        output += f"🗓️ {date}\n"
        for _, row in group.iterrows():
            try:
                td = pd.to_timedelta("0:0:" + row['Duration']) if row['Duration'].count(":") == 1 else pd.to_timedelta(row['Duration'])
                valid_durations.append(td)
                output += f"  💤 {row['StartTime']} → {row['EndTime']} ({row['Duration']})\n"
            except:
                continue
        day_total = sum(valid_durations, pd.Timedelta(seconds=0))
        output += f"  ⏱ Total: {str(day_total)} ({len(valid_durations)} sessions)\n\n"
        total_sessions += len(valid_durations)
        total_time += day_total

    output += f"📊 Grand Total\n🛏 Total Sessions: {total_sessions}\n⏱ Total Duration: {total_time}\n"

    text_box.delete(1.0, tk.END)
    text_box.insert(tk.END, output)

def search_by_date():
    global df
    date = search_entry.get().strip()
    if df.empty:
        text_box.delete(1.0, tk.END)
        text_box.insert(tk.END, "❌ No data loaded.")
        return

    if not date:
        text_box.insert(tk.END, "\n⚠️ Enter a date in YYYY-MM-DD format.\n")
        return

    group = df[df['Date'] == date]
    valid_durations = []
    output = f"🗓️ {date} - Search Results\n\n"

    for _, row in group.iterrows():
        try:
            td = pd.to_timedelta("0:0:" + row['Duration']) if row['Duration'].count(":") == 1 else pd.to_timedelta(row['Duration'])
            valid_durations.append(td)
            output += f"  💤 {row['StartTime']} → {row['EndTime']} ({row['Duration']})\n"
        except:
            continue

    total = sum(valid_durations, pd.Timedelta(seconds=0))
    if valid_durations:
        output += f"\n  ⏱ Total: {str(total)} ({len(valid_durations)} sessions)"
    else:
        output += "No sessions recorded for that date."

    text_box.delete(1.0, tk.END)
    text_box.insert(tk.END, output)

def export_summary():
    global df
    if df.empty:
        text_box.insert(tk.END, "\n⚠️ No data to export.\n")
        return

    output = "🗓️ Baby Sleep Log by Day\n\n"
    total_sessions = 0
    total_time = pd.Timedelta(seconds=0)

    for date in sorted(df['Date'].unique()):
        group = df[df['Date'] == date]
        valid_durations = []
        output += f"🗓️ {date}\n"
        for _, row in group.iterrows():
            try:
                td = pd.to_timedelta("0:0:" + row['Duration']) if row['Duration'].count(":") == 1 else pd.to_timedelta(row['Duration'])
                valid_durations.append(td)
                output += f"  💤 {row['StartTime']} → {row['EndTime']} ({row['Duration']})\n"
            except:
                continue
        day_total = sum(valid_durations, pd.Timedelta(seconds=0))
        output += f"  ⏱ Total: {str(day_total)} ({len(valid_durations)} sessions)\n\n"
        total_sessions += len(valid_durations)
        total_time += day_total

    output += f"📊 Grand Total\n🛏 Total Sessions: {total_sessions}\n⏱ Total Duration: {total_time}\n"

    default_name = f"baby_sleep_summary_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    file_path = filedialog.asksaveasfilename(
        defaultextension=".txt",
        initialfile=default_name,
        filetypes=[("Text files", "*.txt")],
        title="Save Summary As"
    )
    if file_path:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(output)
            status_label.config(text=f"Summary saved to: {file_path}")
        except Exception as e:
            status_label.config(text=f"❌ Save error: {e}")

def copy_to_clipboard():
    text = text_box.get("1.0", tk.END).strip()
    if text:
        root.clipboard_clear()
        root.clipboard_append(text)
        status_label.config(text="📋 Copied to clipboard")

# GUI Setup
root = tk.Tk()
root.title("Baby Sleep Tracker Parser")

frame = tk.Frame(root)
frame.pack(padx=10, pady=10)

tk.Button(frame, text="📂 Load Excel File", command=load_excel).grid(row=0, column=0, padx=5)
tk.Button(frame, text="📊 Overall Summary", command=process_overall_summary).grid(row=0, column=1, padx=5)
tk.Button(frame, text="📆 Day Summary", command=process_day_summary).grid(row=0, column=2, padx=5)
tk.Button(frame, text="💾 Export Summary", command=export_summary).grid(row=1, column=0, columnspan=2, pady=5)
tk.Button(frame, text="📋 Copy Summary", command=copy_to_clipboard).grid(row=1, column=2, padx=5)

# Search row
search_frame = tk.Frame(root)
search_frame.pack(padx=10, pady=(0, 10))

tk.Label(search_frame, text="🔍 Enter Date (YYYY-MM-DD):").pack(side=tk.LEFT)
search_entry = tk.Entry(search_frame, width=15)
search_entry.pack(side=tk.LEFT, padx=5)
tk.Button(search_frame, text="Search by Date", command=search_by_date).pack(side=tk.LEFT)

# Output box
text_box = tk.Text(root, height=25, width=100)
text_box.pack(padx=10, pady=10)

# Status bar
status_label = tk.Label(root, text="Ready", anchor='w')
status_label.pack(fill='x')

root.mainloop()
