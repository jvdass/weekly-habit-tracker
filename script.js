// --- 1. INITIALISATION ---
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let weeks = JSON.parse(localStorage.getItem('weeks')) || [];

const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const weeksContainer = document.getElementById('weeks-container');
const addWeekBtn = document.getElementById('add-week-btn');

// --- 2. CALCULS (DATES & STATS) ---

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function calculateStats(week) {
    let totalCells = 0;
    let checkedCells = 0;
    week.data.forEach(habit => {
        habit.checks.forEach(check => {
            totalCells++;
            if (check) checkedCells++;
        });
    });
    return totalCells === 0 ? 0 : Math.round((checkedCells / totalCells) * 100);
}

// --- 3. LOGIQUE DES HABITUDES (MODIFIER / SUPPRIMER) ---
// Supprimer une habitude uniquement pour une semaine spécifique
function deleteHabitFromWeek(weekId, habitIndex) {
    const week = weeks.find(w => w.id === weekId);
    if (week) {
        if (confirm(`Supprimer cette habitude pour cette semaine ?`)) {
            // On retire l'élément du tableau data de cette semaine précise
            week.data.splice(habitIndex, 1); 
            saveAndRender();
        }
    }
}

function editHabit(oldName) {
    const newName = prompt("Nouveau nom pour cette habitude :", oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        const index = habits.indexOf(oldName);
        habits[index] = newName;
        weeks.forEach(week => {
            const habit = week.data.find(h => h.name === oldName);
            if (habit) habit.name = newName;
        });
        saveAndRender();
    }
}

// Supprimer une semaine entière
function deleteWeek(weekId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette semaine ? Cette action est irréversible.")) {
        // On ne garde que les semaines dont l'ID est différent de celui sélectionné
        weeks = weeks.filter(w => w.id !== weekId);
        
        // On sauvegarde le nouvel état et on rafraîchit l'affichage
        saveAndRender();
    }
}

// --- 4. GESTION DES SEMAINES ---

function createNewWeek() {
    let baseDate = new Date();
    if (weeks.length > 0) {
        const lastWeekDate = new Date(weeks[weeks.length - 1].mondayDate);
        baseDate = new Date(lastWeekDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    const monday = getMonday(baseDate);
    const newWeek = {
        id: Date.now(),
        mondayDate: monday.toISOString(),
        displayDate: monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        data: habits.map(habit => ({ name: habit, checks: Array(7).fill(false) }))
    };
    weeks.push(newWeek);
    saveAndRender();
}

habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    if (name && !habits.includes(name)) {
        habits.push(name);
        weeks.forEach(week => {
            week.data.push({ name: name, checks: Array(7).fill(false) });
        });
        habitNameInput.value = '';
        saveAndRender();
    }
});

function toggleCheck(weekId, hIdx, dIdx) {
    const week = weeks.find(w => w.id === weekId);
    if (week) {
        week.data[hIdx].checks[dIdx] = !week.data[hIdx].checks[dIdx];
        saveAndRender();
    }
}

// --- 5. RENDER & STORAGE ---

function saveAndRender() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('weeks', JSON.stringify(weeks));
    render();
}

function render() {
    weeksContainer.innerHTML = '';
    [...weeks].reverse().forEach(week => {
        const score = calculateStats(week);
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card';
        
        let html = `
            <div class="week-header">
                <div class="week-info">
                    <span>Semaine du ${week.displayDate}</span>
                    <span class="stats"> [${score}% complété]</span>
                </div>
                <button class="delete-week-btn" onclick="deleteWeek(${week.id})" title="Supprimer la semaine" >
                 🗑️
                </button>   
            </div>
            <div class="grid-row days-header">
                <div class="grid-cell">Habitude</div>
                ${['L','M','M','J','V','S','D'].map(d => `<div class="grid-cell day-label">${d}</div>`).join('')}
            </div>
        `;

        week.data.forEach((habit, hIdx) => {
            html += `
                <div class="grid-row">
                    <div class="grid-cell habit-label">
                        ${habit.name}
                        <div class="edit-tools">
                            <span onclick="editHabit('${habit.name}')" title="Modifier">🖋️</span>
                            <span onclick="deleteHabitFromWeek(${week.id}, ${hIdx})" title="Supprimer">🗑️</span>
                        </div>
                    </div>
                    ${habit.checks.map((c, dIdx) => `
                        <div class="grid-cell">
                            <input type="checkbox" ${c ? 'checked' : ''} 
                                onChange="toggleCheck(${week.id}, ${hIdx}, ${dIdx})">
                        </div>
                    `).join('')}
                </div>
            `;
        });
        weekCard.innerHTML = html;
        weeksContainer.appendChild(weekCard);
    });
}

addWeekBtn.addEventListener('click', createNewWeek);
window.onload = () => { if(weeks.length === 0) createNewWeek(); else render(); };