// ========================================
// TL NoBlur
// Supabase Authentication + Premium
// Client-side MP4/MOV patching
// ========================================


// ========================================
// SUPABASE
// ========================================

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ⚠️ PUT YOUR SUPABASE VALUES HERE

const SUPABASE_URL =
  "YOUR_SUPABASE_PROJECT_URL";

const SUPABASE_PUBLISHABLE_KEY =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";


const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
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

const $ = (id) =>
  document.getElementById(id);


// ========================================
// AUTH ELEMENTS
// ========================================

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


// ========================================
// VIDEO ELEMENTS
// ========================================

const fileInput =
  $("fileInput");

const pickBtn =
  $("pickBtn");

const processBtn =
  $("processBtn");

const processText =
  $("processText");

const spinner =
  $("spinner");

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

const progressBox =
  $("progressBox");

const status =
  $("status");

const percent =
  $("percent");

const barFill =
  $("barFill");

const result =
  $("result");

const resultMeta =
  $("resultMeta");

const downloadBtn =
  $("downloadBtn");

const errorBox =
  $("error");


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
// FORMAT FILE SIZE
// ========================================

function formatBytes(bytes) {

  if (!Number.isFinite(bytes)) {
    return "—";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

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

function setProgress(
  value,
  text
) {

  const n =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(value)
      )
    );

  percent.textContent =
    `${n}%`;

  barFill.style.width =
    `${n}%`;

  if (text) {
    status.textContent =
      text;
  }
}


// ========================================
// ERROR
// ========================================

function showError(
  message
) {

  errorBox.textContent =
    message;

  errorBox.classList.remove(
    "hidden"
  );
}


function clearError() {

  errorBox.classList.add(
    "hidden"
  );

  errorBox.textContent =
    "";
}


// ========================================
// RESET OUTPUT
// ========================================

function resetOutput() {

  if (outputUrl) {

    URL.revokeObjectURL(
      outputUrl
    );

    outputUrl =
      "";
  }

  outputBlob =
    null;

  outputName =
    "";

  result.classList.add(
    "hidden"
  );
}


// ========================================
// READ VIDEO INFO
// ========================================

async function readVideoInfo(
  file
) {

  return new Promise(
    (resolve) => {

      const url =
        URL.createObjectURL(
          file
        );

      const v =
        document.createElement(
          "video"
        );

      v.preload =
        "metadata";

      v.onloadedmetadata =
        () => {

          resolve({
            width:
              v.videoWidth,

            height:
              v.videoHeight,

            duration:
              v.duration,

            fps:
              "FPS not read by browser"
          });

          URL.revokeObjectURL(
            url
          );
        };


      v.onerror =
        () => {

          resolve({
            width: 0,
            height: 0,
            duration: 0,
            fps: "—"
          });

          URL.revokeObjectURL(
            url
          );
        };


      v.src =
        url;
    }
  );
}


// ========================================
// UPDATE PROCESS BUTTON
// ========================================

function updateProcessButton() {

  if (!currentUser) {

    processBtn.disabled =
      true;

    processText.textContent =
      "LOGIN TO PATCH";

    return;
  }


  if (!isPremium) {

    processBtn.disabled =
      true;

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


// ========================================
// SELECT VIDEO
// ========================================

function selectFile(
  file
) {

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


  if (!currentUser) {

    showError(
      "Please login first."
    );

    return;
  }


  if (!isPremium) {

    showError(
      "Premium access is required to patch videos."
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
    URL.createObjectURL(
      file
    );


  fileName.textContent =
    file.name;


  fileSize.textContent =
    formatBytes(
      file.size
    );


  readVideoInfo(
    file
  ).then(
    (info) => {

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
    }
  );


  filePanel.classList.remove(
    "hidden"
  );


  processBtn.disabled =
    false;


  processText.textContent =
    "PATCH VIDEO";
}


// ========================================
// REMOVE VIDEO
// ========================================

function removeFile() {

  selectedFile =
    null;

  resetOutput();

  filePanel.classList.add(
    "hidden"
  );

  fileInput.value =
    "";


  if (preview.src) {

    URL.revokeObjectURL(
      preview.src
    );

    preview.removeAttribute(
      "src"
    );

    preview.load();
  }


  updateProcessButton();
}


// ========================================
// CREATE PROFILE
// ========================================

async function createProfile(
  user
) {

  if (!user) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("profiles")
      .insert({
        id:
          user.id,

        email:
          user.email,

        is_premium:
          false
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
// LOAD PREMIUM STATUS
// ========================================

async function loadPremiumStatus(
  user
) {

  currentUser =
    user || null;


  if (!user) {

    isPremium =
      false;

    loginBox.classList.remove(
      "hidden"
    );

    accountBox.classList.add(
      "hidden"
    );

    updateProcessButton();

    return;
  }


  loginBox.classList.add(
    "hidden"
  );

  accountBox.classList.remove(
    "hidden"
  );


  accountEmail.textContent =
    user.email ||
    "User";


  let {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(
        "is_premium,premium_until"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile read error:",
      error
    );

    premiumStatus.textContent =
      "Premium status unavailable";

    isPremium =
      false;

    updateProcessButton();

    return;
  }


  if (!data) {

    await createProfile(
      user
    );


    isPremium =
      false;


    premiumStatus.textContent =
      "🔒 Premium: Pending";


    updateProcessButton();

    return;
  }


  let active =
    data.is_premium === true;


  // ====================================
  // CHECK PREMIUM EXPIRATION
  // ====================================

  if (
    active &&
    data.premium_until
  ) {

    const until =
      new Date(
        data.premium_until
      );


    if (
      Number.isFinite(
        until.getTime()
      ) &&
      until < new Date()
    ) {

      active =
        false;
    }
  }


  isPremium =
    active;


  if (active) {

    premiumStatus.textContent =
      "✅ Premium: Active";

  } else {

    premiumStatus.textContent =
      "🔒 Premium: Pending";
  }


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


    if (
      !email ||
      !password
    ) {

      authStatus.textContent =
        "Please enter email and password.";

      return;
    }


    if (
      password.length < 6
    ) {

      authStatus.textContent =
        "Password must be at least 6 characters.";

      return;
    }


    signUpBtn.disabled =
      true;

    loginBtn.disabled =
      true;


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
          "Account created. Check your email and confirm your account before login.";
      }


    } catch (err) {

      console.error(
        "Sign up error:",
        err
      );


      authStatus.textContent =
        err?.message ||
        "Sign up failed.";

    } finally {

      signUpBtn.disabled =
        false;

      loginBtn.disabled =
        false;
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


    if (
      !email ||
      !password
    ) {

      authStatus.textContent =
        "Please enter email and password.";

      return;
    }


    signUpBtn.disabled =
      true;

    loginBtn.disabled =
      true;


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

      console.error(
        "Login error:",
        err
      );


      authStatus.textContent =
        err?.message ||
        "Login failed.";

    } finally {

      signUpBtn.disabled =
        false;

      loginBtn.disabled =
        false;
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


    currentUser =
      null;

    isPremium =
      false;


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


// ========================================
// AUTH STATE CHANGE
// ========================================

supabase.auth.onAuthStateChange(
  async (
    _event,
    session
  ) => {

    await loadPremiumStatus(
      session?.user ||
      null
    );
  }
);


// ========================================
// INITIAL SESSION
// ========================================

const {
  data: {
    session
  }
} =
  await supabase.auth.getSession();


await loadPremiumStatus(
  session?.user ||
  null
);


// ========================================
// SELECT BUTTON
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

    const file =
      fileInput.files?.[0];


    if (file) {

      selectFile(
        file
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
// PATCH VIDEO
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


    processBtn.disabled =
      true;

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

      // Give mobile browser
      // a small breathing time.
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            30
          )
      );


      // ==================================
      // READ VIDEO
      // ==================================

      const source =
        await selectedFile.arrayBuffer();


      setProgress(
        18,
        "Normalizing MP4 container…"
      );


      const inputBytes =
        new Uint8Array(
          source
        );


      const inputView =
        new DataView(
          source
        );


      // ==================================
      // NORMALIZE
      // ==================================

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


      // ==================================
      // INFLATE
      // ==================================

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


      // ==================================
      // CREATE OUTPUT
      // ==================================

      const finalBuffer =
        inflated.newBuffer;


      outputBlob =
        new Blob(
          [
            finalBuffer
          ],
          {
            type:
              "video/mp4"
          }
        );


      // ==================================
      // CREATE DOWNLOAD URL IMMEDIATELY
      // ==================================

      outputUrl =
        URL.createObjectURL(
          outputBlob
        );


      // ==================================
      // OUTPUT NAME
      // ==================================

      const base =
        selectedFile.name.replace(
          /\.(mp4|mov)$/i,
          ""
        );


      outputName =
        `${base}_TL-NoBlur.mp4`;


      // ==================================
      // COMPLETE
      // ==================================

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


      if (outputBlob) {

        processText.textContent =
          "PATCH AGAIN";

      } else {

        processText.textContent =
          "PATCH VIDEO";
      }
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
      download
