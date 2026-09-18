const CONFIG = {
  weddingDate: "2027-07-17T10:00:00+07:00",
  calendarStart: "20270717T100000",
  calendarEnd: "20270717T160000",
  calendarTitle: "The Wedding of Agustin & Ahmad Arifin",
  venue: "Lapangan PB Kemang, Gg. Sabar, Rangkapan Jaya, Kec. Pancoran Mas, Kota Depok, Jawa Barat 16435",
  mapsUrl: "https://maps.app.goo.gl/fbhnJiMfCUA7Hio5A",
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxuEci4gNWBg3iwPz5yecAQpu3vVhcabFps1tsOCHyIie6siRQI4TL14y8Uk3S_BZj-/exec"
};

const GALLERY = Array.from({length:8}, (_,i) => `assets/gallery/gallery-${String(i+1).padStart(2,"0")}.jpg`);
const $ = s => document.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  setupRecipient();
  setupOpening();
  setupMusic();
  setupCountdown();
  setupCalendar();
  setupGallery();
  setupLightbox();
  setupRSVP();
  setupWishes();
  setupCopyButtons();
  setupReveal();
});

function setupRecipient(){
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("to");
  const name = raw ? raw.replace(/\+/g," ").trim() : "";
  $("#recipientName").textContent = name || "Tamu Undangan";
}

function setupOpening(){
  $("#openInvitation").addEventListener("click", async () => {
    $("#openingScreen").classList.add("closing");
    $("#siteContent").classList.remove("is-locked");
    document.body.classList.add("invitation-opened");
    await tryPlayMusic();
    setTimeout(() => {
      $("#openingScreen").style.display = "none";
      document.querySelector("#home").scrollIntoView({behavior:"smooth", block:"start"});
    }, 450);
  });
}

function setupMusic(){
  $("#musicToggle").addEventListener("click", async () => {
    const audio = $("#bgMusic");
    if(audio.paused) await tryPlayMusic();
    else {
      audio.pause();
      setMusicState(false);
    }
  });
}

async function tryPlayMusic(){
  const audio = $("#bgMusic");
  try {
    await audio.play();
    setMusicState(true);
  } catch {
    setMusicState(false);
  }
}

function setMusicState(playing){
  const btn = $("#musicToggle");
  btn.classList.toggle("playing", playing);
  btn.setAttribute("aria-pressed", String(playing));
}

function setupCountdown(){
  const target = new Date(CONFIG.weddingDate).getTime();
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000); diff %= 86400000;
    const hours = Math.floor(diff / 3600000); diff %= 3600000;
    const minutes = Math.floor(diff / 60000); diff %= 60000;
    const seconds = Math.floor(diff / 1000);
    $("#days").textContent = String(days).padStart(3,"0");
    $("#hours").textContent = String(hours).padStart(2,"0");
    $("#minutes").textContent = String(minutes).padStart(2,"0");
    $("#seconds").textContent = String(seconds).padStart(2,"0");
  };
  tick(); setInterval(tick,1000);
}

function setupCalendar(){
  $("#calendarBtn").addEventListener("click", () => {
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action","TEMPLATE");
    url.searchParams.set("text",CONFIG.calendarTitle);
    url.searchParams.set("dates",`${CONFIG.calendarStart}/${CONFIG.calendarEnd}`);
    url.searchParams.set("location",CONFIG.venue);
    url.searchParams.set("ctz","Asia/Jakarta");
    window.open(url.toString(), "_blank", "noopener");
  });
}

function setupGallery(){
  const thumbs = $("#galleryThumbs");
  GALLERY.forEach((src,index) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.galleryIndex = index;
    b.innerHTML = `<img src="${src}" alt="Gallery ${index+1}" loading="lazy">`;
    b.addEventListener("click", () => openLightbox(index));
    thumbs.appendChild(b);
  });
  $(".gallery-feature").addEventListener("click", () => openLightbox(0));
}

function setupLightbox(){
  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#galleryPrev").addEventListener("click", () => moveGallery(-1));
  $("#galleryNext").addEventListener("click", () => moveGallery(1));
  $("#lightbox").addEventListener("click", e => { if(e.target.id === "lightbox") closeLightbox(); });
  document.addEventListener("keydown", e => {
    if(!$("#lightbox").classList.contains("open")) return;
    if(e.key === "Escape") closeLightbox();
    if(e.key === "ArrowLeft") moveGallery(-1);
    if(e.key === "ArrowRight") moveGallery(1);
  });
}

let galleryIndex = 0;
function openLightbox(index){
  galleryIndex = index;
  renderLightbox();
  $("#lightbox").classList.add("open");
  $("#lightbox").setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  $("#lightbox").classList.remove("open");
  $("#lightbox").setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}
function moveGallery(step){
  galleryIndex = (galleryIndex + step + GALLERY.length) % GALLERY.length;
  renderLightbox();
}
function renderLightbox(){
  const src = GALLERY[galleryIndex];
  $("#lightboxImage").src = src;
  $("#lightboxImage").alt = `Pre-wedding Agustina dan Ahmad Arifin ${galleryIndex+1}`;
  $("#galleryCounter").textContent = `${String(galleryIndex+1).padStart(2,"0")} / ${String(GALLERY.length).padStart(2,"0")}`;
  $("#galleryFeatureImage").src = src;
}

function setupRSVP(){
  $("#rsvpForm").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.target;
    const status = $("#formStatus");
    const submitButton = form.querySelector('button[type="submit"]');

    const name = $("#guestName").value.trim();
    const attendance =
      document.querySelector('input[name="attendance"]:checked')?.value || "";
    const message = $("#guestMessage").value.trim();

    if (!name || !attendance) {
      status.textContent = "Mohon lengkapi nama dan kehadiran.";
      return;
    }

    if (!CONFIG.appsScriptUrl) {
      status.textContent = "RSVP belum terhubung ke Google Sheets.";
      return;
    }

    // Cegah klik dua kali yang membuat data dobel
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Mengirim...";
    }

    status.textContent = "Mengirim...";

    try {
      await fetch(CONFIG.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          name,
          attendance,
          message
        })
      });

      // Google Apps Script sudah menerima request.
      status.textContent = "Terima kasih, RSVP berhasil dikirim.";
      form.reset();

      // Beri waktu sebentar agar data tersimpan sebelum wishes dimuat
      setTimeout(() => {
        loadWishes();
      }, 500);

    } catch (error) {
      status.textContent =
        "Terjadi kendala saat mengirim RSVP. Silakan coba lagi.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Kirim";
      }
    }
  });
}

async function setupWishes(){ await loadWishes(); }

async function loadWishes(){
  if(!CONFIG.appsScriptUrl){
    $("#wishesList").innerHTML = '<p class="muted">Ucapan akan tampil setelah Google Sheets dihubungkan.</p>';
    return;
  }
  try{
    const response = await fetch(CONFIG.appsScriptUrl,{cache:"no-store"});
    const data = await response.json();
    renderWishes(Array.isArray(data) ? data : []);
  }catch{
    $("#wishesList").innerHTML = '<p class="muted">Ucapan akan tampil setelah koneksi Google Sheets tersedia.</p>';
  }
}

function renderWishes(items){
  if(!items.length){
    $("#wishesList").innerHTML = '<p class="muted">Belum ada ucapan. Jadilah yang pertama memberikan doa.</p>';
    return;
  }
  $("#wishesList").innerHTML = items.map(item => {
    const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "";
    return `<article class="wish-card"><strong>${escapeHTML(item.name || "Tamu Undangan")}</strong><p>${escapeHTML(item.message || "")}</p><time>${date}</time></article>`;
  }).join("");
}

function setupCopyButtons(){
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(btn.dataset.copy);
        const old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => btn.textContent = old, 1200);
      }catch{ btn.textContent = "Copy manual"; }
    });
  });
}

function setupReveal(){
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) entry.target.classList.add("visible");
    });
  },{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}
