let db = JSON.parse(localStorage.getItem('app_data_desktop_v1')) || { leaders: [], preachers: [] };
let isAdmin = false;

function getAdminPassword() { return localStorage.getItem('admin_pass') || "1234"; }
function getAppLockPassword() { return localStorage.getItem('app_pass') || ""; }

function checkAppLockOnStart() {
    let appPass = getAppLockPassword();
    if (appPass !== "") {
        let userEntry = prompt("App is Locked! Enter password:");
        if (userEntry !== appPass) {
            alert("Incorrect Password!");
            document.body.innerHTML = "<div style='text-align:center; padding:50px; color:red; font-weight:bold;'>🔒 LOCKED!</div>";
        }
    }
}

function getEthiopianDayOfWeek(d, m, y) {
    if (!d || !m || !y) return { name: "---", isService: false };
    let eDay = parseInt(d), eMonth = parseInt(m), eYear = parseInt(y);
    let jdn = 1723856 + 365 * (eYear - 1) + Math.floor(eYear / 4) + 30 * (eMonth - 1) + eDay - 1;
    let dayNum = (jdn + 1) % 7; 
    const daysEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let dayName = daysEn[dayNum];
    return { name: dayName, isService: (dayName === "Wednesday" || dayName === "Sunday") };
}

function dateToJDN(day, month, year) {
    return 1723856 + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

function init() {
    checkAppLockOnStart();
    document.getElementById('d-day').value = localStorage.getItem('et_day') || "15";
    document.getElementById('d-month').value = localStorage.getItem('et_month') || "2";
    document.getElementById('d-year').value = localStorage.getItem('et_year') || "2019";
    updateDateView();
    ['d-day', 'd-month', 'd-year'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateDateView);
    });
}

function openSettingsModal() { 
    let modal = document.getElementById('settings-modal');
    if(modal) modal.classList.remove('hidden'); 
}

function closeSettingsModal() { 
    let modal = document.getElementById('settings-modal');
    if(modal) modal.classList.add('hidden'); 
}

function changeAppLockPassword() {
    let currentPass = getAppLockPassword();
    if (currentPass !== "") {
        let inputCurr = prompt("Enter Current Password:");
        if (inputCurr !== currentPass) { alert("Incorrect!"); return; }
    }
    let newPass = prompt("Enter NEW App Password (Leave blank to remove):");
    if (newPass === null) return;
    if (newPass.trim() === "") {
        localStorage.removeItem('app_pass');
        alert("App Lock removed!");
    } else {
        let confirmPass = prompt("Re-enter NEW Password:");
        if (newPass.trim() === confirmPass.trim()) {
            localStorage.setItem('app_pass', newPass.trim());
            alert("Success! ✓");
        } else { alert("Passwords do not match!"); }
    }
}

function changeAdminPassword() {
    let currentPass = prompt("Enter Current Admin Password:");
    if (currentPass !== getAdminPassword()) { alert("Incorrect!"); return; }
    let newPass = prompt("Enter NEW Admin Password:");
    if (!newPass || newPass.trim() === "") return;
    let confirmPass = prompt("Re-enter NEW Admin Password:");
    if (newPass.trim() !== confirmPass.trim()) { alert("Mismatch!"); return; }
    localStorage.setItem('admin_pass', newPass.trim());
    alert("Success! ✓");
}

function toggleAdminMode() {
    if (isAdmin) { 
        lockAdminMode(); 
    } else {
        let pass = prompt("Enter Admin Password (Default 1234):");
        if (pass === getAdminPassword()) {
            isAdmin = true;
            document.getElementById('admin-badge').classList.remove('hidden');
            document.getElementById('add-leader-btn').classList.remove('hidden');
            document.getElementById('add-preacher-btn').classList.remove('hidden');
            let btn = document.getElementById('admin-btn');
            btn.innerText = "🔓 UNLOCKED";
            btn.className = "btn-admin unlocked";
            renderTables();
            renderUpcomingCards();
        } else if (pass !== null) { 
            alert("Incorrect Password!"); 
        }
    }
}

function lockAdminMode() {
    isAdmin = false;
    document.getElementById('admin-badge').classList.add('hidden');
    document.getElementById('add-leader-btn').classList.add('hidden');
    document.getElementById('add-preacher-btn').classList.add('hidden');
    let btn = document.getElementById('admin-btn');
    btn.innerText = "🔒 ADMIN";
    btn.className = "btn-admin";
    renderTables();
    renderUpcomingCards();
}

function updateDateView() {
    const d = document.getElementById('d-day').value;
    const m = document.getElementById('d-month').value;
    const y = document.getElementById('d-year').value;
    localStorage.setItem('et_day', d);
    localStorage.setItem('et_month', m);
    localStorage.setItem('et_year', y);
    const dayInfo = getEthiopianDayOfWeek(d, m, y);
    const statusEl = document.getElementById('service-status-tag');
    document.getElementById('day-name-badge').innerText = dayInfo.name;
    if (dayInfo.isService) {
        statusEl.className = "status-box active";
        statusEl.innerText = `📌 Guyyaa Tajaajilaa (${dayInfo.name})`;
    } else {
        statusEl.className = "status-box";
        statusEl.innerText = `Guyyaa Idilee (${dayInfo.name})`;
    }
    renderTables();
    renderUpcomingCards();
}

function renderTables() {
    const d = document.getElementById('d-day').value;
    const m = document.getElementById('d-month').value;
    const y = document.getElementById('d-year').value;
    const dateKey = `${d}/${m}/${y}`;

    const lBody = document.getElementById('leader-table-body');
    document.getElementById('leader-count').innerText = db.leaders.length;
    lBody.innerHTML = "";
    let leaderOccupied = db.leaders.find(mem => mem.jobs && mem.jobs.some(j => j.date === dateKey));

    db.leaders.forEach((mem, i) => {
        const hasJob = mem.jobs && mem.jobs.some(j => j.date === dateKey);
        const isLocked = hasJob && !isAdmin;
        lBody.innerHTML += `
            <tr>
                <td style="text-align:center; color:#94a3b8; font-weight:bold;">${i + 1}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <input type="text" class="member-input" value="${mem.name || ''}" placeholder="Maqaa..." ${!isAdmin ? 'disabled' : ''} onchange="updateInfo('leaders', ${i}, 'name', this.value)">
                        <input type="tel" class="phone-input" value="${mem.phone || ''}" placeholder="Bilbila..." ${!isAdmin ? 'disabled' : ''} onchange="updateInfo('leaders', ${i}, 'phone', this.value)">
                    </div>
                </td>
                <td style="text-align:center;"><input type="checkbox" ${hasJob ? 'checked' : ''} ${(leaderOccupied && leaderOccupied !== mem) || isLocked ? 'disabled' : ''} onchange="toggleJob('leaders', ${i}, this.checked)"></td>
                <td style="text-align:center; white-space:nowrap;">
                    ${isLocked ? '🔒' : `<button onclick="confirmRow('leaders', ${i})" class="btn-ok">OK</button>`}
                    ${isAdmin ? `<button onclick="moveMember('leaders', ${i}, -1)" class="btn-move">⬆️</button><button onclick="moveMember('leaders', ${i}, 1)" class="btn-move">⬇️</button><button onclick="deleteMember('leaders', ${i})" class="btn-delete">🗑️</button>` : ''}
                </td>
            </tr>`;
    });

    const pBody = document.getElementById('preacher-table-body');
    document.getElementById('preacher-count').innerText = db.preachers.length;
    pBody.innerHTML = "";
    let preacherOccupied = db.preachers.find(mem => mem.jobs && mem.jobs.some(j => j.date === dateKey));

    db.preachers.forEach((mem, i) => {
        const hasJob = mem.jobs && mem.jobs.some(j => j.date === dateKey);
        const isLocked = hasJob && !isAdmin;
        pBody.innerHTML += `
            <tr>
                <td style="text-align:center; color:#94a3b8; font-weight:bold;">${i + 1}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <input type="text" class="member-input" value="${mem.name || ''}" placeholder="Maqaa..." ${!isAdmin ? 'disabled' : ''} onchange="updateInfo('preachers', ${i}, 'name', this.value)">
                        <input type="tel" class="phone-input" value="${mem.phone || ''}" placeholder="Bilbila..." ${!isAdmin ? 'disabled' : ''} onchange="updateInfo('preachers', ${i}, 'phone', this.value)">
                    </div>
                </td>
                <td style="text-align:center;"><input type="checkbox" ${hasJob ? 'checked' : ''} ${(preacherOccupied && preacherOccupied !== mem) || isLocked ? 'disabled' : ''} onchange="toggleJob('preachers', ${i}, this.checked)"></td>
                <td style="text-align:center; white-space:nowrap;">
                    ${isLocked ? '🔒' : `<button onclick="confirmRow('preachers', ${i})" class="btn-ok">OK</button>`}
                    ${isAdmin ? `<button onclick="moveMember('preachers', ${i}, -1)" class="btn-move">⬆️</button><button onclick="moveMember('preachers', ${i}, 1)" class="btn-move">⬇️</button><button onclick="deleteMember('preachers', ${i})" class="btn-delete">🗑️</button>` : ''}
                </td>
            </tr>`;
    });
}

function addMemberSlot(type) {
    if (!isAdmin) return;
    db[type].push({ name: "", phone: "", jobs: [], isNew: true });
    saveDB();
    renderTables();
}

function deleteMember(type, idx) {
    if (!isAdmin) return;
    if (confirm("Haquu feetaa?")) {
        db[type].splice(idx, 1);
        saveDB();
        renderTables();
        renderUpcomingCards();
    }
}

function moveMember(type, idx, direction) {
    if (!isAdmin) return;
    let newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= db[type].length) return;
    let temp = db[type][idx];
    db[type][idx] = db[type][newIdx];
    db[type][newIdx] = temp;
    saveDB();
    renderTables();
    renderUpcomingCards();
}

function updateInfo(type, idx, field, val) {
    db[type][idx][field] = val.trim();
    saveDB();
}

function confirmRow(type, idx) {
    if (!db[type][idx].name) { alert("Maqaa galchi!"); return; }
    saveDB();
    updateDateView();
    alert("Galmeeffameera! ✓");
}

function toggleJob(type, idx, isChecked) {
    const d = document.getElementById('d-day').value;
    const m = document.getElementById('d-month').value;
    const y = document.getElementById('d-year').value;
    const dateKey = `${d}/${m}/${y}`;
    if (!db[type][idx].jobs) db[type][idx].jobs = [];
    if (isChecked) {
        db[type].forEach((mem, mIdx) => {
            if (mIdx !== idx && mem.jobs) mem.jobs = mem.jobs.filter(j => j.date !== dateKey);
        });
        db[type][idx].jobs = db[type][idx].jobs.filter(j => j.date !== dateKey);
        db[type][idx].jobs.push({ date: dateKey, confirmed: true });
        db[type][idx].isNew = false;
    } else {
        db[type][idx].jobs = db[type][idx].jobs.filter(j => !(j.date === dateKey && j.confirmed));
    }
    saveDB();
    updateDateView();
}

function autoSchedule() {
    let validLeaders = db.leaders.filter(m => m.name && m.name.trim() !== "");
    let validPreachers = db.preachers.filter(m => m.name && m.name.trim() !== "");
    if (validLeaders.length < 1 || validPreachers.length < 1) {
        alert("Dura Bu'aa fi Lallabaa galchi!");
        return;
    }
    let curDay = parseInt(document.getElementById('d-day').value) || 15;
    let curMonth = parseInt(document.getElementById('d-month').value) || 2;
    let curYear = parseInt(document.getElementById('d-year').value) || 2019;

    let targetServiceDates = [];
    let tempD = curDay, tempM = curMonth, tempY = curYear;
    let safety = 0;
    while (targetServiceDates.length < 6 && safety < 100) {
        let info = getEthiopianDayOfWeek(tempD, tempM, tempY);
        if (info.isService) targetServiceDates.push(`${tempD}/${tempM}/${tempY}`);
        tempD++;
        if (tempD > 30) { tempD = 1; tempM++; if (tempM > 13) { tempM = 1; tempY++; } }
        safety++;
    }

    function getStrictHistoryPerson(list, targetJDN, assignedInBatch) {
        let newMember = list.find(m => (m.isNew || !m.jobs || m.jobs.length === 0) && !assignedInBatch.includes(m));
        if (newMember) { newMember.isNew = false; return newMember; }
        let evalList = list.map(mem => {
            let lastJDN = 0;
            if (mem.jobs && mem.jobs.length > 0) {
                mem.jobs.forEach(j => {
                    if (j.confirmed) {
                        let p = j.date.split('/');
                        if (p.length === 3) {
                            let jd = dateToJDN(parseInt(p[0]), parseInt(p[1]), parseInt(p[2]));
                            if (jd < targetJDN && jd > lastJDN) lastJDN = jd;
                        }
                    }
                });
            }
            return { member: mem, lastJDN: lastJDN };
        });
        let available = evalList.filter(item => !assignedInBatch.includes(item.member));
        if (available.length === 0) return list[0];
        available.sort((a, b) => a.lastJDN - b.lastJDN);
        return available[0].member;
    }

    let batchAssignedLeaders = [];
    let batchAssignedPreachers = [];

    targetServiceDates.forEach(dateKey => {
        let p = dateKey.split('/');
        let targetJDN = dateToJDN(parseInt(p[0]), parseInt(p[1]), parseInt(p[2]));

        let existingLeader = db.leaders.find(m => m.jobs && m.jobs.some(j => j.date === dateKey));
        if (!existingLeader) {
            let nextL = getStrictHistoryPerson(validLeaders, targetJDN, batchAssignedLeaders);
            if (nextL) {
                if (!nextL.jobs) nextL.jobs = [];
                if (!nextL.jobs.some(j => j.date === dateKey)) nextL.jobs.push({ date: dateKey, confirmed: false });
                batchAssignedLeaders.push(nextL);
            }
        } else { batchAssignedLeaders.push(existingLeader); }

        let existingPreacher = db.preachers.find(m => m.jobs && m.jobs.some(j => j.date === dateKey));
        if (!existingPreacher) {
            let nextP = getStrictHistoryPerson(validPreachers, targetJDN, batchAssignedPreachers);
            if (nextP) {
                if (!nextP.jobs) nextP.jobs = [];
                if (!nextP.jobs.some(j => j.date === dateKey)) nextP.jobs.push({ date: dateKey, confirmed: false });
                batchAssignedPreachers.push(nextP);
            }
        } else { batchAssignedPreachers.push(existingPreacher); }
    });

    saveDB();
    renderTables();
    renderUpcomingCards();
    alert("Sagantaan milkaa'inaan baheera! ✓");
}

function overrideAssignment(dateKey, roleType, selectedName) {
    if (!isAdmin) return;
    let list = db[roleType];
    list.forEach(mem => { if (mem.jobs) mem.jobs = mem.jobs.filter(j => j.date !== dateKey); });
    if (selectedName !== "") {
        let targetMem = list.find(m => m.name === selectedName);
        if (targetMem) {
            if (!targetMem.jobs) targetMem.jobs = [];
            targetMem.jobs.push({ date: dateKey, confirmed: false });
        }
    }
    saveDB();
    renderUpcomingCards();
}

function renderUpcomingCards() {
    const container = document.getElementById('schedule-cards-container');
    container.innerHTML = "";
    let curDay = parseInt(document.getElementById('d-day').value) || 15;
    let curMonth = parseInt(document.getElementById('d-month').value) || 2;
    let curYear = parseInt(document.getElementById('d-year').value) || 2019;
    let foundCards = 0, d = curDay, m = curMonth, y = curYear, safety = 0;
    let validLeaders = db.leaders.filter(m => m.name && m.name.trim() !== "");
    let validPreachers = db.preachers.filter(m => m.name && m.name.trim() !== "");

    while (foundCards < 4 && safety < 60) {
        const dayInfo = getEthiopianDayOfWeek(d, m, y);
        if (dayInfo.isService) {
            const dateKey = `${d}/${m}/${y}`;
            let lMem = db.leaders.find(mem => mem.jobs && mem.jobs.some(j => j.date === dateKey));
            let pMem = db.preachers.find(mem => mem.jobs && mem.jobs.some(j => j.date === dateKey));
            let lName = lMem ? lMem.name : '';
            let pName = pMem ? pMem.name : '';
            let leaderContent = "", preacherContent = "";

            if (isAdmin) {
                let lOptions = `<option value="">-- Kan hin ramadamne --</option>`;
                validLeaders.forEach(l => { lOptions += `<option value="${l.name}" ${l.name === lName ? 'selected' : ''}>${l.name}</option>`; });
                leaderContent = `<select class="role-val" onchange="overrideAssignment('${dateKey}', 'leaders', this.value)">${lOptions}</select>`;

                let pOptions = `<option value="">-- Kan hin ramadamne --</option>`;
                validPreachers.forEach(pr => { pOptions += `<option value="${pr.name}" ${pr.name === pName ? 'selected' : ''}>${pr.name}</option>`; });
                preacherContent = `<select class="role-val l-select" onchange="overrideAssignment('${dateKey}', 'preachers', this.value)">${pOptions}</select>`;
            } else {
                leaderContent = `<span class="role-val" style="color:#fcd34d;">${lName || 'Kan hin ramadamne'}</span>`;
                preacherContent = `<span class="role-val" style="color:#6ee7b7;">${pName || 'Kan hin ramadamne'}</span>`;
            }

            container.innerHTML += `
                <div class="sched-card">
                    <div class="sched-header"><span>📅 ${dayInfo.name} (${dateKey})</span><span style="font-size:9px; background:#1e3a8a; color:#93c5fd; padding:2px 6px; border-radius:10px;">TAJAAJILA</span></div>
                    <div class="sched-body">
                        <div class="role-box"><span class="role-lbl">Dura Bu'aa</span>${leaderContent}</div>
                        <div class="role-box"><span class="role-lbl">Lallabaa</span>${preacherContent}</div>
                    </div>
                </div>`;
            foundCards++;
        }
        d++;
        if (d > 30) { d = 1; m++; if (m > 13) { m = 1; y++; } }
        safety++;
    }
    if (foundCards === 0) container.innerHTML = `<div class="card" style="text-align:center; font-size:12px; color:#94a3b8;">Guyyaan tajaajilaa hin argamne.</div>`;
}

function saveDB() { localStorage.setItem('app_data_desktop_v1', JSON.stringify(db)); }
function saveAllData() { saveDB(); alert("Milkaa'inaan kuufameera! ✓"); }
function resetData() {
    if (confirm("Daataa hunda haquu feetaa?")) {
        localStorage.removeItem('app_data_desktop_v1');
        db = { leaders: [], preachers: [] };
        init();
    }
}
init();
