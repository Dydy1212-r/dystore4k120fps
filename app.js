import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import { normalizeContainer } from
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs";

import { inflateSampleTableVideo } from
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs";


// ============================================================
// SUPABASE
// ============================================================

// ⚠️ ដាក់ Supabase URL របស់អ្នក
const SUPABASE_URL = "https://glpkadgmsaozmcebyrxw.supabase.co";

// ⚠️ ដាក់ Supabase ANON / PUBLISHABLE KEY របស់អ្នក
const SUPABASE_ANON_KEY = "sb_publishable_UYD86Z2gQD5o8BMfuP5IHw__bIcUX0C";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");

const authStatus = document.getElementById("authStatus");

const videoInput = document.getElementById("videoInput");
const videoSelect = document.getElementById("videoSelect");
const fileName = document.getElementById("fileName");

const patchBtn = document.getElementById("patchBtn");


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let selectedVideo = null;


// ============================================================
// STATUS
// ============================================================

function setStatus(message, type = "normal") {

  authStatus.textContent = message;

  if (type === "error") {
    authStatus.style.color = "#ff5555";
  }

  else if (type === "success") {
    authStatus.style.color = "#8fff8f";
  }

  else {
    authStatus.style.color = "#777";
  }
}


// ============================================================
// AUTH BUTTON STATE
// ============================================================

function updateAuthUI() {

  if (currentUser) {

    signupBtn.textContent = "LOGGED IN";

    signupBtn.disabled = true;

    signupBtn.style.opacity = "0.5";

    loginBtn.textContent = "LOGOUT";

    loginBtn.disabled = false;

    patchBtn.textContent = selectedVideo
      ? "PATCH VIDEO"
      : "SELECT VIDEO";

    patchBtn.disabled = !selectedVideo;

  }

  else {

    signupBtn.textContent = "SIGN UP";

    signupBtn.disabled = false;

    signupBtn.style.opacity = "1";

    loginBtn.textContent = "LOGIN";

    patchBtn.textContent = "LOGIN TO PATCH";

    patchBtn.disabled = true;
  }
}


// ============================================================
// SIGN UP
// ============================================================

signupBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {

    setStatus(
      "Please enter email and password.",
      "error"
    );

    return;
  }

  if (password.length < 6) {

    setStatus(
      "Password must be at least 6 characters.",
      "error"
    );

    return;
  }


  signupBtn.disabled = true;
  setStatus("Creating account...");


  try {

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password
      });


    if (error) {
      throw error;
    }


    if (data.user && !data.session) {

      setStatus(
        "Account created. Check your email to confirm.",
        "success"
      );

    }

    else {

      setStatus(
        "Account created successfully.",
        "success"
      );

    }

  }

  catch (error) {

    console.error(error);

    setStatus(
      error.message || "Sign up failed.",
      "error"
    );

  }

  finally {

    signupBtn.disabled = false;

    updateAuthUI();

  }

});


// ============================================================
// LOGIN / LOGOUT
// ============================================================

loginBtn.addEventListener("click", async () => {


  // --------------------------
  // LOGOUT
  // --------------------------

  if (currentUser) {

    const { error } =
      await supabase.auth.signOut();

    if (error) {

      setStatus(
        error.message,
        "error"
      );

      return;
    }

    currentUser = null;

    setStatus(
      "Logged out.",
      "success"
    );

    updateAuthUI();

    return;
  }


  // --------------------------
  // LOGIN
  // --------------------------

  const email = emailInput.value.trim();
  const password = passwordInput.value;


  if (!email || !password) {

    setStatus(
      "Please enter email and password.",
      "error"
    );

    return;
  }


  loginBtn.disabled = true;

  setStatus("Logging in...");


  try {

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });


    if (error) {
      throw error;
    }


    currentUser = data.user;


    setStatus(
      `Welcome ${currentUser.email}`,
      "success"
    );


    updateAuthUI();

  }

  catch (error) {

    console.error(error);

    setStatus(
      error.message || "Login failed.",
      "error"
    );

  }

  finally {

    loginBtn.disabled = false;

    updateAuthUI();

  }

});


// ============================================================
// AUTH SESSION
// ============================================================

async function loadSession() {

  try {

    const {
      data,
      error
    } = await supabase.auth.getSession();


    if (error) {
      throw error;
    }


    currentUser =
      data.session?.user || null;


    updateAuthUI();


    if (currentUser) {

      setStatus(
        `Logged in as ${currentUser.email}`,
        "success"
      );

    }

  }

  catch (error) {

    console.error(
      "Session error:",
      error
    );

  }

}


supabase.auth.onAuthStateChange(
  (_event, session) => {

    currentUser =
      session?.user || null;

    updateAuthUI();

  }
);


// ============================================================
// VIDEO SELECT
// ============================================================

videoInput.addEventListener(
  "change",
  () => {

    const file =
      videoInput.files?.[0];


    if (!file) {

      selectedVideo = null;

      fileName.style.display = "none";

      fileName.textContent = "";

      updateAuthUI();

      return;
    }


    const name =
      file.name.toLowerCase();


    const valid =
      name.endsWith(".mp4") ||
      name.endsWith(".mov") ||
      file.type === "video/mp4" ||
      file.type === "video/quicktime";


    if (!valid) {

      alert(
        "Please select an MP4 or MOV video."
      );

      videoInput.value = "";

      selectedVideo = null;

      fileName.style.display = "none";

      updateAuthUI();

      return;
    }


    selectedVideo = file;


    fileName.style.display = "block";

    fileName.textContent =
      `Selected: ${file.name}`;


    if (currentUser) {

      patchBtn.textContent =
        "PATCH VIDEO";

      patchBtn.disabled = false;

    }

  }
);


// ============================================================
// VIDEO SELECT AREA
// ============================================================

videoSelect.addEventListener(
  "dragover",
  (event) => {

    event.preventDefault();

    videoSelect.style.borderColor =
      "#777";

  }
);


videoSelect.addEventListener(
  "dragleave",
  () => {

    videoSelect.style.borderColor =
      "#383838";

  }
);


videoSelect.addEventListener(
  "drop",
  (event) => {

    event.preventDefault();

    videoSelect.style.borderColor =
      "#383838";


    const file =
      event.dataTransfer.files?.[0];


    if (!file) return;


    const name =
      file.name.toLowerCase();


    if (
      !name.endsWith(".mp4") &&
      !name.endsWith(".mov")
    ) {

      alert(
        "Please select MP4 or MOV."
      );

      return;
    }


    selectedVideo = file;


    fileName.style.display = "block";

    fileName.textContent =
      `Selected: ${file.name}`;


    if (currentUser) {

      patchBtn.textContent =
        "PATCH VIDEO";

      patchBtn.disabled = false;

    }

  }
);


// ============================================================
// PREMIUM PLAN
// ============================================================

document.querySelectorAll(".plan")
  .forEach((plan) => {

    plan.addEventListener(
      "click",
      async () => {

        const planName =
          plan.dataset.plan;

        const price =
          plan.dataset.price;


        if (planName === "free") {

          alert(
            "Free access: 2 Days"
          );

          return;
        }


        if (!currentUser) {

          alert(
            "Please LOGIN first to purchase Premium."
          );

          emailInput.focus();

          return;
        }


        alert(
          `Selected Premium plan\n\n` +
          `Plan: ${planName}\n` +
          `Price: $${price}\n\n` +
          `Payment system will be connected next.`
        );

      }
    );

  });


// ============================================================
// MP4 / MOV HELPERS
// ============================================================

function isSupportedVideo(file) {

  if (!file) return false;

  const name =
    file.name.toLowerCase();

  return (
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    file.type === "video/mp4" ||
    file.type === "video/quicktime"
  );

}


function getOutputName(file) {

  const original =
    file.name;

  const dot =
    original.lastIndexOf(".");


  const base =
    dot > 0
      ? original.substring(0, dot)
      : original;


  return `${base}_TL-NoBlur.mp4`;

}


// ============================================================
// DOWNLOAD
// ============================================================

function downloadVideo(
  buffer,
  filename
) {

  const blob =
    new Blob(
      [buffer],
      {
        type: "video/mp4"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    filename;


  document.body.appendChild(link);

  link.click();

  link.remove();


  setTimeout(() => {

    URL.revokeObjectURL(url);

  }, 2000);

}


// ============================================================
// PATCH VIDEO
// ============================================================

async function patchVideo(file) {

  if (!isSupportedVideo(file)) {

    throw new Error(
      "Unsupported video format."
    );

  }


  // Read video bytes

  const inputBuffer =
    await file.arrayBuffer();


  const inputBytes =
    new Uint8Array(
      inputBuffer
    );


  const inputView =
    new DataView(
      inputBuffer
    );


  // --------------------------
  // NORMALIZE MP4 CONTAINER
  // --------------------------

  setStatus(
    "Normalizing video..."
  );


  const normalized =
    normalizeContainer(
      inputBytes,
      inputView
    );


  if (!normalized.valid) {

    throw new Error(
      "Invalid MP4/MOV container."
    );

  }


  let finalBytes =
    normalized.newBytes;

  let finalView =
    normalized.newView;


  // --------------------------
  // INFLATE SAMPLE TABLE 10×
  // --------------------------

  setStatus(
    "Applying Inflate 10×..."
  );


  const inflated =
    inflateSampleTableVideo(
      finalBytes,
      finalView,
      10
    );


  if (
    !inflated ||
    !inflated.newBuffer
  ) {

    throw new Error(
      "Inflate processing failed."
    );

  }


  return inflated.newBuffer;

}


// ============================================================
// PATCH BUTTON
// ============================================================

patchBtn.addEventListener(
  "click",
  async () => {


    // --------------------------
    // CHECK LOGIN
    // --------------------------

    if (!currentUser) {

      setStatus(
        "Please login first.",
        "error"
      );

      return;
    }


    // --------------------------
    // CHECK VIDEO
    // --------------------------

    if (!selectedVideo) {

      setStatus(
        "Please select a video first.",
        "error"
      );

      return;
    }


    patchBtn.disabled = true;

    patchBtn.textContent =
      "PROCESSING...";


    try {

      setStatus(
        "Processing video..."
      );


      const outputBuffer =
        await patchVideo(
          selectedVideo
        );


      const outputName =
        getOutputName(
          selectedVideo
        );


      // --------------------------
      // DOWNLOAD
      // --------------------------

      downloadVideo(
        outputBuffer,
        outputName
      );


      setStatus(
        "Patch completed successfully.",
        "success"
      );


      patchBtn.textContent =
        "PATCH VIDEO";


    }

    catch (error) {

      console.error(
        "Patch error:",
        error
      );


      setStatus(
        error.message ||
        "Video processing failed.",
        "error"
      );


      patchBtn.textContent =
        "PATCH VIDEO";

    }

    finally {

      patchBtn.disabled =
        !currentUser ||
        !selectedVideo;

    }

  }
);


// ============================================================
// INITIALIZE
// ============================================================

loadSession();

updateAuthUI();
