// ============================================================
// TL NoBlur - app.js
// Login + Premium Plans + ABA Payment Trigger + Video Patcher
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
// NO BLUR MODULES
// ============================================================

const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);

const { inflateSampleTableVideo } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs"
);


// ============================================================
// HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// AUTH ELEMENTS
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
// PLAN ELEMENTS
// ============================================================

const plans = document.querySelectorAll(".plan");

const paymentOverlay = $("paymentOverlay");
const selectedPlanName = $("selectedPlanName");
const selectedPlanAmount = $("selectedPlanAmount");

const confirmPaymentBtn = $("confirmPaymentBtn");
const cancelPaymentBtn = $("cancelPaymentBtn");

let selectedPlanId = null;


// ============================================================
// VIDEO ELEMENTS
// ============================================================

const fileInput = $("fileInput");
const pickBtn = $("pickBtn");

const filePanel = $("filePanel");
const preview = $("preview");

const fileName = $("fileName");
const fileStats = $("fileStats");
const fileSize = $("fileSize");

const removeBtn = $("removeBtn");

const processBtn = $("processBtn");
const processText = $("processText");
const spinner = $("spinner");


// ============================================================
// PATCH PROGRESS
// ============================================================

const progressBox = $("progressBox");
const status = $("status");
const percent = $("percent");
const barFill = $("barFill");


// ============================================================
// DOWNLOAD
// ============================================================

const downloadProgress = $("downloadProgress");
const downloadStatus = $("downloadStatus");
const downloadPercent = $("downloadPercent");
const downloadBarFill = $("downloadBarFill");
const downloadDone = $("downloadDone");

const result = $("result");
const resultMeta = $("resultMeta");
const downloadBtn = $("downloadBtn");

const errorBox = $("error");


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let currentProfile = null;

let selectedFile = null;

let outputBlob = null;
let outputName = "";


// ============================================================
// PREMIUM PLANS
// IMPORTANT:
// These are UI values only.
// Server MUST use its own locked prices.
// ============================================================

const PLANS = {

  week: {
    name: "⭐ 1 Week",
    amount: 2.00,
    days: 7
  },

  month: {
    name: "🔥 1 Month",
    amount: 5.00,
    days: 30
  },

  three_month: {
    name: "💎 3 Months",
    amount: 9.00,
    days: 90
  },

  six_month: {
    name: "👑 6 Months",
    amount: 19.00,
    days: 180
  },

  year: {
    name: "🏆 1 Year",
    amount: 29.00,
    days: 365
  }

};


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

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  const value =
    bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}


// ============================================================
// FORMAT DURATION
// ============================================================

function formatDuration(seconds) {

  if (!Number.isFinite(seconds)) {
    return "—";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

  errorBox.textContent = message;

  errorBox.classList.remove(
    "hidden"
  );
}


function clearError() {

  errorBox.textContent = "";

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

  downloadProgress.classList.add(
    "hidden"
  );

  setDownloadProgress(
    0,
    "Preparing download..."
  );

  downloadDone.textContent =
    "Preparing download...";
}


// ============================================================
// PREMIUM CHECK
// ============================================================

function premiumIsActive() {

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
// UPDATE PATCH BUTTON
// ============================================================

function updatePatchButton() {

  if (!currentUser) {

    processBtn.disabled = true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }


  if (!premiumIsActive()) {

    processBtn.disabled = true;

    processText.textContent =
      "PREMIUM REQUIRED";

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
  } = await supabase
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
      "🆓 Free plan";

    updatePatchButton();

    return;
  }


  if (premiumIsActive()) {

    const until =
      new Date(
        data.premium_until
      );


    premiumStatus.textContent =
      `👑 ${data.plan || "Premium"} • until ${until.toLocaleDateString()}`;

  } else {

    premiumStatus.textContent =
      "🔒 Premium expired";
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

    currentProfile = null;

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
    currentUser.email || "User";


  try {

    await loadProfile(
      currentUser.id
    );

  } catch (error) {

    console.error(error);

    premiumStatus.textContent =
      "Unable to load profile";
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


    signUpBtn.disabled = true;
    loginBtn.disabled = true;


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

      signUpBtn.disabled = false;
      loginBtn.disabled = false;
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


    loginBtn.disabled = true;
    signUpBtn.disabled = true;


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

      loginBtn.disabled = false;
      signUpBtn.disabled = false;
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


    currentUser = null;
    currentProfile = null;

    selectedFile = null;

    resetOutput();

    filePanel.classList.add(
      "hidden"
    );

    fileInput.value = "";

    preview.removeAttribute(
      "src"
    );

    preview.load();

    updateUser(null);

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
          session?.user || null
        );
      },
      0
    );

  }
);


// ============================================================
// INITIAL AUTH
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
    data.session?.user || null
  );
}


await initAuth();


// ============================================================
// PLAN CLICK
// ============================================================

plans.forEach(
  (planElement) => {

    planElement.addEventListener(
      "click",
      () => {

        const planId =
          planElement.dataset.plan;


        // FREE
        if (planId === "free") {

          alert(
            "🆓 Free plan gives 2 Days access."
          );

          return;
        }


        // LOGIN REQUIRED
        if (!currentUser) {

          alert(
            "Please LOGIN first."
          );

          authEmail.focus();

          return;
        }


        const plan =
          PLANS[planId];


        if (!plan) {

          showError(
            "Invalid payment plan."
          );

          return;
        }


        selectedPlanId =
          planId;


        selectedPlanName.textContent =
          plan.name;


        selectedPlanAmount.textContent =
          `$${plan.amount.toFixed(2)} USD`;


        paymentOverlay.classList.remove(
          "hidden"
        );

      }
    );

  }
);


// ============================================================
// CANCEL PAYMENT
// ============================================================

cancelPaymentBtn.addEventListener(
  "click",
  () => {

    selectedPlanId = null;

    paymentOverlay.classList.add(
      "hidden"
    );

  }
);


// ============================================================
// CONFIRM PAYMENT
// ============================================================

confirmPaymentBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      alert(
        "Please login first."
      );

      paymentOverlay.classList.add(
        "hidden"
      );

      return;
    }


    if (!selectedPlanId) {

      showError(
        "No payment plan selected."
      );

      return;
    }


    const plan =
      PLANS[selectedPlanId];


    if (!plan) {

      showError(
        "Invalid payment plan."
      );

      return;
    }


    confirmPaymentBtn.disabled =
      true;

    cancelPaymentBtn.disabled =
      true;


    confirmPaymentBtn.textContent =
      "OPENING PAYWAY...";


    try {

      /*
       * IMPORTANT:
       *
       * We send ONLY plan_id.
       *
       * We DO NOT send amount.
       *
       * The Edge Function must decide:
       *
       * week        = $2
       * month       = $5
       * three_month = $9
       * six_month   = $19
       * year        = $29
       *
       * This prevents users from changing
       * $2 into $1 from browser DevTools.
       */


      const {
        data: {
          session
        }
      } =
        await supabase.auth.getSession();


      if (!session) {

        throw new Error(
          "Your login session expired. Please login again."
        );
      }


      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/create-payment`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${session.access_token}`

            },

            body: JSON.stringify({

              plan_id:
                selectedPlanId

            })
          }
        );


      const data =
        await response.json()
          .catch(
            () => ({})
          );


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Unable to create payment."
        );
      }


      if (!data.checkout_url) {

        throw new Error(
          "Payment checkout URL was not returned."
        );
      }


      /*
       * Go to ABA PayWay
       */

      window.location.href =
        data.checkout_url;


    } catch (error) {

      console.error(
        "Payment error:",
        error
      );


      showError(
        error?.message ||
        "Unable to start payment."
      );


      confirmPaymentBtn.disabled =
        false;

      cancelPaymentBtn.disabled =
        false;

      confirmPaymentBtn.textContent =
        "PAY NOW";
    }

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
        "Please login first."
      );

      return;
    }


    if (!premiumIsActive()) {

      showError(
        "Premium access is required."
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
  async () => {

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
        "Please select an MP4 or MOV video."
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
      formatBytes(file.size);


    if (preview.src) {

      URL.revokeObjectURL(
        preview.src
      );
    }


    preview.src =
      URL.createObjectURL(file);


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
// REMOVE FILE
// =================================================
