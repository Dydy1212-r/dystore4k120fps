import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ============================================================
// SUPABASE
// ============================================================

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


// ============================================================
// NO BLUR
// ============================================================

const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);


// ============================================================
// HELPER
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// AUTH
// ============================================================

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


// ============================================================
// VIDEO
// ============================================================

const fileInput = $("fileInput");
const pickBtn = $("pickBtn");

const filePanel = $("filePanel");
const preview = $("preview");

const fileName = $("fileName");
const fileStats = $("fileStats");
const fileSize = $("fileSize");

const removeBtn = $("removeBtn");


// ============================================================
// PATCH
// ============================================================

const processBtn = $("processBtn");
const processText = $("processText");
const spinner = $("spinner");

const progressBox = $("progressBox");
const status = $("status");
const percent = $("percent");
const barFill = $("barFill");


// ============================================================
// RESULT
// ============================================================

const result = $("result");
const resultMeta = $("resultMeta");


// ============================================================
// DOWNLOAD
// ============================================================

const downloadBtn = $("downloadBtn");

const downloadProgress =
  $("downloadProgress");

const downloadStatus =
  $("downloadStatus");

const downloadPercent =
  $("downloadPercent");

const downloadBarFill =
  $("downloadBarFill");

const downloadDone =
  $("downloadDone");


// ============================================================
// ERROR
// ============================================================

const errorBox = $("error");


// ============================================================
// TIKTOK
// ============================================================

const tiktokStudioBtn =
  $("tiktokStudioBtn");


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let currentProfile = null;

let selectedFile = null;

let outputBlob = null;
let outputName = "";


// ============================================================
// AUTH STATUS
// ============================================================

function authMessage(
  message,
  success = false
) {

  if (!authStatus) return;

  authStatus.textContent =
    message;

  authStatus.style.color =
    success
      ? "#72ff9c"
      : "#ff7777";
}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

  if (!errorBox) return;

  errorBox.textContent =
    message;

  errorBox.classList.remove(
    "hidden"
  );
}


function clearError() {

  if (!errorBox) return;

  errorBox.textContent = "";

  errorBox.classList.add(
    "hidden"
  );
}


// ============================================================
// ACCESS
// ============================================================

function hasAccess() {

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

  return expiry > Date.now();
}


// ============================================================
// PROFILE
// ============================================================

async function loadProfile(userId) {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

  if (error) {

    console.error(
      "PROFILE ERROR:",
      error
    );

    currentProfile = null;

    if (premiumStatus) {
      premiumStatus.textContent =
        "Profile error";
    }

    updatePatchButton();

    return;
  }


  currentProfile =
    data || null;


  if (!data) {

    if (premiumStatus) {
      premiumStatus.textContent =
        "Free access not configured";
    }

    updatePatchButton();

    return;
  }


  if (hasAccess()) {

    const expiry =
      new Date(
        data.premium_until
      );


    const plan =
      data.plan || "Free";


    if (
      String(plan).toLowerCase()
      === "free"
    ) {

      premiumStatus.textContent =
        `🆓 Free • until ${expiry.toLocaleString()}`;

    } else {

      premiumStatus.textContent =
        `👑 ${plan} • until ${expiry.toLocaleString()}`;
    }

  } else {

    premiumStatus.textContent =
      "🔒 Access expired";
  }


  updatePatchButton();
}


// ============================================================
// UPDATE USER UI
// ============================================================

async function updateUser(user) {

  currentUser =
    user || null;


  if (!currentUser) {

    loginBox.classList.remove(
      "hidden"
    );

    accountBox.classList.add(
      "hidden"
    );

    currentProfile =
      null;

    if (premiumStatus) {
      premiumStatus.textContent =
        "Login required";
    }

    updatePatchButton();

    return;
  }


  loginBox.classList.add(
    "hidden"
  );

  accountBox.classList.remove(
    "hidden"
  );


  accountEmail.textContent =
    currentUser.email || "User";


  await loadProfile(
    currentUser.id
  );
}


// ============================================================
// SIGN UP
// ============================================================

signUpBtn.addEventListener(
  "click",
  async () => {

    clearError();


    const email =
      authEmail.value.trim();

    const password =
      authPassword.value;


    if (!email) {

      authMessage(
        "Please enter your email."
      );

      authEmail.focus();

      return;
    }


    if (!password) {

      authMessage(
        "Please enter your password."
      );

      authPassword.focus();

      return;
    }


    if (password.length < 6) {

      authMessage(
        "Password must be at least 6 characters."
      );

      return;
    }


    signUpBtn.disabled =
      true;

    loginBtn.disabled =
      true;

    signUpBtn.textContent =
      "CREATING...";


    authMessage(
      "Creating account..."
    );


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


      console.log(
        "SIGN UP:",
        data
      );


      /*
       * If Email Confirmation is OFF:
       * session exists immediately.
       *
       * If Email Confirmation is ON:
       * user needs to confirm email.
       */

      if (data.session) {

        await updateUser(
          data.user
        );

        authMessage(
          "Account created ✓",
          true
        );

      } else {

        authMessage(
          "Account created. Please login.",
          true
        );
      }


    } catch (error) {

      console.error(
        "SIGN UP ERROR:",
        error
      );


      authMessage(
        error?.message ||
        "Sign up failed."
      );

    } finally {

      signUpBtn.disabled =
        false;

      loginBtn.disabled =
        false;

      signUpBtn.textContent =
        "SIGN UP";
    }

  }
);


// ============================================================
// LOGIN
// ============================================================

loginBtn.addEventListener(
  "click",
  async () => {

    clearError();


    const email =
      authEmail.value.trim();

    const password =
      authPassword.value;


    if (!email) {

      authMessage(
        "Please enter your email."
      );

      authEmail.focus();

      return;
    }


    if (!password) {

      authMessage(
        "Please enter your password."
      );

      authPassword.focus();

      return;
    }


    loginBtn.disabled =
      true;

    signUpBtn.disabled =
      true;

    loginBtn.textContent =
      "LOGGING IN...";


    authMessage(
      "Logging in...",
      false
    );


    try {

      console.log(
        "LOGIN START"
      );


      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({
            email: email,
            password: password
          });


      console.log(
        "LOGIN RESULT:",
        data,
        error
      );


      if (error) {
        throw error;
      }


      if (!data.user) {

        throw new Error(
          "No user returned from Supabase."
        );
      }


      /*
       * THIS IS THE IMPORTANT PART:
       * Update UI immediately after login.
       */

      currentUser =
        data.user;


      loginBox.classList.add(
        "hidden"
      );

      accountBox.classList.remove(
        "hidden"
      );


      accountEmail.textContent =
        data.user.email;


      authMessage(
        "Login successful ✓",
        true
      );


      /*
       * Load Free/Premium status.
       */

      await loadProfile(
        data.user.id
      );


    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      authMessage(
        error?.message ||
        "Login failed."
      );

    } finally {

      loginBtn.disabled =
        false;

      signUpBtn.disabled =
        false;

      loginBtn.textContent =
        "LOGIN";
    }

  }
);


// ============================================================
// LOGOUT
// ============================================================

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await supabase.auth.signOut();

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );
    }


    currentUser = null;
    currentProfile = null;
    selectedFile = null;

    fileInput.value = "";

    filePanel.classList.add(
      "hidden"
    );

    resetOutput();

    await updateUser(null);
  }
);


// ============================================================
// SESSION
// ============================================================

supabase.auth.onAuthStateChange(
  (_event, session) => {

    setTimeout(
      async () => {

        await updateUser(
          session?.user || null
        );

      },
      0
    );

  }
);


// ============================================================
// INITIAL SESSION
// ============================================================

async function initAuth() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      return;
    }


    await updateUser(
      data.session?.user || null
    );


  } catch (error) {

    console.error(
      "AUTH INIT ERROR:",
      error
    );
  }
}


await initAuth();


// ============================================================
// FORMAT BYTES
// ============================================================

function formatBytes(bytes) {

  if (!Number.isFinite(bytes)) {
    return "—";
  }

  if (bytes === 0) {
    return "0 B";
  }


  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];


  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );


  const value =
    bytes /
    Math.pow(
      1024,
      index
    );


  return (
    value.toFixed(
      index === 0 ? 0 : 2
    )
    + " "
    + units[index]
  );
}


// ============================================================
// FORMAT DURATION
// ============================================================

function formatDuration(seconds) {

  if (!Number.isFinite(seconds)) {
    return "—";
  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    Math.floor(
      seconds % 60
    );


  return (
    minutes +
    ":" +
    String(secs).padStart(
      2,
      "0"
    )
  );
}


// ============================================================
// PATCH BUTTON
// ============================================================

function updatePatchButton() {

  if (!currentUser) {

    processBtn.disabled =
      true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }


  /*
   * FREE 2 DAYS IS ALLOWED.
   */

  if (!hasAccess()) {

    processBtn.disabled =
      true;

    processText.textContent =
      "ACCESS EXPIRED";

    return;
  }


  if (!selectedFile) {

    processBtn.disabled =
      true;

    processText.textContent =
      "SELECT VIDEO";

    return;
  }


  processBtn.disabled =
    false;

  processText.textContent =
    "PATCH VIDEO";
}


// ============================================================
// PROGRESS
// ============================================================

function setProgress(
  value,
  message
) {

  const v =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(value)
      )
    );


  percent.textContent =
    `${v}%`;

  barFill.style.width =
    `${v}%`;


  if (message) {
    status.textContent =
      message;
  }
}


// ============================================================
// DOWNLOAD PROGRESS
// ============================================================

function setDownloadProgress(
  value,
  message
) {

  const v =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(value)
      )
    );


  downloadPercent.textContent =
    `${v}%`;

  downloadBarFill.style.width =
    `${v}%`;


  if (message) {
    downloadStatus.textContent =
      message;
  }
}


// ============================================================
// RESET OUTPUT
// ============================================================

function resetOutput() {

  outputBlob =
    null;

  outputName =
    "";


  result.classList.add(
    "hidden"
  );


  progressBox.classList.add(
    "hidden"
  );


  downloadProgress.classList.add(
    "hidden"
  );


  setProgress(
    0,
    "Preparing..."
  );


  setDownloadProgress(
    0,
    "Preparing download..."
  );


  downloadDone.textContent =
    "Preparing video...";
}


// ============================================================
// SELECT VIDEO
// ============================================================

pickBtn.addEventListener(
  "click",
  () => {

    clearError();


    if (!currentUser) {

      showError(
        "Please LOGIN first."
      );

      return;
    }


    if (!hasAccess()) {

      showError(
        "Your Free/Premium access has expired."
      );

      return;
    }


    fileInput.click();
  }
);


// ============================================================
// FILE SELECTED
// ============================================================

fileInput.addEventListener(
  "change",
  () => {

    const file =
      fileInput.files?.[0];


    if (!file) {
      return;
    }


    clearError();


    const name =
      file.name.toLowerCase();


    if (
      !name.endsWith(".mp4") &&
      !name.endsWith(".mov")
    ) {

      showError(
        "Please select MP4 or MOV."
      );

      fileInput.value =
        "";

      return;
    }


    selectedFile =
      file;


    resetOutput();


    fileName.textContent =
      file.name;


    fileSize.textContent =
      formatBytes(
        file.size
      );


    if (preview.src) {

      URL.revokeObjectURL(
        preview.src
      );
    }


    preview.src =
      URL.createObjectURL(
        file
      );


    filePanel.classList.remove(
      "hidden"
    );


    preview.onloadedmetadata =
      () => {

        fileStats.textContent =
          `${preview.videoWidth}×${preview.videoHeight} • ${formatDuration(preview.duration)}`;

      };


    updatePatchButton();
  }
);


// ============================================================
// REMOVE VIDEO
// ============================================================

removeBtn.addEventListener(
  "click",
  () => {

    selectedFile =
      null;


    fileInput.value =
      "";


    if (preview.src) {

      URL.revokeObjectURL(
        preview.src
      );
    }


    preview.removeAttribute(
      "src"
    );


    preview.load();


    filePanel.classList.add(
      "hidden"
    );


    resetOutput();


    updatePatchButton();
  }
);


// ============================================================
// PATCH VIDEO
// ============================================================

processBtn.addEventListener(
  "click",
  async () => {

    clearError();


    if (!currentUser) {

      showError(
        "Please LOGIN first."
      );

      return;
    }


    if (!hasAccess()) {

      showError(
        "Your access has expired."
      );

      return;
    }


    if (!selectedFile) {

      showError(
        "Please select video."
      );

      return;
    }


    processBtn.disabled =
      true;

    processText.textContent =
      "PATCHING...";


    spinner.classList.remove(
      "hidden"
    );


    progressBox.classList.remove(
      "hidden"
    );


    result.classList.add(
      "hidden"
    );


    try {

      setProgress(
        5,
        "Reading video..."
      );


      const buffer =
        await selectedFile.arrayBuffer();


      setProgress(
        25,
        "Normalizing MP4..."
      );


      const bytes =
        new Uint8Array(
          buffer
        );


      const view =
        new DataView(
          buffer
        );


      const normalized =
        normalizeContainer(
          bytes,
          view
        );


      if (
        !normalized ||
        !normalized.valid
      ) {

        throw new Error(
          "Invalid MP4/MOV video."
        );
      }


      setProgress(
        60,
        "Applying patch..."
      );


      const finalBytes =
        normalized.newBytes;


      outputBlob =
        new Blob(
          [finalBytes],
          {
            type:
              "video/mp4"
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
        90,
        "Finalizing..."
      );


      await new Promise(
        r =>
          setTimeout(
            r,
            100
          )
      );


      setProgress(
        100,
        "Patch complete ✓"
      );


      resultMeta.textContent =
        `${formatBytes(outputBlob.size)} • Ready to download`;


      result.classList.remove(
        "hidden"
      );


    } catch (error) {

      console.error(
        "PATCH ERROR:",
        error
      );


      showError(
        error?.message ||
        "Patch fail
