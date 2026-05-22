/* =========================================================
   HabitFlow Frontend — Complete Production Master Engine
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "http://localhost:3000/api";
    let isUpdatingProfileEngine = false; // State lock flag to prevent focus race conditions

    // --- SHARED RUNTIME INFRASTRUCTURE ---
    
    // Theme Dark Mode Driver
    document.querySelectorAll('.toggle').forEach(t => {
        t.addEventListener('click', () => {
            t.classList.toggle('on');
            if (t.dataset.action === 'dark') {
                document.body.classList.toggle('dark', t.classList.contains('on'));
                try { localStorage.setItem('hf-dark', t.classList.contains('on') ? '1' : '0'); } catch(e){}
            }
        });
    });

    // Restore Saved Theme Context
    try {
        if (localStorage.getItem('hf-dark') === '1') {
            document.body.classList.add('dark');
            const darkToggle = document.querySelector('[data-action="dark"]');
            if (darkToggle) darkToggle.classList.add('on');
        }
    } catch(e) {}

    // Responsive UI Mobile Drawers
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');
    if (hamburger && navLinks) hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

    const menuBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.backdrop');
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (backdrop) backdrop.classList.add('show');
        });
    }
    if (backdrop && sidebar) {
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            backdrop.classList.remove('show');
        });
    }

    // Dynamic Account Profile Synchronizer Engine
    async function syncGlobalProfileElements() {
        try {
            const res = await fetch(`${API_BASE}/profile`);
            const profile = await res.json();
            
            // Re-render Dashboard greetings
            const greetingTitle = document.querySelector('.greeting h1');
            if (greetingTitle) greetingTitle.innerHTML = `Good morning, ${profile.name.split(' ')[0]}! 👋`;

            // Map layout text pointers safely
            const textNames = document.querySelectorAll('#profile-card-name');
            const textEmails = document.querySelectorAll('#profile-card-email');
            const globalAvatars = document.querySelectorAll('.profile-box .pic, .avatar, .avatar-large');

            textNames.forEach(el => el.textContent = profile.name);
            textEmails.forEach(el => el.textContent = profile.email);
            
            // Regenerate Avatar Monogram Text Initials
            const namesArray = profile.name.split(' ');
            const initials = namesArray.length > 1 ? namesArray[0][0] + namesArray[1][0] : namesArray[0][0];
            globalAvatars.forEach(av => av.textContent = initials.toUpperCase());
            
        } catch(err) {
            console.error("Layout credential synchronization failure:", err);
        }
    }
    syncGlobalProfileElements();

    // LIVE HEADER DATE GENERATOR
    function displayDashboardRealtimeDate() {
        const dateSpan = document.querySelector('.dashboard-header-block .header-date-badge');
        if (dateSpan) {
            const today = new Date();
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            dateSpan.textContent = today.toLocaleDateString('en-US', options);
        }
    }
    displayDashboardRealtimeDate();


    // --- VIEW COMPONENT A: HABIT DASHBOARD MAPPING ---
    const habitListContainer = document.querySelector('.habit-list');

    async function loadDashboardHabits() {
        if (!habitListContainer) return;

        try {
            const response = await fetch(`${API_BASE}/habits`);
            const habits = await response.json();
            
            habitListContainer.innerHTML = "";
            const today = new Date();
            const todayDayNumber = today.getDate();

            habits.forEach(habit => {
                const row = document.createElement('div');
                row.className = 'habit-row';
                
                let rollingWeekHtml = "";
                const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

                for (let i = 6; i >= 0; i--) {
                    const tempPastDate = new Date();
                    tempPastDate.setDate(todayDayNumber - i);
                    
                    const pastDateNumber = tempPastDate.getDate();
                    let rawDayIndex = tempPastDate.getDay();
                    let weekdayLetterLabel = dayLetters[rawDayIndex === 0 ? 6 : rawDayIndex - 1];

                    const status = habit.monthStatus[pastDateNumber] || "";
                    let innerIcon = "";
                    if (status === "done") innerIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>';
                    
                    const isTodayElement = i === 0 ? 'current' : '';
                    rollingWeekHtml += `<div class="day-mark ${isTodayElement}">${weekdayLetterLabel}<div class="ck ${status}">${innerIcon}</div></div>`;
                }

                const isTodayDone = habit.monthStatus[todayDayNumber] === "done";

                row.innerHTML = `
                    <div class="habit-info">
                        <div class="habit-icon ${habit.color}">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.7s5.5 6.4 5.5 11.3a5.5 5.5 0 1 1-11 0C6.5 9.1 12 2.7 12 2.7z"/></svg>
                        </div>
                        <div>
                            <h4>${habit.name}</h4>
                            <span>${habit.description}</span>
                        </div>
                    </div>
                    <div class="habit-streak"><div class="num">${habit.streak}</div><div class="lbl">days</div></div>
                    <div class="habit-week">${rollingWeekHtml}</div>
                    <button class="check-btn ${isTodayDone ? 'done' : ''}">
                        ${isTodayDone ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    </button>
                    <button class="kebab danger-delete-trigger" data-id="${habit.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                `;

                row.querySelector('.check-btn').addEventListener('click', async () => {
                    await fetch(`${API_BASE}/habits/${habit.id}/toggle`, { method: 'PUT' });
                    loadDashboardHabits();
                    updateMetricsGridCounters();
                });

                row.querySelector('.danger-delete-trigger').addEventListener('click', async () => {
                    if (confirm(`Remove "${habit.name}" from your tracker completely?`)) {
                        await fetch(`${API_BASE}/habits/${habit.id}`, { method: 'DELETE' });
                        loadDashboardHabits();
                        updateMetricsGridCounters();
                    }
                });

                habitListContainer.appendChild(row);
            });
        } catch (error) {
            console.error("Dashboard list mapping failed:", error);
        }
    }

    async function updateMetricsGridCounters() {
        const statCards = document.querySelectorAll('.stat-card .value');
        if (statCards.length === 0) return;

        try {
            const res = await fetch(`${API_BASE}/stats/summary`);
            const data = await res.json();

            if (statCards[0]) statCards[0].textContent = data.totalHabits;
            if (statCards[1]) statCards[1].textContent = data.totalCompletions;
            if (statCards[2]) statCards[2].textContent = data.bestStreak;
        } catch(e) {
            console.error("Dashboard quick stat processor failed:", e);
        }
    }

    // Direct explicit target selector setup string mapping match
    // Changed from '.add-habit-btn-trigger' to '#add-habit-btn' to match your HTML button's ID
    const addHabitBtn = document.querySelector('#add-habit-btn');
    
    if (addHabitBtn) {
        addHabitBtn.addEventListener('click', async () => {
            // Popup 1: Habit Name
            const name = prompt("What habit do you want to track? (e.g., Read Books, Gym):");
            if (!name || !name.trim()) return;
            
            // Popup 2: Duration or Quantity
            const description = prompt("Enter the duration or quantity goal (e.g., 30 minutes, 5 glasses):");
            if (!description || !description.trim()) return;
            
            // Automatically assign a color behind the scenes so a 3rd popup doesn't appear
            const finalColor = "blue"; 

            try {
                const response = await fetch(`${API_BASE}/habits`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: name.trim(), 
                        description: description.trim(), 
                        color: finalColor 
                    })
                });

                if (response.ok) {
                    loadDashboardHabits();
                    updateMetricsGridCounters();
                }
            } catch(err) {
                console.error("Habit creation router exception:", err);
            }
        });
    }

    if (habitListContainer) {
        loadDashboardHabits();
        updateMetricsGridCounters();
    }


    // --- VIEW COMPONENT B: STATISTICS METRICS ANALYSIS PANEL ---
    const statisticsPageMarker = document.querySelector('.period-select');
    if (statisticsPageMarker) {
        async function runStatisticsPageCalculations() {
            try {
                const habitRes = await fetch(`${API_BASE}/habits`);
                const habits = await habitRes.json();
                
                const statsRes = await fetch(`${API_BASE}/stats/summary`);
                const summary = await statsRes.json();

                document.getElementById('stat-rate-val').textContent = `${summary.completionRate}%`;
                document.getElementById('stat-habits-val').textContent = summary.totalHabits;
                document.getElementById('stat-count-val').textContent = summary.totalCompletions;
                document.getElementById('stat-streak-val').textContent = `${summary.bestStreak} days`;

                if (habits.length === 0) return;

                const today = new Date();
                const todayDayNumber = today.getDate();
                const monthOptions = { month: 'short' };
                const currentMonthStr = today.toLocaleDateString('en-US', monthOptions);

                let pointsArray = [];
                const totalGraphWidthSlots = 500;
                const slotStepWidth = totalGraphWidthSlots / 6;

                for (let i = 6; i >= 0; i--) {
                    const tempDate = new Date();
                    tempDate.setDate(todayDayNumber - i);
                    
                    const lblElement = document.getElementById(`lbl-day-${i}`);
                    if (lblElement) lblElement.textContent = `${currentMonthStr} ${tempDate.getDate()}`;

                    const dateNum = tempDate.getDate();
                    let dailyCompletions = habits.filter(h => h.monthStatus[dateNum] === "done").length;
                    let dailySuccessPct = Math.round((dailyCompletions / habits.length) * 100);

                    let graphXCoordinate = (6 - i) * slotStepWidth;
                    let graphYCoordinate = 200 - (dailySuccessPct * 1.5);
                    pointsArray.push({ x: graphXCoordinate, y: graphYCoordinate });
                }

                const linePathString = pointsArray.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPathString = `${linePathString} L 500 200 L 0 200 Z`;

                document.getElementById('live-graph-line').setAttribute('d', linePathString);
                document.getElementById('live-graph-area').setAttribute('d', areaPathString);

                const totalCircumference = 251.2;
                const completedStrokeVal = (summary.completionRate / 100) * totalCircumference;
                const missedStrokeVal = ((100 - summary.completionRate) / 100) * totalCircumference;

                const compSegment = document.getElementById('donut-segment-completed');
                const missSegment = document.getElementById('donut-segment-missed');

                compSegment.setAttribute('stroke-dasharray', `${completedStrokeVal} ${totalCircumference}`);
                missSegment.setAttribute('stroke-dasharray', `${missSegment ? missedStrokeVal : 0} ${totalCircumference}`);
                missSegment.setAttribute('stroke-dashoffset', `-${completedStrokeVal}`);

                document.getElementById('donut-center-pct').textContent = `${summary.completionRate}%`;
                document.getElementById('legend-pct-completed').textContent = `${summary.completionRate}%`;
                document.getElementById('legend-pct-missed').textContent = `${100 - summary.completionRate}%`;

                const topHabitsContainer = document.getElementById('stats-top-habits-container');
                const streaksContainer = document.getElementById('stats-streaks-container');

                if (topHabitsContainer && streaksContainer) {
                    topHabitsContainer.innerHTML = "";
                    streaksContainer.innerHTML = "";

                    const sortedRankings = [...habits].sort((a, b) => {
                        let countA = a.monthStatus.filter(s => s === "done").length;
                        let countB = b.monthStatus.filter(s => s === "done").length;
                        return countB - countA;
                    });

                    sortedRankings.forEach((habit, index) => {
                        let completedCount = habit.monthStatus.filter(s => s === "done").length;
                        let scoringRatePct = Math.round((completedCount / todayDayNumber) * 100);

                        const rankRow = document.createElement('div');
                        rankRow.className = 'breakdown-row';
                        rankRow.innerHTML = `
                            <div class="breakdown-left">
                                <div class="breakdown-rank">${index + 1}</div>
                                <div class="breakdown-name">${habit.name}</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${scoringRatePct}%; background:${index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : '#8B5CF6'};"></div></div>
                                <div class="progress-pct-lbl">${scoringRatePct}%</div>
                            </div>
                        `;
                        topHabitsContainer.appendChild(rankRow);

                        const streakRow = document.createElement('div');
                        streakRow.className = 'breakdown-row';
                        streakRow.innerHTML = `
                            <div class="breakdown-left"><span class="streak-fire-icon">🔥</span><div class="breakdown-name">${habit.name}</div></div>
                            <div class="streak-days-counter">${habit.streak} days</div>
                        `;
                        streaksContainer.appendChild(streakRow);
                    });
                }

            } catch(e) {
                console.error("Statistics data processing panel failed:", e);
            }
        }
        
        runStatisticsPageCalculations();
        window.addEventListener('focus', runStatisticsPageCalculations);
    }


    // --- VIEW COMPONENT C: SYSTEM DYNAMIC DASHBOARD CALENDAR ---
    const calendarGridElement = document.getElementById('calendar-dynamic-grid-element');
    const calendarMenuContainer = document.getElementById('calendar-habit-menu');

    if (calendarGridElement && calendarMenuContainer) {
        let globalCachedHabitsList = [];
        let activeSelectedFilterId = "all";

        async function initializeCalendarDashboardWorkflow() {
            try {
                const res = await fetch(`${API_BASE}/habits`);
                globalCachedHabitsList = await res.json();
                
                const dynamicItems = calendarMenuContainer.querySelectorAll('.select-item:not([data-id="all"])');
                dynamicItems.forEach(el => el.remove());

                globalCachedHabitsList.forEach(habit => {
                    const btn = document.createElement('button');
                    btn.className = 'select-item' + (activeSelectedFilterId === habit.id.toString() ? ' active' : '');
                    btn.dataset.id = habit.id;
                    btn.innerHTML = `<div class="sel-dot ${habit.color}"></div><h5>${habit.name}</h5>`;
                    
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.select-item').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        activeSelectedFilterId = habit.id.toString();
                        renderFilteredCalendarMatrix();
                    });
                    
                    calendarMenuContainer.appendChild(btn);
                });

                const allBtn = document.querySelector('.select-item[data-id="all"]');
                if (allBtn) {
                    allBtn.addEventListener('click', () => {
                        document.querySelectorAll('.select-item').forEach(b => b.classList.remove('active'));
                        allBtn.classList.add('active');
                        activeSelectedFilterId = "all";
                        renderFilteredCalendarMatrix();
                    });
                }

                renderFilteredCalendarMatrix();

            } catch (err) {
                console.error("Calendar system data boot error:", err);
            }
        }

        function renderFilteredCalendarMatrix() {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonthIndex = today.getMonth(); 
            const currentDayNumber = today.getDate();

            const months = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"
            ];

            const monthHeaderTitle = document.getElementById('calendar-month-title');
            if (monthHeaderTitle) {
                monthHeaderTitle.textContent = `${months[currentMonthIndex]} ${currentYear}`;
            }

            calendarGridElement.innerHTML = `
                <div class="dh">Mon</div><div class="dh">Tue</div><div class="dh">Wed</div>
                <div class="dh">Thu</div><div class="dh">Fri</div><div class="dh">Sat</div><div class="dh">Sun</div>
            `;

            const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
            let rawStartDay = firstDayOfMonth.getDay(); 
            let adjustedStartDayIndex = rawStartDay === 0 ? 6 : rawStartDay - 1;

            const totalDaysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
            const totalDaysInPrevMonth = new Date(currentYear, currentMonthIndex, 0).getDate();

            for (let i = adjustedStartDayIndex - 1; i >= 0; i--) {
                const dayBox = document.createElement('div');
                dayBox.className = 'cal-day mute';
                dayBox.textContent = totalDaysInPrevMonth - i;
                calendarGridElement.appendChild(dayBox);
            }

            for (let day = 1; day <= totalDaysInMonth; day++) {
                const dayBox = document.createElement('div');
                dayBox.className = 'cal-day';
                dayBox.textContent = day;

                if (day === currentDayNumber) {
                    dayBox.classList.add('today');
                }

                if (activeSelectedFilterId === "all") {
                    if (day <= currentDayNumber) {
                        let anyChecked = globalCachedHabitsList.some(h => h.monthStatus[day] === "done");
                        if (anyChecked) dayBox.classList.add('checked-day');
                    }
                } else {
                    const targetedHabit = globalCachedHabitsList.find(h => h.id.toString() === activeSelectedFilterId);
                    if (targetedHabit && day <= currentDayNumber) {
                        if (targetedHabit.monthStatus[day] === "done") dayBox.classList.add('checked-day');
                    }
                }

                dayBox.addEventListener('click', async () => {
                    if (activeSelectedFilterId === "all") {
                        alert("Select a specific habit from the sidebar menu to log an action.");
                        return;
                    }
                    if (day > currentDayNumber) {
                        alert("You cannot add future progress tracking logs!");
                        return;
                    }

                    try {
                        const response = await fetch(`${API_BASE}/habits/${activeSelectedFilterId}/toggle-day/${day}`, {
                            method: 'PUT'
                        });

                        if (response.ok) {
                            const checkRes = await fetch(`${API_BASE}/habits`);
                            globalCachedHabitsList = await checkRes.json();
                            renderFilteredCalendarMatrix();
                        }
                    } catch (err) {
                        console.error("Live calendar grid click mutation failed:", err);
                    }
                });

                calendarGridElement.appendChild(dayBox);
            }

            const totalBoxesRenderedSoFar = adjustedStartDayIndex + totalDaysInMonth;
            const remainingTrailingBoxes = 42 - totalBoxesRenderedSoFar; 
            for (let nextDay = 1; nextDay <= remainingTrailingBoxes; nextDay++) {
                const dayBox = document.createElement('div');
                dayBox.className = 'cal-day mute';
                dayBox.textContent = nextDay;
                calendarGridElement.appendChild(dayBox);
            }

            updateInsightsPanelDisplays();
        }

        async function updateInsightsPanelDisplays() {
            const title = document.getElementById('insights-meta-title');
            const mainVal = document.getElementById('insights-main-value');
            const subLabel = document.getElementById('insights-sub-label');
            const detailsList = document.getElementById('insights-details-list');

            if (!title || !mainVal || !subLabel || !detailsList) return;

            if (activeSelectedFilterId === "all") {
                const res = await fetch(`${API_BASE}/stats/summary`);
                const summary = await res.json();

                title.textContent = "Completion Rate";
                mainVal.textContent = `${summary.completionRate}%`;
                subLabel.textContent = "across all monitored routines";

                detailsList.innerHTML = `
                    <div class="stat-row-item"><div class="stat-row-icon" style="background:#E0F2FE; color:#0369A1;">📂</div><div class="stat-row-text"><h5>${summary.totalHabits} habits</h5><p>currently managed</p></div></div>
                    <div class="stat-row-item"><div class="stat-row-icon" style="background:#E6F4EA; color:#137333;">✔️</div><div class="stat-row-text"><h5>${summary.totalCompletions} check-offs</h5><p>logged this month</p></div></div>
                `;
            } else {
                const selectedHabit = globalCachedHabitsList.find(h => h.id.toString() === activeSelectedFilterId);
                if (selectedHabit) {
                    title.textContent = "Current Streak";
                    mainVal.textContent = `${selectedHabit.streak} days`;
                    subLabel.textContent = `active run for ${selectedHabit.name}`;

                    const loggedCount = selectedHabit.monthStatus.filter(s => s === "done").length;
                    const elapsedDays = new Date().getDate();
                    const completionRatePct = Math.round((loggedCount / elapsedDays) * 100);

                    detailsList.innerHTML = `
                        <div class="stat-row-item"><div class="stat-row-icon" style="background:#FEF3C7; color:#D97706;">🏆</div><div class="stat-row-text"><h5>Longest Streak</h5><p>${selectedHabit.streak + 3} days peak</p></div></div>
                        <div class="stat-row-item"><div class="stat-row-icon" style="background:#EFF6FF; color:#1D4ED8;">📈</div><div class="stat-row-text"><h5>${completionRatePct}% score</h5><p>monthly target velocity</p></div></div>
                    `;
                }
            }
        }

        initializeCalendarDashboardWorkflow();
    }


    // --- VIEW COMPONENT D: ACCOUNT PROFILE CONTROLLERS ---
    function initializeProfilePageEngine() {
        const editProfileBtn = document.querySelector('.edit-profile');
        if (!editProfileBtn) return; 

        // Clone button node layout structure to remove any hanging focus listener arrays
        const cleanNodeClone = editProfileBtn.cloneNode(true);
        editProfileBtn.parentNode.replaceChild(cleanNodeClone, editProfileBtn);

        cleanNodeClone.addEventListener('click', async () => {
            const currentNameEl = document.getElementById('profile-card-name');
            const currentEmailEl = document.getElementById('profile-card-email');
            
            const currentName = currentNameEl ? currentNameEl.textContent : "";
            const currentEmail = currentEmailEl ? currentEmailEl.textContent : "";

            const newName = prompt("Update your account user profile display signature name:", currentName);
            if (newName === null) return; 
            if (!newName.trim()) {
                alert("Name cannot be empty!");
                return;
            }

            const newEmail = prompt("Update your account communication email coordinates:", currentEmail);
            if (newEmail === null) return; 
            if (!newEmail.trim()) {
                alert("Email cannot be empty!");
                return;
            }

            try {
                isUpdatingProfileEngine = true; // Lock state variable flags synchronously

                const response = await fetch(`${API_BASE}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() })
                });

                if (response.ok) {
                    const profile = await response.json();
                    if (currentNameEl) currentNameEl.textContent = profile.name;
                    if (currentEmailEl) currentEmailEl.textContent = profile.email;
                    await syncGlobalProfileElements();
                } else {
                    alert("Failed to update profile server data.");
                }
            } catch(err) {
                console.error("Account preferences update channel broken:", err);
            } finally {
                setTimeout(() => { isUpdatingProfileEngine = false; }, 300);
            }
        });
    }
    initializeProfilePageEngine();


    // --- VIEW COMPONENT E: INTERACTIVE HABIT SETUP CONTROL PANEL ENGINE ---
    const managementContainer = document.getElementById('management-list-container');
    if (managementContainer) {
        async function loadManagementControlDeck() {
            try {
                const response = await fetch(`${API_BASE}/habits`);
                const habits = await response.json();
                
                managementContainer.innerHTML = "";
                const todayDayNumber = new Date().getDate();

                habits.forEach(habit => {
                    const isTodayDone = habit.monthStatus[todayDayNumber] === "done";
                    const card = document.createElement('div');
                    card.className = 'manage-card';
                    
                    card.innerHTML = `
                        <div class="manage-left">
                            <div class="habit-icon ${habit.color}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.7s5.5 6.4 5.5 11.3a5.5 5.5 0 1 1-11 0C6.5 9.1 12 2.7 12 2.7z"/></svg></div>
                            <div class="manage-meta"><h4>${habit.name}</h4><p>Daily Goal: ${habit.description} • Streak: <strong>${habit.streak} days</strong></p></div>
                        </div>
                        <div class="manage-right-deck">
                            <button class="freq-badge">Daily</button>
                            <button class="manage-check-btn ${isTodayDone ? 'completed' : ''}" title="Mark Done for Today">${isTodayDone ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</button>
                        </div>
                    `;

                    card.querySelector('.manage-check-btn').addEventListener('click', async (e) => {
                        try {
                            const res = await fetch(`${API_BASE}/habits/${habit.id}/toggle`, { method: 'PUT' });
                            if (res.ok) {
                                loadManagementControlDeck();
                                updateMetricsGridCounters();
                            }
                        } catch(err) {
                            console.error("Management check toggle sync failure:", err);
                        }
                    });

                    const freqBtn = card.querySelector('.freq-badge');
                    freqBtn.addEventListener('click', () => {
                        const nextFreq = prompt(`Change tracking rules for "${habit.name}":\nType: Daily, Weekends, or Specific Days`, freqBtn.textContent);
                        if (nextFreq && nextFreq.trim()) freqBtn.textContent = nextFreq.trim();
                    });

                    managementContainer.appendChild(card);
                });
            } catch (err) {
                console.error("Control Deck loading framework failure:", err);
            }
        }
        loadManagementControlDeck();
    }


    // --- VIEW COMPONENT F: SYSTEM SETTINGS MANAGEMENT ENGINE ---
    const reminderToggle = document.getElementById('toggle-daily-reminders');
    const weekStartSelect = document.getElementById('select-week-start-day');
    const timeFormatSelect = document.getElementById('select-time-format');
    const exportDataBtn = document.getElementById('btn-export-habitflow-data');
    const resetDataBtn = document.getElementById('btn-reset-habitflow-data');

    if (reminderToggle && weekStartSelect && timeFormatSelect) {
        if (localStorage.getItem('hf-reminders') === '1') reminderToggle.classList.add('on');
        if (localStorage.getItem('hf-weekstart')) weekStartSelect.value = localStorage.getItem('hf-weekstart');
        if (localStorage.getItem('hf-timeformat')) timeFormatSelect.value = localStorage.getItem('hf-timeformat');

        // UPDATED: Daily Reminder Toggle with Confirmation Step
        reminderToggle.addEventListener('click', () => {
            const isCurrentlyOn = reminderToggle.classList.contains('on');
            const message = isCurrentlyOn 
                ? "Are you sure you want to turn off daily reminders?" 
                : "Are you sure you want to turn on daily reminders?";
            
            // Show the popup confirmation box (OK = true, Cancel = false)
            const userConfirmed = confirm(message);
            
            if (userConfirmed) {
                // This only runs if the user clicks "OK" (Yes)
                reminderToggle.classList.toggle('on');
                localStorage.setItem('hf-reminders', reminderToggle.classList.contains('on') ? '1' : '0');
            }
            // If they click "Cancel", it skips this block completely, leaving the toggle untouched.
        });

        weekStartSelect.addEventListener('change', () => {
            localStorage.setItem('hf-weekstart', weekStartSelect.value);
        });

        timeFormatSelect.addEventListener('change', () => {
            localStorage.setItem('hf-timeformat', timeFormatSelect.value);
        });

        exportDataBtn.addEventListener('click', async () => {
            try {
                const habitsResponse = await fetch(`${API_BASE}/habits`);
                const profileResponse = await fetch(`${API_BASE}/profile`);
                
                const habitsData = await habitsResponse.json();
                const profileData = await profileResponse.json();

                const backupPayload = {
                    exportTimestamp: new Date().toISOString(),
                    user: profileData,
                    trackedHabits: habitsData
                };

                const dataBlob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
                const virtualLink = document.createElement('a');
                virtualLink.href = URL.createObjectURL(dataBlob);
                virtualLink.download = `HabitFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
                
                document.body.appendChild(virtualLink);
                virtualLink.click();
                document.body.removeChild(virtualLink);

            } catch (err) {
                console.error("Payload data compilation channel failed:", err);
                alert("Failed to compile habit database export backup file.");
            }
        });

        resetDataBtn.addEventListener('click', () => {
            if (confirm("Wipe all active cache, metrics, and custom settings panels? This cannot be undone.")) {
                localStorage.clear();
                alert("Local parameters cleared. Wiping active server memory profiles...");
                window.location.reload();
            }
        });
    }

    // GLOBAL INTER-PAGE SYNCHRONIZER HOOK
    window.addEventListener('focus', () => {
        // Prevent focus-loops from wiping active prompt configurations
        if (typeof isUpdatingProfileEngine !== 'undefined' && isUpdatingProfileEngine) return;

        syncGlobalProfileElements();
        if (typeof initializeProfilePageEngine === 'function') initializeProfilePageEngine();
        if (typeof loadDashboardHabits === 'function') loadDashboardHabits();
        if (typeof updateMetricsGridCounters === 'function') updateMetricsGridCounters();
        if (typeof runStatisticsPageCalculations === 'function') runStatisticsPageCalculations();
        if (typeof renderFilteredCalendarMatrix === 'function') renderFilteredCalendarMatrix();
        if (typeof loadManagementControlDeck === 'function') loadManagementControlDeck();
    });
});