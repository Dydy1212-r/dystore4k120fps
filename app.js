// ============================================================
// TL NoBlur - app.js
// LOGIN + SIGN UP + FREE 2 DAYS + PATCH + DOWNLOAD
// + TIKTOK STUDIO
// ============================================================

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ============================================================
// 1. SUPABASE CONFIG
// ============================================================
// IMPORTANT:
// Replace these 2 values with your own Supabase values.
//
// Supabase:
// Project Settings → API
//
// Use:
// Project URL
// Publishable key
//
// DO NOT put service_role key here.
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
// 2. NO BLUR MODULE
// ============================================================

const {
  normalizeContainer
} = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);


// ============================================================
// 3. ELEMENT HELPER
// ============================================================

function $(id) {
  return document.getElementById(id);
}


// ============================================================
// 4. AUTH ELEMENTS
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
// 5. VIDEO ELEMENTS
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
// 6. PATCH ELEMENTS
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
// 7. RESULT
// ============================================================

const result =
  $("result");

const resultMeta =
  $("resultMeta");

const downloadBtn =
  $("downloadBtn");


// ============================================================
// 8. DOWNLOAD
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
// 9. ERROR
// ============================================================

const errorBox =
  $("error");


// ============================================================
// 10. TIKTOK
// ============================================================

const tiktokStudioBtn =
  $("tiktokStudioBtn");


// ============================================================
// 11. STATE
// ============================================================

let currentUser =
  null;

let currentProfile =
  null;

let selectedFile =
  null;

let outputBlob =
  null;

let outputName =
  "";


// ============================================================
// 12. FREE / PREMIUM ACCESS
// ============================================================
//
// Free user:
// premium_until = now + 2 days
//
// Premium:
// premium_until = paid expiry
//
// If premium_until > current time:
// ACCESS = TRUE
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
// 13. FORMAT BYTES
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
      index === 0
        ? 0
        : 2
    )
    + " "
    + units[index]
  );
}


// ============================================================
// 14. FORMAT VIDEO TIME
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
// 15. ERROR
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
// 16. AUTH STATUS
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
// 17. PATCH PROGRESS
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
// 18. DOWNLOAD PROGRESS
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
// 19. RESET OUTPUT
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
// 20. UPDATE PATCH BUTTON
// ============================================================

function updatePatchButton() {

  if (!currentUser) {

    processBtn.disabled =
      true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }


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
// 21. LOAD PROFILE
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
      "PROFILE ERROR:",
      error
    );

    throw error;
  }


  currentProfile =
    data || null;


  if (!data) {

    premiumStatus.textContent =
      "⚠️ Profile not found";

    updatePatchButton();

    return;
  }


  if (hasAccess()) {

    const expiry =
      new Date(
        data.premium_until
      );


    const plan =
      data.plan ||
      "Free";


    if (
      String(plan)
        .toLowerCase()
        === "free"
    ) {

      premiumStatus.textContent =
        `🆓 Free • expires ${expiry.toLocaleString()}`;

    } else {

      premiumStatus.textContent =
        `👑 ${plan} • expires ${expiry.toLocaleString()}`;
    }

  } else {

    premiumStatus.textContent =
      "🔒 Access expired";
  }


  updatePatchButton();
}


// ============================================================
// 22. UPDATE USER UI
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

    console.error(
      error
    );

    premiumStatus.textContent =
      "Profile error";
  }
}


// ============================================================
// 23. SIGN UP
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

      setAuthStatus(
        "Please enter your email."
      );

      authEmail.focus();

      return;
    }


    if (!password) {

      setAuthStatus(
        "Please enter your password."
      );

      authPassword.focus();

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


      /*
       * If Supabase Email Confirmation
       * is OFF, session will exist here.
       *
       * If Email Confirmation is ON,
       * user must confirm email first.
       */

      if (data.session) {

        await updateUser(
          data.user
        );

        setAuthStatus(
          "Account created successfully ✓",
          true
        );

      } else {

        setAuthStatus(
          "Account created. Please login.",
          true
        );
      }


    } catch (error) {

      console.error(
        "SIGN UP ERROR:",
        error
      );

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
// 24. LOGIN
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

      setAuthStatus(
        "Please enter your email."
      );

      authEmail.focus();

      return;
    }


    if (!password) {

      setAuthStatus(
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


    setAuthStatus(
      "Connecting to Supabase..."
    );


    try {

      console.log(
        "LOGIN START:",
        email
      );


      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({

            email:
              email,

            password:
              password

          });


      console.log(
        "LOGIN RESPONSE:",
        data,
        error
      );


      if (error) {
        throw error;
      }


      if (!data?.user) {

        throw new Error(
          "Login succeeded but no user was returned."
        );
      }


      await updateUser(
        data.user
      );


      setAuthStatus(
        "Login successful ✓",
        true
      );


    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      setAuthStatus(
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
// 25. LOGOUT
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


    await updateUser(
      null
    );

  }
);


// ============================================================
// 26. AUTH SESSION
// ============================================================

supabase.auth.onAuthStateChange(
  (_event, session) => {

    setTimeout(
      async () => {

        await updateUser(
          session?.user ||
          null
        );

      },
      0
    );

  }
);


// ============================================================
// 27. INITIAL SESSION
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
      data.session?.user ||
      null
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
// 28. PREMIUM PLAN BUTTONS
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
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const planId =
            button.dataset.plan;


          if (
            planId === "free"
          ) {

            alert(
              "🆓 Free plan = 2 Days."
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
           * PAYMENT WILL BE CONNECTED
           * TO SUPABASE EDGE FUNCTION.
           *
           * IMPORTANT:
           * Server must decide amount.
           *
           * week        = $2
           * month      = $5
           * three_month = $9
           * six_month  = $19
           * year       = $29
           */


          alert(
            `${plan.name}\n\nPrice: $${plan.amount}.00 USD\n\nPayment system will be connected here.`
          );

        }
      );

    }
  );


// ============================================================
// 29. SELECT VIDEO
// ============================================================

pickBtn.addEventListener(
  "click",
  () => {

    clearError();


    if (!currentUser) {

      showError(
        "Please LOGIN first."
      );

      authEmail.focus();

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
// 30. FILE SELECTED
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
        "Please select an MP4 or MOV video."
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
// 31. REMOVE VIDEO
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
// 32. PATCH VIDEO
// ============================================================
//
// SELECT VIDEO
//      ↓
//
