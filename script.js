// =====================
// CONFIG
// =====================
const CORRECT_PASSWORD = "September 20, 2025";

const MEMORIES = {
  0: { photo: "assets/center.png", letterImage: "assets/letter.png", letterText: "" },
  1: { photo: "assets/p1.png",     letterImage: "assets/letter1.png", letterText: "" },
  2: { photo: "assets/p2.png",     letterImage: "assets/letter2.png", letterText: "" },
  3: { photo: "assets/p3.png",     letterImage: "assets/letter3.png", letterText: "" },
  4: { photo: "assets/p4.png",     letterImage: "assets/letter4.png", letterText: "" },
};

// =====================
// HELPERS
// =====================
const $ = (s) => document.querySelector(s);

function showPage(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(id).classList.add("active");
}

function openModal(){
  $("#modal").classList.remove("hidden");
  $("#modal").setAttribute("aria-hidden", "false");
  $("#passInput").focus();
}

function closeModal(){
  $("#modal").classList.add("hidden");
  $("#modal").setAttribute("aria-hidden", "true");
  $("#errMsg").classList.add("hidden");
  $("#passInput").value = "";
}

function wait(ms){
  return new Promise(res => setTimeout(res, ms));
}

function getRect(el){
  return el.getBoundingClientRect();
}

// =====================
// ZOOM SYSTEM
// =====================
const zoomLayer = $("#zoomLayer");
let lastClickedTile = null;
let lastClickedId = null;

function createCloneFromElement(element, imgSrc){
  const r = getRect(element);

  const clone = document.createElement("div");
  clone.className = "zoom-clone";
  clone.style.left = r.left + "px";
  clone.style.top = r.top + "px";
  clone.style.width = r.width + "px";
  clone.style.height = r.height + "px";

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = "zoom";
  clone.appendChild(img);

  zoomLayer.appendChild(clone);
  return clone;
}

function animateCloneToTarget(clone, targetEl){
  const a = getRect(clone);
  const b = getRect(targetEl);

  const scaleX = b.width / a.width;
  const scaleY = b.height / a.height;
  const translateX = (b.left - a.left);
  const translateY = (b.top - a.top);

  clone.style.transformOrigin = "top left";
  clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

function animateCloneToRect(clone, rect){
  const a = getRect(clone);
  const b = rect;

  const scaleX = b.width / a.width;
  const scaleY = b.height / a.height;
  const translateX = (b.left - a.left);
  const translateY = (b.top - a.top);

  clone.style.transformOrigin = "top left";
  clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

// =====================
// LETTER CONTENT (FIXED: shows letter image properly)
// =====================
function setLetterContent(data){
  $("#selectedImg").src = data.photo;

  const letterImg = $("#letterImg");
  const letterText = $("#letterText");

  // Reset
  letterImg.classList.add("hidden");
  letterImg.src = "";
  letterText.classList.add("hidden");
  letterText.textContent = "";

  // Show letter image if provided
  if (data.letterImage && data.letterImage.trim()) {
    letterImg.src = data.letterImage;

    letterImg.onload = () => {
      letterImg.classList.remove("hidden");
    };
    letterImg.onerror = () => {
      console.error("Letter image failed to load:", data.letterImage);
      letterImg.classList.add("hidden");
    };
  }

  // Optional typed letter
  const text = (data.letterText || "").trim();
  if (text) {
    letterText.textContent = text;
    letterText.classList.remove("hidden");
  }
}

// =====================
// PAGE 1 EVENTS
// =====================
$("#openBtn").addEventListener("click", openModal);
$("#cancelBtn").addEventListener("click", closeModal);
$("#submitBtn").addEventListener("click", tryLogin);

$("#passInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryLogin();
  if (e.key === "Escape") closeModal();
});

function tryLogin(){
  const v = $("#passInput").value.trim();
  if (v !== CORRECT_PASSWORD){
    $("#errMsg").classList.remove("hidden");
    return;
  }
  closeModal();

  $("#flash").classList.remove("hidden");
  setTimeout(() => {
    $("#flash").classList.add("hidden");
    showPage("#page-box");
  }, 620);
}

// =====================
// PAGE 2 EVENTS
// =====================
$("#backToFront").addEventListener("click", () => showPage("#page-front"));

document.querySelectorAll(".xtile[data-id]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    const data = MEMORIES[id];
    if (!data) return;

    lastClickedTile = btn;
    lastClickedId = id;

    // set page 3 contents now
    setLetterContent(data);

    // clone from clicked tile
    const tileImg = btn.querySelector("img");
    const clone = createCloneFromElement(btn, tileImg?.src || data.photo);

    // fade out page 2
    const boxPage = $("#page-box");
    boxPage.classList.add("fading-out");

    // show page 3 behind clone
    showPage("#page-letter");
    const letterPage = $("#page-letter");
    letterPage.style.opacity = "0";

    await wait(30);

    // zoom clone into big image
    animateCloneToTarget(clone, $("#selectedImg"));

    clone.addEventListener("transitionend", () => {
      clone.remove();
      letterPage.style.opacity = "1";
      boxPage.classList.remove("fading-out");
    }, { once: true });
  });
});

// =====================
// PAGE 3 EVENTS (Back zoom-out)
// =====================
$("#backToBox").addEventListener("click", async () => {
  const fromImg = $("#selectedImg");
  const letterPage = $("#page-letter");

  if (!lastClickedTile || !fromImg.src) {
    showPage("#page-box");
    return;
  }

  const clone = createCloneFromElement(fromImg, fromImg.src);

  letterPage.classList.add("fading-out");

  showPage("#page-box");
  const boxPage = $("#page-box");
  boxPage.style.opacity = "0";

  await wait(30);

  animateCloneToRect(clone, getRect(lastClickedTile));

  clone.addEventListener("transitionend", () => {
    clone.remove();
    letterPage.classList.remove("fading-out");
    boxPage.style.opacity = "1";
  }, { once: true });
});
