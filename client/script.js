const API_URL = '/api/campaign';
let allGroups = [];
let isSocialProofRunning = false;
let countdownStarted = false;

// 1. אתחול
async function init() {
    await fetchCampaignInfo();
    await fetchGroups();
    if (data.endDate && !countdownStarted) { 
    startCountdown(data.endDate);
    countdownStarted = true; 
}
}

async function fetchCampaignInfo() {
    try {
        const res = await fetch(`${API_URL}/campaign-info`);
        const data = await res.json();
        
        if (data) {
            document.getElementById('main-title').innerText = data.name || "קמפיין גיוס";
            document.getElementById('goal-text').innerText = `יעד: ₪${data.goal.toLocaleString()}`;
            document.getElementById('raised-text').innerText = `₪${data.totalRaised.toLocaleString()} גויסו`;
            document.getElementById('multiplier').innerText = `x${data.multiplier || 1}`;
            
            // עדכון מספר התורמים שמגיע עכשיו מהשרת
            document.getElementById('donors-count').innerText = data.donorCount || 0;

            const percent = Math.min((data.totalRaised / data.goal) * 100, 100);
            document.getElementById('progress-bar').style.width = `${percent}%`;

            // הפעלת השעון אם קיים תאריך סיום
            if (data.endDate) {
                startCountdown(data.endDate);
            }
        }
    } catch (e) { console.error("Error info:", e); }
}
// 3. הצגת נבחרות
async function fetchGroups() {
    try {
        const res = await fetch(`${API_URL}/groups`);
        const groups = await res.json();
        allGroups = groups;
        
        const container = document.getElementById('groups-container');
        const select = document.getElementById('donor-group');
        if (!container || !select) return;

        container.innerHTML = '';
        select.innerHTML = '<option value="" disabled selected>בחר נבחרת...</option>';

        groups.forEach(group => {
            const percent = Math.min((group.raised / group.goal) * 100, 100);
            container.innerHTML += `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 class="font-black text-lg mb-2 text-slate-800">${group.name}</h4>
                    <div class="w-full bg-slate-100 h-2 rounded-full mb-3">
                        <div class="bg-blue-500 h-full rounded-full transition-all duration-1000" style="width: ${percent}%"></div>
                    </div>
                    <div class="flex justify-between text-xs font-bold text-slate-500">
                        <span>${Math.round(percent)}%</span>
                        <span>₪${group.raised.toLocaleString()} / ₪${group.goal.toLocaleString()}</span>
                    </div>
                </div>`;
            
            const opt = document.createElement('option');
            opt.value = group.id;
            opt.textContent = group.name;
            select.appendChild(opt);
        });
    } catch (e) { console.error("Error groups:", e); }
}

// 4. רשימת תורמים ומחיקה - כאן כפתור המחיקה נבנה!
async function showAllDonors() {
    try {
        const res = await fetch(`${API_URL}/donors`);
        const donors = await res.json();
        const container = document.getElementById('donors-table-container');
        
        document.getElementById('donors-list-modal').classList.replace('hidden', 'flex');

        let html = `
            <table class="w-full text-right">
                <thead>
                    <tr class="border-b text-slate-400 text-sm">
                        <th class="p-3">תורם</th>
                        <th class="p-3">סכום</th>
                        <th class="p-3 text-center">פעולה</th>
                    </tr>
                </thead>
                <tbody>`;

        donors.forEach(d => {
            html += `
                <tr class="border-b hover:bg-slate-50 transition-colors">
                    <td class="p-3 font-bold text-slate-700">${d.name}</td>
                    <td class="p-3 text-green-600 font-bold">₪${d.amount.toLocaleString()}</td>
                    <td class="p-3 text-center">
                        <button onclick="deleteDonationUI('${d._id}')" class="text-red-500 p-2 hover:scale-110 transition-transform">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = donors.length ? html : '<p class="p-8 text-center text-slate-400">אין תרומות</p>';
    } catch (e) { console.error(e); }
}

async function deleteDonationUI(id) {
    if (!confirm("למחוק את התרומה הזו?")) return;
    const res = await fetch(`${API_URL}/donation/${id}`, {
        method: 'DELETE',
        headers: { 'admin-key': '123456' }
    });
    if (res.ok) await forceRefresh();
}

// 5. רענון וניהול מודאלים
async function forceRefresh() {
    await fetchCampaignInfo();
    await fetchGroups();
    const modal = document.getElementById('donors-list-modal');
    if (modal && !modal.classList.contains('hidden')) await showAllDonors();
}

function openModal() { document.getElementById('donation-modal').classList.replace('hidden', 'flex'); }
function closeModal() { document.getElementById('donation-modal').classList.replace('flex', 'hidden'); }
function closeDonorsModal() { document.getElementById('donors-list-modal').classList.replace('flex', 'hidden'); }

// 6. הוספת תרומה
document.getElementById('donation-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('donor-name').value,
        amount: parseFloat(document.getElementById('donor-amount').value),
        groupId: parseInt(document.getElementById('donor-group').value)
    };
    const res = await fetch(`${API_URL}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) { 
        closeModal(); 
        await forceRefresh(); 
        document.getElementById('donation-form').reset();
    }
};

// 7. עדכון יעד וסיסמה
function promptAdminPassword() {
    const pass = prompt("סיסמת מנהל:");
    if (pass === "123456") {
        const goal = prompt("הזן יעד חדש:");
        if (goal) updateGoal(goal);
    }
}

async function updateGoal(newGoal) {
    await fetch(`${API_URL}/update-goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'admin-key': '123456' },
        body: JSON.stringify({ newGoal: parseInt(newGoal) })
    });
    await forceRefresh();
}

// 8. התראות (Social Proof)
function startSocialProof() {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/donors`);
            const donors = await res.json();
            if (donors.length > 0) {
                const d = donors[Math.floor(Math.random() * donors.length)];
                showNotification(`${d.name} תרם/ה ₪${d.amount.toLocaleString()}`);
            }
        } catch (e) {}
    }, 10000); 
}

function showNotification(text) {
    const n = document.createElement('div');
    n.className = "fixed top-10 left-10 bg-indigo-600 text-white p-5 rounded-2xl shadow-2xl z-[9999] animate-bounce border-2 border-white font-bold flex items-center";
    n.innerHTML = `<i class="fa-solid fa-heart ml-3 text-red-400"></i> ${text}`;
    document.body.appendChild(n);
    setTimeout(() => { n.remove(); }, 6000);
}
function startCountdown(endDateStr) {
    if (countdownStarted) return; // מונע כפל שעונים
    countdownStarted = true;

    function updateClock() {
        const end = new Date(endDateStr).getTime();
        const now = new Date().getTime();
        const diff = end - now;

        if (diff <= 0) {
            document.getElementById('countdown-timer').innerHTML = 
                '<div class="text-2xl font-black text-red-500 animate-pulse">הקמפיין הסתיים!</div>';
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        // עדכון כל תיבה בנפרד עם פונקציית padStart שמוסיפה 0 אם המספר קטן מ-10
        document.getElementById('timer-days').innerText = String(d).padStart(2, '0');
        document.getElementById('timer-hours').innerText = String(h).padStart(2, '0');
        document.getElementById('timer-minutes').innerText = String(m).padStart(2, '0');
        document.getElementById('timer-seconds').innerText = String(s).padStart(2, '0');
    }

    updateClock();
    setInterval(updateClock, 1000);
}
init();