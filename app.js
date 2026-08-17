// ========================================
// TL NoBlur
// Supabase Auth + Persistent Login
// Premium Access + NoBlur Patching
// ========================================

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ========================================
// SUPABASE CONFIG
// ========================================

const SUPABASE_URL =
  "YOUR_SUPABASE_PROJECT_URL";

const SUPABASE_PUBLISHABLE_KEY =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";


// ========================================
// SUPABASE CLIENT
// Login session persists in browser
// until user presses LOGOUT
// ========================================

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
