// ================================
// TL NoBlur
// Supabase Authentication + Premium
// ================================

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ================================
// SUPABASE CONFIG
// ================================

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";

const SUPABASE_PUBLISHABLE_KEY =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ================================
// NOBLUR MODULES
// ================================

const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);

const { inflateSampleTableVideo } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs"
);


// ================================
// HELPERS
// ================================

const $ = (id) => document.getElementById(id);


// Auth UI
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


// Video UI
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


// ================================
// STATE
// ================================

let selectedFile = null;
let outputBlob = null;
let outputName = "";

let currentUser = null;
let isPremium = false;


// ================================
// FORMAT BYTES
// ================================

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


// ================================
// PROGRESS
// ================================

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


// ================================
// ERROR
// ================================

function showError(message) {

  errorBox.textContent = message;

  errorBox.classList.remove("hidden");
}


function clearError() {

  errorBox.classList.add("hidden");

  errorBox.textContent = "";
}


// ================================
// OUTPUT
// ================================

function resetOutput() {

  outputBlob = null;

  outputName = "";

  result.classList.add("hidden");
}


// ================================
// VIDEO INFO
// ================================

async function readVideoInfo(file) {

  return new Promise((resolve) => {

    const url =
      URL.createObjectURL(file);

    const v =
      document.createElement("video");

    v.preload = "metadata";

    v.onloadedmetadata = () => {

      const fps =
        "FPS not read by browser";

      resolve({
        width: v.videoWidth,
        height: v.videoHeight,
        duration: v.duration,
        fps
      });

      URL.revokeObjectURL(url);
    };

    v.onerror = () => {

      resolve({
        width: 0,
        height: 0,
        duration: 0,
        fps: "—"
      });

      URL.revokeObjectURL(url);
    };

    v.src = url;
  });
}


// ================================
// SELECT VIDEO
// ================================

function selectFile(file) {

  if (!file) {
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

  if (!isPremium) {

    showError(
      "Premium access is required to patch videos."
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

    const dims =
      info.width && info.height
        ? `${info.width}×${info.height}`
        : "Video";

    const dur =
      info.duration
        ? `${info.duration.toFixed(1)}s`
        : "—";

    fileStats.textContent =
      `${dims} • ${dur}`;
  });

  filePanel.classList.remove("hidden");

  processBtn.disabled = false;

  processText.textContent =
    "PATCH VIDEO";
}


// ================================
// REMOVE VIDEO
// ================================

function removeFile() {

  selectedFile = null;

  resetOutput();

  filePanel.classList.add("hidden");

  processBtn.disabled = true;

  fileInput.value = "";

  if (preview.src) {

    URL.revokeObjectURL(
      preview.src
    );

    preview.removeAttribute("src");

    preview.load();
  }

  updateProcessButton();
}


// ================================
// UPDATE BUTTON
// ================================

function updateProcessButton() {

  if (!currentUser) {

    processBtn.disabled = true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }

  if (!isPremium) {

    processBtn.disabled = true;

    processText.textContent =
      "PREMIUM REQUIRED";

    return;
  }

  processBtn.disabled =
    !selectedFile;

  processText.textContent =
    selectedFile
      ? "PATCH VIDEO"
      : "SELECT VIDEO";
}


// ================================
// CREATE PROFILE
// ================================

async function createProfile(user) {

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


// ================================
// LOAD PREMIUM STATUS
// ================================

async function loadPremiumStatus(user) {

  currentUser = user;

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

    console.error(error);

    premiumStatus.textContent =
      "Premium status unavailable";

    isPremium = false;

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


  const premium =
    data.is_premium === true;

  let active = premium;


  if (
    premium &&
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


  if (active) {

    premiumStatus.textContent =
      "✅ Premium: Active";

  } else {

    premiumStatus.textContent =
      "🔒 Premium: Pending";

  }


  updateProcessButton();
}


// ================================
// SIGN UP
// ================================

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

      const {
        data,
        error
      } =
        await supabase.auth.signUp({
          email,
          password
        });


      if (error) {
        throw error;
      }


      if (data.user) {

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
            "Account created. Please check your email to confirm your account, then login.";
        }
      }

    } catch (err) {

      authStatus.textContent =
        err?.message ||
        "Sign up failed.";

    } finally {

      signUpBtn.disabled = false;

      loginBtn.disabled = false;
    }
  }
);


// ================================
// LOGIN
// ================================

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

      const {
        data,
        error
      } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });


      if (error) {
        throw error;
      }


      if (data.user) {

        await loadPremiumStatus(
          data.user
        );

        authStatus.textContent =
          "Login successful.";
      }

    } catch (err) {

      authStatus.textContent =
        err?.message ||
        "Login failed.";

    } finally {

      signUpBtn.disabled = false;

      loginBtn.disabled = false;
    }
  }
);


// ================================
// LOGOUT
// ================================

logoutBtn.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();

    currentUser = null;

    isPremium = false;

    selectedFile = null;

    removeFile();

    loginBox.classList.remove(
      "hidden"
    );

    accountBox.classList.add(
      "hidden"
    );

    authStatus.textContent =
      "Logged out.";

    updateProcessButton();
  }
);


// ================================
// AUTH STATE
// ================================

supabase.auth.onAuthStateChange(
  async (_event, session) => {

    await loadPremiumStatus(
      session?.user || null
    );
  }
);


// ================================
// INITIAL SESSION
// ================================

const {
  data: {
    session
  }
} =
  await supabase.auth.getSession();


await loadPremiumStatus(
  session?.user || null
);


// ================================
// FILE EVENTS
// ================================

pickBtn.addEventListener(
  "click",
  () => {

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


removeBtn.addEventListener(
  "click",
  removeFile
);


// ================================
// PATCH VIDEO
// ================================

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
        (r) => setTimeout(r, 30)
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

      updateProcessButton();

      spinner.classList.add(
        "hidden"
      );

      processText.textContent =
        outputBlob
          ? "PATCH AGAIN"
          : "PATCH VIDEO";
    }
  }
);


// ================================
// DOWNLOAD
// ================================

downloadBtn.addEventListener(
  "click",
  () => {

    if (!outputBlob) {
      return;
    }


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
      () => URL.revokeObjectURL(url),
      2000
    );
  }
);
