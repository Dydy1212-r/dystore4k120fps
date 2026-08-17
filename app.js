// ============================================================
// TL NoBlur - app.js
// ============================================================

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
// ELEMENT HELPER
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// AUTH
// ============================================================

const loginBox =
  $("loginBox");

const accountBox =
  $("accountBox");

const authEmail =
  $("authEmail");

const authPassword =
  $("authPassword");

const signUpBtn =
  $("signUpBtn");

const loginBtn =
  $("loginBtn");

const logoutBtn =
  $("logoutBtn");

const authStatus =
  $("authStatus");

const accountEmail =
  $("accountEmail");

const premiumStatus =
  $("premiumStatus");


// ============================================================
// VIDEO
// ============================================================

const fileInput =
  $("fileInput");

const pickBtn =
  $("pickBtn");

const filePanel =
  $("filePanel");

const preview =
  $("preview");

const fileName =
  $("fileName");

const fileStats =
  $("fileStats");

const fileSize =
  $("fileSize");

const removeBtn =
  $("removeBtn");


// ============================================================
// PATCH
// ============================================================

const processBtn =
  $("processBtn");

const processText =
  $("processText");

const spinner =
  $("spinner");

const progressBox =
  $("progressBox");

const status =
  $("status");

const percent =
  $("percent");

const barFill =
  $("barFill");


// ============================================================
// RESULT
// ============================================================

const result =
  $("result");

const resultMeta =
  $("resultMeta");

const downloadBtn =
  $("downloadBtn");


// ============================================================
// DOWNLOAD
// ============================================================

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

const errorBox =
  $("error");


// ============================================================
// TIKTOK STUDIO
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
// PREMIUM / FREE ACCESS
// ============================================================
//
// Free account also uses premium_until.
// Example:
//
// premium_until = now + 2 days
//
// When date is still future:
// ACCESS = TRUE
//
// When date has expired:
// ACCESS = FALSE
//
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
// ERROR
// ============================================================

function showError(message) {

  errorBox.textContent =
    message;

  errorBox.classList.remove(
    "hidden"
  );
}


function clearError() {

  errorBox.textContent =
    "";

  errorBox.classList.add(
    "hidden"
  );
}


// ============================================================
// AUTH STATUS
// ============================================================

function setAuthStatus(
  message,
  success = false
) {

  authStatus.textContent =
    message;

  authStatus.style.color =
    success
      ? "#72ff9c"
      : "#ff7777";
}


// ============================================================
// PATCH PROGRESS
// ============================================================

function setProgress(
  value,
  message
) {

  const number =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(value)
      )
    );

  percent.textContent =
    `${number}%`;

  barFill.style.width =
    `${number}%`;

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

  const number =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(value)
      )
    );

  downloadPercent.textContent =
    `${number}%`;

  downloadBarFill.style.width =
    `${number}%`;

  if (message) {
    downloadStatus.textContent =
      message;
  }
}


// ============================================================
// RESET OUTPUT
// ============================================================

function resetOutput() {

  outputBlob = null;

  outputName = "";

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
// UPDATE PATCH BUTTON
// ============================================================

function updatePatchButton() {

  if (!currentUser) {

    processBtn.disabled =
      true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }


  // IMPORTANT:
  // Free 2 Days is allowed here.
  // We only check whether access
  // has expired.

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
// LOAD PROFILE
// ============================================================

async function loadProfile(
  userId
) {

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
      "Profile error:",
      error
    );

    throw error;
  }


  currentProfile =
    data || null;


  if (!data) {

    premiumStatus.textContent =
      "No access";

    updatePatchButton();

    return;
  }


  if (hasAccess()) {

    const expiry =
      new Date(
        data.premium_until
      );


    let planText =
      data.plan ||
      "Free";


    if (
      planText.toLowerCase()
        === "free"
    ) {

      premiumStatus.textContent =
        `🆓 Free • until ${expiry.toLocaleString()}`;

    } else {

      premiumStatus.textContent =
        `👑 ${planText} • until ${expiry.toLocaleString()}`;
    }


  } else {

    premiumStatus.textContent =
      "🔒 Access expired";
  }


  updatePatchButton();
}


// ============================================================
// UPDATE USER
// ============================================================

async function updateUser(
  user
) {

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

    premiumStatus.textContent =
      "Login required";

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
    currentUser.email ||
    "User";


  try {

    await loadProfile(
      currentUser.id
    );

  } catch (error) {

    console.error(error);

    premiumStatus.textContent =
      "Profile error";
  }
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


    if (!email || !password) {

      setAuthStatus(
        "Please enter email and password."
      );

      return;
    }


    if (password.length < 6) {

      setAuthStatus(
        "Password must be at least 6 characters."
      );

      return;
    }


    signUpBtn.disabled =
      true;

    loginBtn.disabled =
      true;


    setAuthStatus(
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


      if (data.session) {

        await updateUser(
          data.user
        );

        setAuthStatus(
          "Account created successfully.",
          true
        );

      } else {

        setAuthStatus(
          "Account created. Please login.",
          true
        );
      }


    } catch (error) {

      console.error(error);

      setAuthStatus(
        error?.message ||
        "Sign up failed."
      );

    } finally {

      signUpBtn.disabled =
        false;

      loginBtn.disabled =
        false;
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


    if (!email || !password) {

      setAuthStatus(
        "Please enter email and password."
      );

      return;
    }


    loginBtn.disabled =
      true;

    signUpBtn.disabled =
      true;


    setAuthStatus(
      "Logging in..."
    );


    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {
        throw error;
      }


      await updateUser(
        data.user
      );


      setAuthStatus(
        "Login successful.",
        true
      );


    } catch (error) {

      console.error(error);

      setAuthStatus(
        error?.message ||
        "Login failed."
      );

    } finally {

      loginBtn.disabled =
        false;

      signUpBtn.disabled =
        false;
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

      console.error(error);
    }


    currentUser =
      null;

    currentProfile =
      null;

    selectedFile =
      null;


    fileInput.value =
      "";


    filePanel.classList.add(
      "hidden"
    );


    resetOutput();


    updateUser(
      null
    );

  }
);


// ============================================================
// SESSION
// ============================================================

supabase.auth.onAuthStateChange(
  (_event, session) => {

    setTimeout(
      () => {

        updateUser(
          session?.user ||
          null
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

  const {
    data,
    error
  } =
    await supabase.auth.getSession();


  if (error) {

    console.error(error);

    return;
  }


  await updateUser(
    data.session?.user ||
    null
  );
}


await initAuth();


// ============================================================
// PLAN BUTTONS
// ============================================================
//
// Payment will be connected later.
// The HTML plan buttons remain separate
// from the video patch button.
// ============================================================

const PLAN_NAMES = {

  week: {
    name: "⭐ 1 Week",
    amount: 2
  },

  month: {
    name: "🔥 1 Month",
    amount: 5
  },

  three_month: {
    name: "💎 3 Months",
    amount: 9
  },

  six_month: {
    name: "👑 6 Months",
    amount: 19
  },

  year: {
    name: "🏆 1 Year",
    amount: 29
  }

};


document
  .querySelectorAll(".plan")
  .forEach(
    (planButton) => {

      planButton.addEventListener(
        "click",
        () => {

          const planId =
            planButton.dataset.plan;


          if (
            planId === "free"
          ) {

            alert(
              "🆓 Free access = 2 Days."
            );

            return;
          }


          if (!currentUser) {

            alert(
              "Please LOGIN first."
            );

            authEmail.focus();

            return;
          }


          const plan =
            PLAN_NAMES[planId];


          if (!plan) {

            showError(
              "Invalid plan."
            );

            return;
          }


          /*
           * Payment integration:
           *
           * planId = week
           * server must set amount = $2
           *
           * planId = month
           * server must set amount = $5
           *
           * etc.
           *
           * Do NOT trust an amount sent
           * from the browser.
           */


          alert(
            `${plan.name}\nPrice: $${plan.amount}.00 USD\n\nPayment system will open here.`
          );

        }
      );

    }
  );


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


    const filename =
      file.name.toLowerCase();


    if (
      !filename.endsWith(".mp4") &&
      !filename.endsWith(".mov")
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
//
// BUTTON 1
//
// SELECT VIDEO
//       ↓
// PATCH VIDEO
//       ↓
// PROGRESS
//       ↓
// PATCH COMPLETE
//
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
        "Your Free/Premium access has expired."
      );

      return;
    }


    if (!selectedFile) {

      showError(
        "Please select a video."
      );

      return;
    }


    processBtn.disabled =
      true;

    spinner.classList.remove(
      "hidden"
    );


    processText.textContent =
      "PATCHING...";


    progressBox.classList.remove(
      "hidden"
    );


    result.classList.add(
      "hidden"
    );


    setProgress(
      0,
      "Preparing..."
    );


    try {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            30
          )
      );


      setProgress(
        10,
        "Reading video..."
      );


      const buffer =
        await selectedFile.arrayBuffer();


      setProgress(
        25,
        "Normalizing MP4 container..."
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
