// ===============================
// TL NoBlur + Supabase Premium
// ===============================

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);

const { inflateSampleTableVideo } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs"
);


// =====================================
// 1. SUPABASE
// =====================================

const SUPABASE_URL =
  "https://glpkadgmsaozmcebyrxw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_UYD86Z2gQD5o8BMfuP5IHw__bIcUX0C";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);


// =====================================
// 2. ELEMENTS
// =====================================

const $ = (id) => document.getElementById(id);

const fileInput = $("fileInput");
const pickBtn = $("pickBtn");
const processBtn = $("processBtn");
const processText = $("processText");
const spinner = $("spinner");

const filePanel = $("filePanel");
const preview = $("preview");
const fileName = $("fileName");
const fileStats = $("fileStats");
const fileSize = $("fileSize");
const removeBtn = $("removeBtn");

const progressBox = $("progressBox");
const status = $("status");
const percent = $("percent");
const barFill = $("barFill");

const result = $("result");
const resultMeta = $("resultMeta");
const downloadBtn = $("downloadBtn");
const errorBox = $("error");


// =====================================
// 3. STATE
// =====================================

let selectedFile = null;
let outputBlob = null;
let outputName = "";

let currentUser = null;
let currentProfile = null;


// =====================================
// 4. PLANS
// =====================================

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    days: 3,
    icon: "🆓"
  },
  {
    id: "week",
    name: "1 Week",
    price: 2,
    days: 7,
    icon: "⭐"
  },
  {
    id: "month",
    name: "1 Month",
    price: 5,
    days: 30,
    icon: "🔥"
  },
  {
    id: "6month",
    name: "6 Months",
    price: 15,
    days: 180,
    icon: "💎"
  },
  {
    id: "year",
    name: "1 Year",
    price: 25,
    days: 365,
    icon: "👑"
  }
];


// =====================================
// 5. FORMAT
// =====================================

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";

  const units = ["B", "KB", "MB", "GB"];

  let n = bytes;
  let i = 0;

  while (
    n >= 1024 &&
    i < units.length - 1
  ) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i ? 2 : 0)} ${units[i]}`;
}


function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function setProgress(value, text) {
  const n = Math.max(
    0,
    Math.min(100, Math.round(value))
  );

  percent.textContent = `${n}%`;
  barFill.style.width = `${n}%`;

  if (text) {
    status.textContent = text;
  }
}


function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}


function clearError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}


function resetOutput() {
  outputBlob = null;
  outputName = "";

  result.classList.add("hidden");
}


// =====================================
// 6. AUTH UI
// =====================================

function createAuthUI() {

  if ($("tlAuthBox")) return;

  const box = document.createElement("section");

  box.id = "tlAuthBox";

  box.style.cssText = `
    margin:20px 0;
    padding:20px;
    border:1px solid #292929;
    border-radius:22px;
    background:#111;
    color:#fff;
  `;

  box.innerHTML = `
    <h2 style="margin:0 0 16px;">
      TL NoBlur Account
    </h2>

    <div id="tlLoggedOut">

      <input
        id="tlEmail"
        type="email"
        placeholder="Email"
        autocomplete="email"
        style="
          width:100%;
          box-sizing:border-box;
          padding:16px;
          margin-bottom:10px;
          border-radius:14px;
          border:1px solid #333;
          background:#090909;
          color:white;
        "
      >

      <input
        id="tlPassword"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
        style="
          width:100%;
          box-sizing:border-box;
          padding:16px;
          margin-bottom:12px;
          border-radius:14px;
          border:1px solid #333;
          background:#090909;
          color:white;
        "
      >

      <div style="display:flex;gap:10px;">

        <button
          id="tlSignup"
          type="button"
          style="
            flex:1;
            padding:15px;
            border:0;
            border-radius:14px;
            background:#292929;
            color:white;
            font-weight:700;
          "
        >
          SIGN UP
        </button>

        <button
          id="tlLogin"
          type="button"
          style="
            flex:1;
            padding:15px;
            border:0;
            border-radius:14px;
            background:white;
            color:black;
            font-weight:700;
          "
        >
          LOGIN
        </button>

      </div>

      <div
        id="tlAuthMessage"
        style="
          margin-top:12px;
          color:#aaa;
        "
      ></div>

    </div>


    <div id="tlLoggedIn" style="display:none;">

      <div
        id="tlUserEmail"
        style="
          font-size:16px;
          margin-bottom:8px;
          word-break:break-all;
        "
      ></div>

      <div
        id="tlPremiumStatus"
        style="
          font-size:18px;
          font-weight:700;
          margin-bottom:14px;
        "
      ></div>

      <button
        id="tlLogout"
        type="button"
        style="
          padding:12px 22px;
          border:1px solid #444;
          border-radius:12px;
          background:#111;
          color:white;
        "
      >
        LOGOUT
      </button>

    </div>

    <div id="tlPlans" style="margin-top:20px;display:none;">

      <h3 style="margin-bottom:12px;">
        PREMIUM PLANS
      </h3>

      <div id="tlPlanList"></div>

    </div>
  `;

  const app = document.querySelector("main.app");

  if (app) {
    app.insertBefore(
      box,
      app.children[1] || null
    );
  } else {
    document.body.prepend(box);
  }


  renderPlans();


  $("tlSignup").addEventListener(
    "click",
    signUp
  );

  $("tlLogin").addEventListener(
    "click",
    login
  );

  $("tlLogout").addEventListener(
    "click",
    logout
  );
}


// =====================================
// 7. PLAN UI
// =====================================

function renderPlans() {

  const list = $("tlPlanList");

  if (!list) return;

  list.innerHTML = "";

  for (const plan of PLANS) {

    const item =
      document.createElement("div");

    item.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:14px;
      margin-bottom:8px;
      border:1px solid #292929;
      border-radius:15px;
      background:#090909;
    `;

    const price =
      plan.price === 0
        ? "FREE"
        : `$${plan.price}`;

    item.innerHTML = `
      <div>
        <strong>
          ${plan.icon} ${plan.name}
        </strong>

        <div
          style="
            color:#888;
            margin-top:4px;
          "
        >
          ${plan.days} days
        </div>
      </div>

      <button
        type="button"
        data-plan="${plan.id}"
        style="
          padding:10px 15px;
          border:0;
          border-radius:10px;
          background:white;
          color:black;
          font-weight:700;
        "
      >
        ${price}
      </button>
    `;

    list.appendChild(item);
  }


  list
    .querySelectorAll("[data-plan]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const plan =
            PLANS.find(
              p =>
                p.id ===
                button.dataset.plan
            );

          selectPlan(plan);
        }
      );

    });
}


// =====================================
// 8. SIGN UP
// =====================================

async function signUp() {

  const email =
    $("tlEmail").value.trim();

  const password =
    $("tlPassword").value;

  const message =
    $("tlAuthMessage");


  if (!email || !password) {

    message.textContent =
      "Please enter email and password.";

    return;
  }


  if (password.length < 6) {

    message.textContent =
      "Password must be at least 6 characters.";

    return;
  }


  message.textContent =
    "Creating account…";


  const {
    data,
    error
  } = await supabase.auth.signUp({

    email,
    password

  });


  if (error) {

    message.textContent =
      error.message;

    return;
  }


  if (data.session) {

    message.textContent =
      "Account created successfully.";

    return;
  }


  message.textContent =
    "Account created. You can now login.";
}


// =====================================
// 9. LOGIN
// =====================================

async function login() {

  const email =
    $("tlEmail").value.trim();

  const password =
    $("tlPassword").value;

  const message =
    $("tlAuthMessage");


  if (!email || !password) {

    message.textContent =
      "Please enter email and password.";

    return;
  }


  message.textContent =
    "Logging in…";


  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    message.textContent =
      error.message;

    return;
  }


  currentUser =
    data.user;


  await loadProfile();


  message.textContent =
    "";
}


// =====================================
// 10. LOGOUT
// =====================================

async function logout() {

  await supabase.auth.signOut();

  currentUser = null;
  currentProfile = null;

  updateAuthUI();
}


// =====================================
// 11. LOAD PROFILE
// =====================================

async function loadProfile() {

  if (!currentUser) return;


  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(
        "id,email,plan,is_premium,premium_until"
      )
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    currentProfile = null;

    updateAuthUI();

    return;
  }


  currentProfile = data;

  updateAuthUI();
}


// =====================================
// 12. CHECK PREMIUM
// =====================================

function hasActivePremium() {

  if (!currentUser) {
    return false;
  }


  if (!currentProfile) {
    return false;
  }


  if (!currentProfile.premium_until) {
    return false;
  }


  const expiry =
    new Date(
      currentProfile.premium_until
    ).getTime();


  const now =
    Date.now();


  return (
    currentProfile.is_premium === true &&
    expiry > now
  );
}


function getDaysRemaining() {

  if (
    !currentProfile ||
    !currentProfile.premium_until
  ) {
    return 0;
  }


  const expiry =
    new Date(
      currentProfile.premium_until
    ).getTime();


  const diff =
    expiry - Date.now();


  if (diff <= 0) {
    return 0;
  }


  return Math.ceil(
    diff /
    (1000 * 60 * 60 * 24)
  );
}


// =====================================
// 13. UPDATE AUTH UI
// =====================================

function updateAuthUI() {

  const loggedOut =
    $("tlLoggedOut");

  const loggedIn =
    $("tlLoggedIn");

  const plans =
    $("tlPlans");


  if (!currentUser) {

    loggedOut.style.display =
      "block";

    loggedIn.style.display =
      "none";

    plans.style.display =
      "none";

    processBtn.disabled = true;

    return;
  }


  loggedOut.style.display =
    "none";

  loggedIn.style.display =
    "block";


  $("tlUserEmail")
    .textContent =
    currentUser.email;


  const active =
    hasActivePremium();


  const days =
    getDaysRemaining();


  if (active) {

    $("tlPremiumStatus")
      .innerHTML =
      `🔓 Premium Active • ${days} day(s) remaining`;

    plans.style.display =
      "none";

    if (selectedFile) {
      processBtn.disabled =
        false;
    }

  } else {

    $("tlPremiumStatus")
      .innerHTML =
      `🔒 Premium expired`;

    plans.style.display =
      "block";

    processBtn.disabled =
      true;
  }
}


// =====================================
// 14. SELECT PLAN
// =====================================

async function selectPlan(plan) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }


  if (plan.id === "free") {

    alert(
      "Free Trial is automatically given for 3 days after Sign Up."
    );

    return;
  }


  alert(
    `${plan.name} — $${plan.price}\n\nPayment system will be connected here.`
  );
}


// =====================================
// 15. VIDEO INFO
// =====================================

async function readVideoInfo(file) {

  return new Promise(
    (resolve) => {

      const url =
        URL.createObjectURL(file);

      const v =
        document.createElement("video");

      v.preload =
        "metadata";


      v.onloadedmetadata =
        () => {

          const fps =
            "FPS not read by browser";

          resolve({

            width:
              v.videoWidth,

            height:
              v.videoHeight,

            duration:
              v.duration,

            fps

          });

          URL.revokeObjectURL(url);
        };


      v.onerror =
        () => {

          resolve({

            width: 0,
            height: 0,
            duration: 0,
            fps: "—"

          });

          URL.revokeObjectURL(url);
        };


      v.src = url;
    }
  );
}


// =====================================
// 16. SELECT VIDEO
// =====================================

function selectFile(file) {

  if (!file) return;


  if (!currentUser) {

    showError(
      "Please login before uploading a video."
    );

    return;
  }


  if (!hasActivePremium()) {

    showError(
      "Premium access is required to patch videos."
    );

    return;
  }


  const lower =
    file.name.toLowerCase();


  if (
    !lower.endsWith(".mp4") &&
    !lower.endsWith(".mov")
  ) {

    showError(
      "Please select an MP4 or MOV video."
    );

    return;
  }


  selectedFile =
    file;

  resetOutput();
  clearError();


  if (preview.src) {

    URL.revokeObjectURL(
      preview.src
    );

  }


  preview.src =
    URL.createObjectURL(file);


  fileName.textContent =
    file.name;

  fileSize.textContent =
    formatBytes(file.size);


  readVideoInfo(file)
    .then(info => {

      const dims =
        info.width &&
        info.height
          ? `${info.width}×${info.height}`
          : "Video";

      const dur =
        info.duration
          ? `${info.duration.toFixed(1)}s`
          : "—";

      fileStats.textContent =
        `${dims} • ${dur}`;

    });


  filePanel.classList
    .remove("hidden");


  processBtn.disabled =
    !hasActivePremium();


  processText.textContent =
    "PATCH VIDEO";
}


// =====================================
// 17. REMOVE VIDEO
// =====================================

function removeFile() {

  selectedFile =
    null;

  resetOutput();

  filePanel.classList
    .add("hidden");

  processBtn.disabled =
    true;

  fileInput.value = "";


  if (preview.src) {

    URL.revokeObjectURL(
      preview.src
    );

    preview.removeAttribute(
      "src"
    );

    preview.load();
  }
}


// =====================================
// 18. PICK VIDEO
// =====================================

pickBtn.addEventListener(
  "click",
  () => {

    if (!currentUser) {

      showError(
        "Please login first."
      );

      return;
    }


    if (!hasActivePremium()) {

      showError(
        "Premium access is required to upload videos."
      );

      return;
    }


    fileInput.click();

  }
);


fileInput.addEventListener(
  "change",
  () => {

    if (
      fileInput.files?.[0]
    ) {

      selectFile(
        fileInput.files[0]
      );

    }

  }
);


removeBtn.addEventListener(
  "click",
  removeFile
);


// =====================================
// 19. PATCH VIDEO
// =====================================

processBtn.addEventListener(
  "click",
  async () => {

    if (!selectedFile) return;


    // Check premium AGAIN
    // before processing.

    if (!hasActivePremium()) {

      showError(
        "Your Premium plan has expired."
      );

      updateAuthUI();

      return;
    }


    clearError();
    resetOutput();


    processBtn.disabled =
      true;

    spinner.classList
      .remove("hidden");


    progressBox.classList
      .remove("hidden");


    setProgress(
      2,
      "Reading video…"
    );


    try {

      await new Promise(
        r =>
          setTimeout(r, 30)
      );


      const source =
        await selectedFile
          .arrayBuffer();


      setProgress(
        18,
        "Normalizing MP4 container…"
      );


      const inputBytes =
        new Uint8Array(source);

      const inputView =
        new DataView(source);


      const normalized =
        normalizeContainer(
          inputBytes,
          inputView
        );


      if (!normalized.valid) {

        throw new Error(
          "Invalid MP4/MOV container: moov box was not found."
        );

      }


      setProgress(
        42,
        "Applying 10× sample-table inflation…"
      );


      const inflated =
        inflateSampleTableVideo(
          normalized.newBytes,
          normalized.newView,
          10
        );


      setProgress(
        88,
        "Building download file…"
      );


      const finalBuffer =
        inflated.newBuffer;


      outputBlob =
        new Blob(
          [finalBuffer],
          {
            type: "video/mp4"
          }
        );


      const base =
        selectedFile.name
          .replace(
            /\.(mp4|mov)$/i,
            ""
          );


      outputName =
        `${base}_TL-NoBlur.mp4`;


      setProgress(
        100,
        "Complete"
      );


      resultMeta.textContent =
        `${formatBytes(outputBlob.size)} • original video stream not re-encoded`;


      result.classList
        .remove("hidden");

    } catch (err) {

      console.error(err);


      showError(
        `Patch failed: ${
          err?.message ||
          String(err)
        }`
      );


      setProgress(
        0,
        "Failed"
      );

    } finally {

      processBtn.disabled =
        !selectedFile ||
        !hasActivePremium();


      spinner.classList
        .add("hidden");


      processText.textContent =
        outputBlob
          ? "PATCH AGAIN"
          : "PATCH VIDEO";

    }

  }
);


// =====================================
// 20. DOWNLOAD
// =====================================

downloadBtn.addEventListener(
  "click",
  () => {

    if (!outputBlob) return;


    const url =
      URL.createObjectURL(
        outputBlob
      );


    const a =
      document.createElement("a");


    a.href = url;

    a.download =
      outputName;


    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      2000
    );

  }
);


// =====================================
// 21. AUTH SESSION
// =====================================

createAuthU


// ========================================
// NOBLUR MODULES
// ========================================

const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);

const { inflateSampleTableVideo } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs"
);


// ========================================
// HELPER
// ========================================

const $ = (id) => document.getElementById(id);


// ========================================
// AUTH UI
// ========================================

const loginBox = $("loginBox");
const accountBox = $("accountBox");

const authEmail = $("authEmail");
const authPassword = $("authPassword");

const signUpBtn = $("signUpBtn");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");

const authStatus = $("authStatus");
const accountEmail = $("accountEmail");
const premiumStatus = $("premiumStatus");


// ========================================
// VIDEO UI
// ========================================

const fileInput = $("fileInput");
const pickBtn = $("pickBtn");
const processBtn = $("processBtn");
const processText = $("processText");
const spinner = $("spinner");

const filePanel = $("filePanel");
const preview = $("preview");
const fileName = $("fileName");
const fileStats = $("fileStats");
const fileSize = $("fileSize");

const removeBtn = $("removeBtn");

const progressBox = $("progressBox");
const status = $("status");
const percent = $("percent");
const barFill = $("barFill");

const result = $("result");
const resultMeta = $("resultMeta");
const downloadBtn = $("downloadBtn");

const errorBox = $("error");


// ========================================
// STATE
// ========================================

let selectedFile = null;
let outputBlob = null;
let outputName = "";
let outputUrl = "";

let currentUser = null;
let isPremium = false;


// ========================================
// FORMAT BYTES
// ========================================

function formatBytes(bytes) {

  if (!Number.isFinite(bytes)) {
    return "—";
  }

  const units = ["B", "KB", "MB", "GB"];

  let n = bytes;
  let i = 0;

  while (
    n >= 1024 &&
    i < units.length - 1
  ) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i ? 2 : 0)} ${units[i]}`;
}


// ========================================
// PROGRESS
// ========================================

function setProgress(value, text) {

  const n = Math.max(
    0,
    Math.min(100, Math.round(value))
  );

  percent.textContent = `${n}%`;
  barFill.style.width = `${n}%`;

  if (text) {
    status.textContent = text;
  }
}


// ========================================
// ERROR
// ========================================

function showError(message) {

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}


function clearError() {

  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}


// ========================================
// RESET OUTPUT
// ========================================

function resetOutput() {

  if (outputUrl) {
    URL.revokeObjectURL(outputUrl);
    outputUrl = "";
  }

  outputBlob = null;
  outputName = "";

  result.classList.add("hidden");
}


// ========================================
// UPDATE PATCH BUTTON
// ========================================

function updateProcessButton() {

  if (!currentUser) {

    processBtn.disabled = true;
    processText.textContent = "LOGIN TO PATCH";

    return;
  }

  if (!isPremium) {

    processBtn.disabled = true;
    processText.textContent = "PREMIUM REQUIRED";

    return;
  }

  processBtn.disabled = !selectedFile;

  processText.textContent =
    selectedFile
      ? "PATCH VIDEO"
      : "SELECT VIDEO";
}


// ========================================
// READ VIDEO INFO
// ========================================

async function readVideoInfo(file) {

  return new Promise((resolve) => {

    const url = URL.createObjectURL(file);

    const video =
      document.createElement("video");

    video.preload = "metadata";

    video.onloadedmetadata = () => {

      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });

      URL.revokeObjectURL(url);
    };

    video.onerror = () => {

      resolve({
        width: 0,
        height: 0,
        duration: 0
      });

      URL.revokeObjectURL(url);
    };

    video.src = url;
  });
}


// ========================================
// SELECT FILE
// ========================================

function selectFile(file) {

  if (!file) return;

  const lower =
    file.name.toLowerCase();

  if (
    !lower.endsWith(".mp4") &&
    !lower.endsWith(".mov")
  ) {

    showError(
      "Please select an MP4 or MOV video."
    );

    return;
  }

  if (!currentUser) {

    showError(
      "Please login first."
    );

    return;
  }

  if (!isPremium) {

    showError(
      "Premium access is required."
    );

    return;
  }

  selectedFile = file;

  resetOutput();
  clearError();

  if (preview.src) {
    URL.revokeObjectURL(preview.src);
  }

  preview.src =
    URL.createObjectURL(file);

  fileName.textContent =
    file.name;

  fileSize.textContent =
    formatBytes(file.size);

  readVideoInfo(file).then((info) => {

    const dimensions =
      info.width && info.height
        ? `${info.width}×${info.height}`
        : "Video";

    const duration =
      info.duration
        ? `${info.duration.toFixed(1)}s`
        : "—";

    fileStats.textContent =
      `${dimensions} • ${duration}`;
  });

  filePanel.classList.remove("hidden");

  processBtn.disabled = false;
  processText.textContent = "PATCH VIDEO";
}


// ========================================
// REMOVE FILE
// ========================================

function removeFile() {

  selectedFile = null;

  resetOutput();

  filePanel.classList.add("hidden");

  fileInput.value = "";

  if (preview.src) {

    URL.revokeObjectURL(preview.src);

    preview.removeAttribute("src");

    preview.load();
  }

  updateProcessButton();
}


// ========================================
// CREATE PROFILE
// ========================================

async function createProfile(user) {

  if (!user) return;

  const { error } =
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        is_premium: false
      });

  if (
    error &&
    error.code !== "23505"
  ) {

    console.error(
      "Profile creation error:",
      error
    );
  }
}


// ========================================
// LOAD PREMIUM
// ========================================

async function loadPremiumStatus(user) {

  currentUser = user || null;

  if (!user) {

    isPremium = false;

    loginBox.classList.remove("hidden");
    accountBox.classList.add("hidden");

    updateProcessButton();

    return;
  }

  loginBox.classList.add("hidden");
  accountBox.classList.remove("hidden");

  accountEmail.textContent =
    user.email || "User";

  let { data, error } =
    await supabase
      .from("profiles")
      .select(
        "is_premium,premium_until"
      )
      .eq("id", user.id)
      .maybeSingle();

  if (error) {

    console.error(
      "Profile read error:",
      error
    );

    isPremium = false;

    premiumStatus.textContent =
      "Premium status unavailable";

    updateProcessButton();

    return;
  }

  if (!data) {

    await createProfile(user);

    isPremium = false;

    premiumStatus.textContent =
      "🔒 Premium: Pending";

    updateProcessButton();

    return;
  }

  let active =
    data.is_premium === true;

  // Check expiration
  if (
    active &&
    data.premium_until
  ) {

    const until =
      new Date(data.premium_until);

    if (
      Number.isFinite(
        until.getTime()
      ) &&
      until < new Date()
    ) {

      active = false;
    }
  }

  isPremium = active;

  premiumStatus.textContent =
    active
      ? "✅ Premium: Active"
      : "🔒 Premium: Pending";

  updateProcessButton();
}


// ========================================
// SIGN UP
// ========================================

signUpBtn.addEventListener(
  "click",
  async () => {

    clearError();

    const email =
      authEmail.value.trim();

    const password =
      authPassword.value;

    if (!email || !password) {

      authStatus.textContent =
        "Please enter email and password.";

      return;
    }

    if (password.length < 6) {

      authStatus.textContent =
        "Password must be at least 6 characters.";

      return;
    }

    signUpBtn.disabled = true;
    loginBtn.disabled = true;

    authStatus.textContent =
      "Creating account...";

    try {

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Account could not be created."
        );
      }

      if (data.session) {

        await createProfile(
          data.user
        );

        await loadPremiumStatus(
          data.user
        );

        authStatus.textContent =
          "Account created successfully.";

      } else {

        authStatus.textContent =
          "Account created. Please confirm your email before login.";
      }

    } catch (err) {

      console.error(err);

      authStatus.textContent =
        err?.message ||
        "Sign up failed.";

    } finally {

      signUpBtn.disabled = false;
      loginBtn.disabled = false;
    }
  }
);


// ========================================
// LOGIN
// ========================================

loginBtn.addEventListener(
  "click",
  async () => {

    clearError();

    const email =
      authEmail.value.trim();

    const password =
      authPassword.value;

    if (!email || !password) {

      authStatus.textContent =
        "Please enter email and password.";

      return;
    }

    signUpBtn.disabled = true;
    loginBtn.disabled = true;

    authStatus.textContent =
      "Logging in...";

    try {

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      await loadPremiumStatus(
        data.user
      );

      authStatus.textContent =
        "Login successful.";

    } catch (err) {

      console.error(err);

      authStatus.textContent =
        err?.message ||
        "Login failed.";

    } finally {

      signUpBtn.disabled = false;
      loginBtn.disabled = false;
    }
  }
);


// ========================================
// LOGOUT
// ========================================

logoutBtn.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();

    currentUser = null;
    isPremium = false;

    removeFile();

    loginBox.classList.remove("hidden");
    accountBox.classList.add("hidden");

    authEmail.value = "";
    authPassword.value = "";

    authStatus.textContent =
      "Logged out.";

    updateProcessButton();
  }
);


// ========================================
// AUTH STATE
// ========================================

supabase.auth.onAuthStateChange(
  async (_event, session) => {

    await loadPremiumStatus(
      session?.user || null
    );
  }
);


// ========================================
// RESTORE LOGIN SESSION
// ========================================

const {
  data: {
    session
  }
} =
  await supabase.auth.getSession();


// User automatically stays logged in
// until LOGOUT is pressed.

await loadPremiumStatus(
  session?.user || null
);


// ========================================
// PICK BUTTON
// ========================================

pickBtn.addEventListener(
  "click",
  () => {

    clearError();

    if (!currentUser) {

      showError(
        "Please login first."
      );

      return;
    }

    if (!isPremium) {

      showError(
        "Premium access is required."
      );

      return;
    }

    fileInput.click();
  }
);


// ========================================
// FILE INPUT
// ========================================

fileInput.addEventListener(
  "change",
  () => {

    if (fileInput.files?.[0]) {

      selectFile(
        fileInput.files[0]
      );
    }
  }
);


// ========================================
// REMOVE BUTTON
// ========================================

removeBtn.addEventListener(
  "click",
  removeFile
);


// ========================================
// PATCH
// ========================================

processBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      showError(
        "Please login first."
      );

      return;
    }

    if (!isPremium) {

      showError(
        "Premium access is required."
      );

      return;
    }

    if (!selectedFile) {
      return;
    }

    clearError();
    resetOutput();

    processBtn.disabled = true;

    spinner.classList.remove(
      "hidden"
    );

    progressBox.classList.remove(
      "hidden"
    );

    setProgress(
      2,
      "Reading video…"
    );

    try {

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            30
          )
      );

      const source =
        await selectedFile.arrayBuffer();

      setProgress(
        18,
        "Normalizing MP4 container…"
      );

      const inputBytes =
        new Uint8Array(source);

      const inputView =
        new DataView(source);

      const normalized =
        normalizeContainer(
          inputBytes,
          inputView
        );

      if (!normalized.valid) {

        throw new Error(
          "Invalid MP4/MOV container: moov box was not found."
        );
      }

      setProgress(
        42,
        "Applying 10× sample-table inflation…"
      );

      const inflated =
        inflateSampleTableVideo(
          normalized.newBytes,
          normalized.newView,
          10
        );

      setProgress(
        88,
        "Building download file…"
      );

      const finalBuffer =
        inflated.newBuffer;

      outputBlob =
        new Blob(
          [finalBuffer],
          {
            type: "video/mp4"
          }
        );

      outputUrl =
        URL.createObjectURL(
          outputBlob
        );

      const base =
        selectedFile.name.replace(
          /\.(mp4|mov)$/i,
          ""
        );

      outputName =
        `${base}_TL-NoBlur.mp4`;

      setProgress(
        100,
        "Complete"
      );

      resultMeta.textContent =
        `${formatBytes(outputBlob.size)} • original video stream not re-encoded`;

      result.classList.remove(
        "hidden"
      );

    } catch (err) {

      console.error(
        "Patch error:",
        err
      );

      showError(
        `Patch failed: ${
          err?.message ||
          String(err)
        }`
      );

      setProgress(
        0,
        "Failed"
      );

    } finally {

      spinner.classList.add(
        "hidden"
      );

      updateProcessButton();

      processText.textContent =
        outputBlob
          ? "PATCH AGAIN"
          : "PATCH VIDEO";
    }
  }
);


// ========================================
// DOWNLOAD
// ========================================

downloadBtn.addEventListener(
  "click",
  async () => {

    if (
      !outputBlob ||
      !outputUrl
    ) {

      showError(
        "Download file is not ready."
      );

      return;
    }

    clearError();

    const oldText =
      downloadBtn.textContent;

    downloadBtn.disabled = true;

    downloadBtn.textContent =
      "DOWNLOADING...";

    try {

      const a =
        document.createElement("a");

      a.href =
        outputUrl;

      a.download =
        outputName;

      a.rel =
        "noopener";

      a.style.display =
        "none";

      document.body.appendChild(a);

      a.click();

      a.remove();

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1500
          )
      );

    } catch (err) {

      console.error(
        "Download error:",
        err
      );

      showError(
        "Download failed. Try opening the website in Chrome."
      );

    } finally {

      downloadBtn.disabled = false;

      downloadBtn.textContent =
        oldText;
    }
  }
);


// ========================================
// CLEANUP
// ========================================

window.addEventListener(
  "beforeunload",
  () => {

    if (outputUrl) {

      URL.revokeObjectURL(
        outputUrl
      );
    }

    if (
      preview.src &&
      preview.src.startsWith("blob:")
    ) {

      URL.revokeObjectURL(
        preview.src
      );
    }
  }
);
