// =============================================================
// 🎮 SISTEM MONITORING GAMEZONE — FULL + AUTO UPDATE
// =============================================================

// =============================================================
// 1️⃣ 🕒 JAM REAL-TIME + HARI & TANGGAL
// =============================================================
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const tanggal = now.toLocaleDateString('id-ID', options);

  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.innerHTML = `<span>${h}:${m}:${s}</span><small>${tanggal}</small>`;
}
setInterval(updateClock, 1000);
updateClock();

// =============================================================
// 2️⃣ 📋 RENDER TABEL + ROTASI
// =============================================================
const DISPLAY_INTERVAL = 10000;
const roomRotation = {};

function renderTable(force=false) {
  const tbody = document.getElementById("tableBody");
  if(!tbody) return;
  tbody.innerHTML = "";

  if (!window.bookedData || bookedData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#888;">Belum ada data booking</td></tr>`;
    return;
  }

  const grouped = {};
  bookedData.forEach(item => {
    const key = item.room;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  Object.values(grouped).forEach(arr => arr.sort((a,b)=>a.start.localeCompare(b.start)));

  Object.keys(grouped).forEach(key=>{
    const list = grouped[key];
    if(!roomRotation[key]) roomRotation[key]=0;
    const item=list[roomRotation[key]];

    const tr=document.createElement("tr");
    tr.dataset.room=key;
    tr.dataset.index=roomRotation[key];
    tr.dataset.start=`${item.date}T${item.start}:00`;
    tr.dataset.duration=item.duration;
    tr.dataset.nama=item.nama;
    tr.dataset.ordervia=item.order_via;

    tr.innerHTML=`
      <td>${item.nama}</td>
      <td>${formatTanggal(item.date)}</td>
      <td>${item.start}</td>
      <td>${item.duration}</td>
      <td><span class="console-badge ${getConsoleClass(item.konsol)}">${item.konsol||"-"}</span></td>
      <td><span class="room-badge ${getRoomClass(item.room)}">${item.room}</span></td>
      <td class="statusCell"></td>
      <td class="sisaCell"></td>
      <td>${item.order_via||"-"}</td>
      <td>${item.operator||"-"}</td>
    `;
    tbody.appendChild(tr);

    if(list.length>1) setTimeout(()=>rotateRow(key,list),DISPLAY_INTERVAL);
  });

  updateCountdowns();
}

// Rotasi baris
function rotateRow(roomKey,list){
  const tr=[...document.querySelectorAll("#tableBody tr")].find(r=>r.dataset.room===roomKey);
  if(!tr) return;

  roomRotation[roomKey]=(roomRotation[roomKey]+1)%list.length;
  const next=list[roomRotation[roomKey]];

  tr.classList.add("fade-out");
  setTimeout(()=>{
    tr.dataset.index=roomRotation[roomKey];
    tr.dataset.start=`${next.date}T${next.start}:00`;
    tr.dataset.duration=next.duration;
    tr.dataset.nama=next.nama;
    tr.dataset.ordervia=next.order_via;

    const td=tr.querySelectorAll("td");
    td[0].textContent=next.nama;
    td[1].textContent=formatTanggal(next.date);
    td[2].textContent=next.start;
    td[3].textContent=next.duration;
    td[4].innerHTML=`<span class="console-badge ${getConsoleClass(next.konsol)}">${next.konsol||"-"}</span>`;
    td[5].innerHTML=`<span class="room-badge ${getRoomClass(next.room)}">${next.room}</span>`;
    td[8].textContent=next.order_via||"-";
    td[9].textContent=next.operator||"-";

    tr.classList.remove("fade-out");
    tr.classList.add("fade-in");
    setTimeout(()=>tr.classList.remove("fade-in"),800);
  },800);

  setTimeout(()=>rotateRow(roomKey,list),DISPLAY_INTERVAL);
}

// =============================================================
// 3️⃣ 🧠 HITUNG MUNDUR REAL-TIME
// =============================================================
function updateCountdowns() {
  const now = new Date();
  document.querySelectorAll("#tableBody tr").forEach(tr=>{
    const namaRaw=tr.dataset.nama||"";
    const isPersonal = namaRaw.toUpperCase()==="PERSONAL";

    const start=new Date(tr.dataset.start);
    const duration=parseFloat(tr.dataset.duration)||0;
    const end=new Date(start.getTime()+duration*3600000);

    const statusCell=tr.querySelector(".statusCell");
    const sisaCell=tr.querySelector(".sisaCell");

    if(isPersonal){
      if(isNaN(start.getTime())){
        statusCell.innerHTML=`<span class="status personal">MAIN PERSONAL</span>`;
        sisaCell.textContent="-";
      } else if(now<start){
        statusCell.innerHTML=`<span class="status belum">Belum Mulai</span>`;
        sisaCell.textContent="-";
      } else {
        statusCell.innerHTML=`<span class="status personal">MAIN PERSONAL</span>`;
        sisaCell.textContent=formatCountdown(now-start);
      }
      return;
    }

    if(isNaN(start.getTime())){
      statusCell.innerHTML=`<span class="status selesai">Selesai</span>`;
      sisaCell.textContent="00:00:00";
    } else if(now<start){
      statusCell.innerHTML=`<span class="status belum">Belum Mulai</span>`;
      sisaCell.textContent=formatCountdown(start-now);
    } else if(now>=start && now<=end){
      statusCell.innerHTML=`<span class="status berlangsung">Berlangsung</span>`;
      sisaCell.textContent=formatCountdown(end-now);
    } else {
      statusCell.innerHTML=`<span class="status selesai">Selesai</span>`;
      sisaCell.textContent="00:00:00";
    }
  });
}
setInterval(updateCountdowns,1000);

// =============================================================
// 4️⃣ FUNGSI BANTUAN
// =============================================================
function formatTanggal(dateStr){
  const d=new Date(dateStr);
  const hari=d.toLocaleDateString("id-ID",{weekday:"long"});
  const t=d.toLocaleDateString("id-ID");
  return `${hari}, ${t}`;
}
function formatCountdown(ms){
  const t=Math.max(0,Math.floor(ms/1000));
  const h=String(Math.floor(t/3600)).padStart(2,"0");
  const m=String(Math.floor((t%3600)/60)).padStart(2,"0");
  const s=String(t%60).padStart(2,"0");
  return `${h}:${m}:${s}`;
}
function getRoomClass(n){
  const l=n.toLowerCase();
  if(l.includes("reguler"))return"room-reguler";
  if(l.includes("smoking"))return"room-smoking";
  if(l.includes("vip")&&!l.includes("vvip"))return"room-vip";
  if(l.includes("vvip"))return"room-vvip";
  return"";
}
function getConsoleClass(n){
  if(!n)return"";
  const l=n.toLowerCase();
  if(l.includes("ps4"))return"console-ps4";
  if(l.includes("ps5"))return"console-ps5";
  return"";
}

// =============================================================
// 5️⃣ 🔁 AUTO UPDATE DATA BOOKING GITHUB (FILE DI SAMA FOLDER) — FIX
// =============================================================
let lastDataText = "";

async function autoUpdateData() {
  try {
    // Ambil file data-booking.js dari folder yang sama, hindari cache
    const res = await fetch(`data-booking.js?time=${Date.now()}`);
    const newText = await res.text();

    // Jika ada perubahan data
    if (lastDataText && lastDataText !== newText) {
      console.log("🔄 Data booking berubah — update tabel otomatis");

      // Jalankan script baru langsung, window.bookedData akan diassign
      eval(newText);

      // Render tabel dengan data baru
      renderTable(true);
    }

    lastDataText = newText;
  } catch (err) {
    console.warn("⚠️ Gagal memuat data-booking.js:", err);
  }
}

// Jalankan auto-update tiap 10 detik
setInterval(autoUpdateData, 10000);


// =============================================================
// 6️⃣ 🔔 POPUP RUANG KOSONG
// =============================================================
let popupQueue = [];
let isPopupShowing = false;

function queueAvailableRoomPopups() {
  if (!window.bookedData) return;
  const now = new Date();
  const grouped = {};

  bookedData.forEach(item => {
    const startTime = new Date(`${item.date}T${item.start}:00`);
    const endTime = new Date(startTime.getTime() + item.duration*3600000);
    if(endTime <= now){
      const group = getRoomGroup(item.room);
      if(!grouped[group]) grouped[group]=[];
      if(!grouped[group].includes(item.room)) grouped[group].push(item.room);
    }
  });

  popupQueue=[];
  for(const [group, rooms] of Object.entries(grouped)){
    popupQueue.push({group, rooms});
  }

  showNextPopup();
}

function showNextPopup(){
  if(isPopupShowing || popupQueue.length===0) return;
  const {group, rooms} = popupQueue.shift();
  const color = getGroupColor(group);

  const popup=document.createElement("div");
  popup.className="availableRoomsPopup";
  popup.innerHTML=`
    <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.95);box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:12px;padding:15px 20px;z-index:9999;min-width:280px;text-align:left;animation:fadeInUp 0.5s ease;">
      <h3 style="margin:0 0 8px 0;">🟢 Ruangan Tersedia</h3>
      <div style="background-color:${color}15;border-left:4px solid ${color};margin:5px 0;padding:6px 10px;border-radius:6px;font-size:14px;">
        <strong style="color:${color}">${group}</strong>: ${rooms.join(", ")}
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  isPopupShowing=true;

  setTimeout(()=>{
    popup.remove();
    isPopupShowing=false;
    setTimeout(showNextPopup,1000);
  },4000);
}

function getRoomGroup(roomName){
  if(roomName.startsWith("Reguler")) return "Reguler";
  if(roomName.startsWith("Smoking")) return "Smoking";
  if(roomName.startsWith("VIP")) return "VIP";
  if(roomName.startsWith("VVIP")) return "VVIP";
  return "Lainnya";
}

function getGroupColor(group){
  switch(group){
    case "Reguler": return "#2ecc71";
    case "Smoking": return "#3498db";
    case "VIP": return "#9b59b6";
    case "VVIP": return "#e74c3c";
    default: return "#7f8c8d";
  }
}

const style=document.createElement("style");
style.innerHTML=`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,20px);}to{opacity:1;transform:translate(-50%,0);}}`;
document.head.appendChild(style);
setInterval(queueAvailableRoomPopups,15000);

// =============================================================
// 7️⃣ POPUP BOOKING & 5 MENIT SEBELUM HABIS
// =============================================================
const notifiedSessions = new Set();

function checkFiveMinutesLeft(){
  if(!window.bookedData) return;
  const now = new Date();

  bookedData.forEach(item=>{
    const startTime = new Date(`${item.date}T${item.start}:00`);
    const endTime = new Date(startTime.getTime() + item.duration*3600000);
    const diffMin = (endTime - now)/60000;

    if(diffMin<=5 && diffMin>0 && now>=startTime && now<=endTime){
      const key = `${item.nama}-${item.room}-${item.date}-${item.start}`;
      if(!notifiedSessions.has(key)){
        notifiedSessions.add(key);
        showFiveMinuteWarning(item);
      }
    }
  });
}

function showFiveMinuteWarning(item){
  const notif=document.createElement("div");
  notif.className="time-warning";
  notif.innerHTML=`⚠️ <strong>${item.nama}</strong> di <strong>${item.room}</strong> waktu bermain tinggal <b>5 menit lagi!</b>`;
  document.body.appendChild(notif);

  setTimeout(()=>{
    notif.style.opacity="0";
    notif.style.transform="translateY(-10px)";
    setTimeout(()=>notif.remove(),500);
  },10000);
}
setInterval(checkFiveMinutesLeft,30000);

function showPopup(booking){
  const popup=document.getElementById("popup");
  const nama=document.getElementById("popupNama");
  const ruangan=document.getElementById("popupRuangan");
  const mulai=document.getElementById("popupMulai");
  const durasi=document.getElementById("popupDurasi");
  const countdownEl=document.getElementById("popupCountdown");

  if(!popup || !nama || !ruangan || !mulai || !durasi || !countdownEl) return;

  let countdown=10;
  nama.textContent=booking.nama;
  ruangan.textContent=booking.room;
  mulai.textContent=booking.start;
  durasi.textContent=booking.duration;
  countdownEl.textContent=countdown;
  popup.classList.remove("hidden");

  const timer=setInterval(()=>{
    countdown--;
    countdownEl.textContent=countdown;
    if(countdown<=0){
      clearInterval(timer);
      popup.classList.add("hidden");
    }
  },1000);
}

function checkUpcomingBookings(){
  const now = new Date();
  const upcoming = bookedData.find(item=>{
    const startTime=new Date(`${item.date}T${item.start}:00`);
    const diff=(startTime-now)/1000;
    return diff>0 && diff<=10;
  });
  if(upcoming) showPopup(upcoming);
}
setInterval(checkUpcomingBookings,1000);

// =============================================================
// 8️⃣ WAKTU SHOLAT MANUAL + POPUP
// =============================================================
const prayerTimesManual={Subuh:"04:35",Dzuhur:"13:55",Ashar:"15:10",Maghrib:"18:19",Isya:"19:05"};
let prayerNotifiedManual=new Set();
let prayerCountdownShown=new Set();

function checkPrayerManual(){
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,"0");
  const mm=String(now.getMinutes()).padStart(2,"0");
  const currentHM=`${hh}:${mm}`;

  for(const [name,time] of Object.entries(prayerTimesManual)){
    const [h,m]=time.split(":").map(Number);
    const prayerTime=new Date(); prayerTime.setHours(h,m,0,0);
    const diffSec=Math.floor((prayerTime-now)/1000);

    if(diffSec<=60 && diffSec>0 && !prayerCountdownShown.has(name)){
      prayerCountdownShown.add(name);
      showShalatCountdown(name,diffSec);
    }

    if(currentHM===time && !prayerNotifiedManual.has(name)){
      prayerNotifiedManual.add(name);
      showPrayerPopupManual(name,time);
    }
  }
}

function showPrayerPopupManual(name,time){
  const popup=document.createElement("div");
  popup.className="popup-sholat-manual blink-sholat";
  popup.innerHTML=`🕌 Sudah masuk waktu <b>${name.toUpperCase()}</b> (${time}) Kota Padang & Sekitarnya`;
  document.body.appendChild(popup);
  setTimeout(()=>{
    popup.style.opacity="0";
    popup.style.transform="translateY(10px)";
    setTimeout(()=>popup.remove(),500);
  },10000);
}

function showShalatCountdown(name,seconds){
  const popup=document.createElement("div");
  popup.className="popup-sholat-countdown";
  document.body.appendChild(popup);

  const timer=setInterval(()=>{
    if(seconds<=0){ clearInterval(timer); popup.remove(); return; }
    const h=String(Math.floor(seconds/3600)).padStart(2,"0");
    const m=String(Math.floor((seconds%3600)/60)).padStart(2,"0");
    const s=String(seconds%60).padStart(2,"0");
    popup.innerHTML=`🕌 <b>${name.toUpperCase()}</b> dimulai dalam <b>${h}:${m}:${s}</b>`;
    seconds--;
  },1000);
}
setInterval(checkPrayerManual,1000);
checkPrayerManual();

// =============================================================
// 9️⃣ EKSEKUSI UTAMA
// =============================================================
renderTable();
updateCountdowns();
queueAvailableRoomPopups();


