/* =========================================================
   HabitFlow Backend — Production Real-Time Calendar Server
   ========================================================= */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. DATA STORAGE (Array slots 1-31 map directly to calendar dates)
let userProfile = {
    name: "Alex Johnson",
    email: "alex.johnson@email.com"
};

let habits = [
    {
        id: 1,
        name: "Drink Water",
        description: "8 glasses a day",
        streak: 12,
        color: "blue",
        // Array size 32 so index maps perfectly to day number (1-31). Index 0 is ignored.
        monthStatus: ["", "done", "done", "done", "done", "", "", "", "", "", "", "", "", "", "", "", "", "done", "done", "done", "done", "", "", "", "", "", "", "", "", "", "", ""]
    },
    {
        id: 2,
        name: "Exercise",
        description: "30 minutes",
        streak: 7,
        color: "orange",
        monthStatus: ["", "done", "done", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "done", "done", "", "", "", "", "", "", "", "", "", "", "", ""]
    },
    {
        id: 3,
        name: "Read Book",
        description: "20 pages",
        streak: 15,
        color: "green",
        monthStatus: ["", "done", "done", "done", "", "", "", "", "", "", "", "", "", "", "", "", "", "done", "done", "done", "", "", "", "", "", "", "", "", "", "", "", ""]
    }
];

// 2. SYSTEM STATUS CHECK
app.get('/api/status', (req, res) => {
    res.json({ status: "success", message: "HabitFlow Real-Time API active." });
});

// 3. HABIT ROUTING CONTROLLERS
app.get('/api/habits', (req, res) => {
    res.json(habits);
});

app.post('/api/habits', (req, res) => {
    const { name, description, color } = req.body;
    if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required fields." });
    }

    const newHabit = {
        id: habits.length > 0 ? Math.max(...habits.map(h => h.id)) + 1 : 1,
        name: name,
        description: description,
        streak: 0,
        color: color || "blue",
        monthStatus: Array(32).fill("") // Fresh empty month tracking array
    };

    habits.push(newHabit);
    res.status(201).json(newHabit);
});

// PUT: Dashboard Check (Toggles Today's Date Number automatically)
app.put('/api/habits/:id/toggle', (req, res) => {
    const habitId = parseInt(req.params.id);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const todayDayNumber = new Date().getDate(); // Returns actual day number (e.g. 20)
    
    if (habit.monthStatus[todayDayNumber] === "done") {
        habit.monthStatus[todayDayNumber] = "";
        habit.streak = Math.max(0, habit.streak - 1);
    } else {
        habit.monthStatus[todayDayNumber] = "done";
        habit.streak += 1;
    }
    res.json(habit);
});

// PUT: Calendar Dashboard Grid Check (Toggles the EXACT date number clicked)
app.put('/api/habits/:id/toggle-day/:dayNumber', (req, res) => {
    const habitId = parseInt(req.params.id);
    const dayNumber = parseInt(req.params.dayNumber);
    const habit = habits.find(h => h.id === habitId);

    if (!habit) return res.status(404).json({ error: "Habit resource missing" });
    if (dayNumber < 1 || dayNumber > 31) return res.status(400).json({ error: "Invalid day number coordinate" });

    if (habit.monthStatus[dayNumber] === "done") {
        habit.monthStatus[dayNumber] = "";
        habit.streak = Math.max(0, habit.streak - 1);
    } else {
        habit.monthStatus[dayNumber] = "done";
        habit.streak += 1;
    }
    res.json(habit);
});

app.delete('/api/habits/:id', (req, res) => {
    const habitId = parseInt(req.params.id);
    const initialLength = habits.length;
    habits = habits.filter(h => h.id !== habitId);
    
    if (habits.length === initialLength) {
        return res.status(404).json({ error: "Habit resource not found" });
    }
    res.json({ success: true, message: "Habit successfully deleted." });
});

// 4. PROFILE CONTROLLERS
app.get('/api/profile', (req, res) => {
    res.json(userProfile);
});

app.put('/api/profile', (req, res) => {
    const { name, email } = req.body;
    if (name && name.trim()) userProfile.name = name.trim();
    if (email && email.trim()) userProfile.email = email.trim();
    res.json(userProfile);
});

// 5. STATISTICS CONTROLLER
app.get('/api/stats/summary', (req, res) => {
    if (habits.length === 0) {
        return res.json({ completionRate: 0, totalHabits: 0, totalCompletions: 0, bestStreak: 0 });
    }

    let todayDayNumber = new Date().getDate();
    let totalPossibleChecks = habits.length * todayDayNumber; // Calculate baseline relative to elapsed month days
    let actualCompletions = 0;
    let maxStreak = 0;

    habits.forEach(h => {
        // Count completions across the true month space instead of weekday index positions
        actualCompletions += h.monthStatus.filter(dayState => dayState === "done").length;
        if (h.streak > maxStreak) maxStreak = h.streak;
    });

    res.json({
        completionRate: totalPossibleChecks > 0 ? Math.round((actualCompletions / totalPossibleChecks) * 100) : 0,
        totalHabits: habits.length,
        totalCompletions: actualCompletions,
        bestStreak: maxStreak
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Real-Time Master Backend serving on http://localhost:${PORT}`);
});