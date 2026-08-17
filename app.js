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
// ELEMENTS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// AUTH
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


// VIDEO
const fileInput = $("fileInput");
const pickBtn = $("pickBtn");

const filePanel = $("filePanel");
const preview = $("preview");

const fileName = $("fileName");
const fileStats = $("fileStats");
const fileSize = $("fileSize");

const removeBtn = $("removeBtn");


// PATCH
const processBtn = $("processBtn");
const processText = $("processText");
const spinner = $("spinner");

const progressBox = $("progressBox");
const status = $("status");
const percent = $("percent");
const barFill = $("barFill");


// RESULT
const result = $("result");
const resultMeta = $("resultMeta");


// DOWNLOAD
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


// ERROR
const errorBox = $("error");


// TIKTOK
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
// AUTH MESSAGE
// ============================================================

function setAuthMessage(
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
// FORMAT
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

  const i = Math.floor(
    Math.log(bytes) /
    Math.log(1024)
  );

  const value =
    bytes /
    Math.pow(1024, i);

  return (
    value.toFixed(
      i === 0 ? 0 : 2
    )
    + " "
    + units[i]
  );
}


function formatDuration(seconds) {

  if (!Number.isFinite(seconds)) {
    return "—";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return (
    minutes +
    ":" +
    String(secs).padStart(2, "0")
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

  return (
    new Date(
      currentProfile.premium_until
    ).getTime() > Date.now()
  );
}


// ============================================================
// PATCH BUTTON
// ============================================================

function updatePatchButton() {

  if (!currentUser) {

    processBtn.disabled = true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }


  if (!hasAccess()) {

    processBtn.disabled = true;

    processText.textContent =
      "ACCESS EXPIRED";

    return;
  }


  if (!selectedFile) {

    processBtn.disabled = true;

    processText.textContent =
      "SELECT VIDEO";

    return;
  }


  processBtn.disabled = false;

  processText.textContent =
    "PATCH VIDEO";
}


// ============================================================
// LOAD PROFILE
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

    premiumStatus.textContent =
      "Profile error";

    updatePatchButton();

    return;
  }


  currentProfile =
    data;


  if (!data) {

    premiumStatus.textContent =
      "Free access not configured";

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
// CREATE FREE PROFILE
// ============================================================

async function createFreeProfile(user) {

  /*
   * Free access = 2 days.
   */

  const freeUntil =
    new Date(
      Date.now() +
      2 * 24 * 60 * 60 * 1000
    ).toISOString();


  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        plan: "Free",
        premium_until: freeUntil
      })
      .select()
      .single();


  if (error) {

    console.error(
      "CREATE PROFILE ERROR:",
      error
    );

    return null;
  }


  return data;
}


// ============================================================
// SHOW ACCOUNT
// ============================================================

async function showAccount(user) {

  currentUser =
    user;


  loginBox.classList.add(
    "hidden"
  );

  accountBox.classList.remove(
    "hidden"
  );


  accountEmail.textContent =
    user.email || "User";


  await loadProfile(
    user.id
  );
}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

  currentUser = null;
  currentProfile = null;

  loginBox.classList.remove(
    "hidden"
  );

  accountBox.classList.add(
    "hidden"
  );

  premiumStatus.textContent =
    "Login required";

  updatePatchButton();
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

      setAuthMessage(
        "Please enter your email."
      );

      return;
    }


    if (!password) {

      setAuthMessage(
        "Please enter your password."
      );

      return;
    }


    if (password.length < 6) {

      setAuthMessage(
        "Password must be at least 6 characters."
      );

      return;
    }


    signUpBtn.disabled = true;
    loginBtn.disabled = true;

    signUpBtn.textContent =
      "CREATING...";


    setAuthMessage(
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
        "SIGN UP RESULT:",
        data
      );


      /*
       * If Confirm Email is OFF,
       * Supabase returns a session.
       */

      if (data.session && data.user) {

        /*
         * Try to create Free profile.
         */

        let profile =
          await loadProfile(
            data.user.id
          );


        if (!profile) {

          await createFreeProfile(
            data.user
          );

        }


        await showAccount(
          data.user
        );


        setAuthMessage(
          "Account created successfully ✓",
          true
        );


      } else {

        /*
         * Confirm Email is probably ON.
         */

        setAuthMessage(
          "Account created. Please confirm your email, then LOGIN.",
          true
        );
      }


    } catch (error) {

      console.error(
        "SIGN UP ERROR:",
        error
      );


      setAuthMessage(
        error.message ||
        "Sign up failed."
      );


    } finally {

      signUpBtn.disabled = false;
      loginBtn.disabled = false;

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

      setAuthMessage(
        "Please enter your email."
      );

      return;
    }


    if (!password) {

      setAuthMessage(
        "Please enter your password."
      );

      return;
    }


    loginBtn.disabled = true;
    signUpBtn.disabled = true;

    loginBtn.textContent =
      "LOGGING IN...";


    setAuthMessage(
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
          "User account not found."
        );
      }


      /*
       * LOGIN SUCCESS
       */

      await showAccount(
        data.user
      );


      setAuthMessage(
        "Login successful ✓",
        true
      );


    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      let message =
        error.message ||
        "Login failed.";


      if (
        message
          .toLowerCase()
          .includes(
            "email not confirmed"
          )
      ) {

        message =
          "Email is not confirmed. Please confirm your email first.";
      }


      setAuthMessage(
        message
      );


    } finally {

      loginBtn.disabled = false;
      signUpBtn.disabled = false;

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

    await supabase.auth.signOut();

    showLogin();

    authEmail.value = "";
    authPassword.value = "";

    setAuthMessage(
      "Logged out."
    );
  }
);


// ============================================================
// SESSION
// ============================================================

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth
        .getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      showLogin();

      return;
    }


    if (data.session?.user) {

      await showAccount(
        data.session.user
      );

    } else {

      showLogin();
    }


  } catch (error) {

    console.error(
      "SESSION CHECK ERROR:",
      error
    );

    showLogin();
  }
}


// ============================================================
// AUTH STATE
// ============================================================

supabase.auth.onAuthStateChange(
  (_event, session) => {

    if (session?.user) {

      showAccount(
        session.user
      );

    } else {

      showLogin();
    }

  }
);


// ============================================================
// INITIALIZE AUTH
// ============================================================

await checkSession();


// ============================================================
// PLANS
// ============================================================

const PLAN_DATA = {

  week: {
    title: "⭐ 1 Week",
    amount: 2
  },

  month: {
    title: "🔥 1 Month",
    amount: 5
  },

  three_month: {
    title: "💎 3 Months",
    amount: 9
  },

  six_month: {
    title: "👑 6 Months",
    amount: 19
  },

  year: {
    title: "🏆 1 Year",
    amount: 29
  }

};


document
  .querySelectorAll(".plan")
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const plan =
            button.dataset.plan;


          if (plan === "free") {

            alert(
              "🆓 Free\n\n2 Days"
            );

            return;
          }


          if (!currentUser) {

            alert(
              "Please LOGIN first."
            );

            return;
          }


          const selected =
            PLAN_DATA[plan];


          if (!selected) {
            return;
          }


          /*
           * Payment will be connected
           * to the server/payment gateway.
           */

          alert(
            `${selected.title}\n\nPayment: $${selected.amount}\n\nPayment gateway will be connected here.`
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


    const name =
      file.name.toLowerCase();


    if (
      !name.endsWith(".mp4") &&
      !name.endsWith(".mov")
    ) {

      showError(
        "Only MP4 and MOV videos are supported."
      );

      fileInput.value = "";

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
// PATCH PROGRESS
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
        "Please select a video."
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
        2,
        "Loading patch engine..."
      );


      /*
       * IMPORTANT:
       * NoBlur loads ONLY here.
       */

      const {
        normalizeContainer
      } =
        await import(
          "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
        );


      setProgress(
        10,
        "Reading video..."
      );


      const buffer =
        await selectedFile.arrayBuffer();


      setProgress(
        30,
        "Normalizing video..."
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


      if (!fin
