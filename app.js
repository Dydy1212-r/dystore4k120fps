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
// HELPER
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// AUTH ELEMENTS
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
// VIDEO ELEMENTS
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


// ============================================================
// DOWNLOAD
// ============================================================

const downloadBtn =
  $("downloadBtn");

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
// TIKTOK
// ============================================================

const tiktokStudioBtn =
  $("tiktokStudioBtn");


// ============================================================
// STATE
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
// AUTH MESSAGE
// ============================================================

function authMessage(
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
      index === 0
        ? 0
        : 2
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

async function loadProfile(userId) {

  try {

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

      currentProfile =
        null;

      premiumStatus.textContent =
        "Profile not found";

      updatePatchButton();

      return;
    }


    currentProfile =
      data || null;


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
        data.plan ||
        "Free";


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

  } catch (error) {

    console.error(
      "PROFILE EXCEPTION:",
      error
    );

    premiumStatus.textContent =
      "Profile error";

    updatePatchButton();
  }
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


      console.log(
        "SIGN UP RESULT:",
        data,
        error
      );


      if (error) {
        throw error;
      }


      /*
       * If email confirmation is OFF,
       * Supabase gives us a session.
       */

      if (data.session) {

        await updateUser(
          data.user
        );


        authMessage(
          "Account created successfully ✓",
          true
        );


      } else {

        /*
         * If email confirmation is ON,
         * user must confirm email first.
         */

        authMessage(
          "Account created. Please check your email.",
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
      "Logging in..."
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

            email:
              email,

            password:
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


      if (!data?.user) {

        throw new Error(
          "Login failed: user not found."
        );
      }


      currentUser =
        data.user;


      /*
       * Immediately show account.
       */

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


      await loadProfile(
        data.user.id
      );


    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      let message =
        error?.message ||
        "Login failed.";


      /*
       * Friendly Supabase messages.
       */

      if (
        message
          .toLowerCase()
          .includes(
            "email not confirmed"
          )
      ) {

        message =
          "Email is not confirmed. Turn off Confirm email in Supabase or confirm your email.";
      }


      authMessage(
        message
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
// AUTH STATE
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
        "GET SESSION ERROR:",
        error
      );

      authMessage(
        error.message
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
// PLANS
// ============================================================

const plans = {

  week: {
    name: "1 Week",
    amount: 2
  },

  month: {
    name: "1 Month",
    amount: 5
  },

  three_month: {
    name: "3 Months",
    amount: 9
  },

  six_month: {
    name: "6 Months",
    amount: 19
  },

  year: {
    name: "1 Year",
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
              "🆓 Free plan\n\n2 Days"
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
            plans[planId];


          if (!plan) {
            return;
          }


          /*
           * PAYMENT BUTTON
           *
           * The amount shown here is only
           * the selected plan.
           *
           * Real payment verification MUST
           * happen on a server / Supabase
           * Edge Function.
           */

          alert(
            `${plan.name}\n\nAmount: $${plan.amount}.00 USD\n\nPayment system is ready to connect.`
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
        "Your Free/Premium access has expired."
