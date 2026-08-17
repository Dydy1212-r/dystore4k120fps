import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===============================
// SUPABASE
// ===============================
const SUPABASE_URL = "https://glpkadgmsaozmcebyrxw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UYD86Z2gQD5o8BMfuP5IHw__bIcUX0C";

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

// ===============================
// SUPABASE ELEMENTS
// ===============================
const $ = (id) => document.getElementById(id);

const authEmail = $("authEmail");
const authPassword = $("authPassword");
const signUpBtn = $("signUpBtn");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");

const loginBox = $("loginBox");
const accountBox = $("accountBox");
const accountEmail = $("accountEmail");
const premiumStatus = $("premiumStatus");
const authStatus = $("authStatus");

// ===============================
// VIDEO ELEMENTS
// ===============================
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

// ===============================
// STATE
// ===============================
let selectedFile = null;
let outputBlob = null;
let outputName = "";

let currentUser = null;
let currentProfile = null;

// ===============================
// LOAD PATCH MODULES
// ===============================
const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);

const { inflateSampleTableVideo } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs"
);

// ===============================
// HELPERS
// ===============================
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i ? 2 : 0)} ${units[i]}`;
}

function setProgress(value, text) {
  const n = Math.max(0, Math.min(100, Math.round(value)));

  percent.textContent = `${n}%`;
  barFill.style.width = `${n}%`;

  if (text) {
    status.textContent = text;
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function setAuthStatus(message, ok = false) {
  authStatus.textContent = message;
  authStatus.style.color = ok ? "#6ee7b7" : "#ff8b8b";
}

function resetOutput() {
  outputBlob = null;
  outputName = "";
  result.classList.add("hidden");
}

// ===============================
// PREMIUM CHECK
// ===============================
function hasActivePremium(profile) {
  if (!profile) return false;

  if (!profile.is_premium) {
    return false;
  }

  if (!profile.premium_until) {
    return false;
  }

  return new Date(profile.premium_until).getTime() > Date.now();
}

function premiumText(profile) {
  if (!profile) {
    return "🔒 Premium: Not available";
  }

  const until = profile.premium_until
    ? new Date(profile.premium_until)
    : null;

  if (
    profile.is_premium &&
    until &&
    until.getTime() > Date.now()
  ) {
    return `🔓 Premium: ${profile.plan || "Free"} • until ${until.toLocaleDateString()}`;
  }

  return "🔒 Premium expired";
}

// ===============================
// LOAD PROFILE
// ===============================
async function loadProfile(user) {
  if (!user) {
    currentProfile = null;
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,plan,is_premium,premium_until")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile error:", error);
    throw error;
  }

  currentProfile = data;
  return data;
}

// ===============================
// UPDATE UI
// ===============================
function updateAuthUI() {
  if (currentUser) {
    loginBox.classList.add("hidden");
    accountBox.classList.remove("hidden");

    accountEmail.textContent =
      currentUser.email || "Unknown email";

    premiumStatus.textContent =
      premiumText(currentProfile);

    if (hasActivePremium(currentProfile)) {
      processText.textContent = selectedFile
        ? "PATCH VIDEO"
        : "SELECT VIDEO";
    } else {
      processText.textContent = "PREMIUM REQUIRED";
      processBtn.disabled = true;
    }

  } else {
    loginBox.classList.remove("hidden");
    accountBox.classList.add("hidden");

    accountEmail.textContent = "";
    premiumStatus.textContent = "";

    processBtn.disabled = true;
    processText.textContent = "LOGIN TO PATCH";
  }
}

// ===============================
// SIGN UP
// ===============================
signUpBtn.addEventListener("click", async () => {
  clearError();
  setAuthStatus("Creating account...");

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    setAuthStatus("Please enter email and password.");
    return;
  }

  if (password.length < 6) {
    setAuthStatus("Password must be at least 6 characters.");
    return;
  }

  signUpBtn.disabled = true;
  loginBtn.disabled = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      currentUser = data.user;

      await loadProfile(currentUser);

      setAuthStatus("Account created successfully.", true);

      updateAuthUI();

    } else {
      setAuthStatus(
        "Account created. Please check your email to confirm."
      );
    }

  } catch (err) {
    console.error(err);
    setAuthStatus(err.message || "Sign up failed.");
  } finally {
    signUpBtn.disabled = false;
    loginBtn.disabled = false;
  }
});

// ===============================
// LOGIN
// ===============================
loginBtn.addEventListener("click", async () => {
  clearError();
  setAuthStatus("Logging in...");

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    setAuthStatus("Please enter email and password.");
    return;
  }

  loginBtn.disabled = true;
  signUpBtn.disabled = true;

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

    await loadProfile(currentUser);

    setAuthStatus("Login successful.", true);

    updateAuthUI();

  } catch (err) {
    console.error(err);

    if (
      err.message &&
      err.message.toLowerCase().includes("email not confirmed")
    ) {
      setAuthStatus(
        "Email is not confirmed. Turn OFF Confirm email in Supabase."
      );
    } else {
      setAuthStatus(
        err.message || "Invalid login credentials."
      );
    }

  } finally {
    loginBtn.disabled = false;
    signUpBtn.disabled = false;
  }
});

// ===============================
// LOGOUT
// ===============================
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();

  currentUser = null;
  currentProfile = null;

  setAuthStatus("");
  removeFile();

  updateAuthUI();
});

// ===============================
// SESSION
// ===============================
supabase.auth.onAuthStateChange(
  async (_event, session) => {
    currentUser = session?.user || null;

    if (currentUser) {
      try {
        await loadProfile(currentUser);
      } catch (err) {
        console.error(err);
      }
    } else {
      currentProfile = null;
    }

    updateAuthUI();
  }
);

// ===============================
// INITIAL SESSION
// ===============================
async function initAuth() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  currentUser = session?.user || null;

  if (currentUser) {
    try {
      await loadProfile(currentUser);
    } catch (err) {
      console.error(err);
    }
  }

  updateAuthUI();
}

await initAuth();

// ===============================
// VIDEO INFO
// ===============================
async function readVideoInfo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");

    v.preload = "metadata";

    v.onloadedmetadata = () => {
      resolve({
        width: v.videoWidth,
        height: v.videoHeight,
        duration: v.duration
      });

      URL.revokeObjectURL(url);
    };

    v.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        duration: 0
      });

      URL.revokeObjectURL(url);
    };

    v.src = url;
  });
}

// ===============================
// SELECT FILE
// ===============================
function selectFile(file) {
  if (!file) return;

  if (!currentUser) {
    showError("Please login first.");
    return;
  }

  if (!hasActivePremium(currentProfile)) {
    showError(
      "Premium access is required. Please choose a plan."
    );
    return;
  }

  const lower = file.name.toLowerCase();

  if (
    !lower.endsWith(".mp4") &&
    !lower.endsWith(".mov")
  ) {
    showError("Please select an MP4 or MOV video.");
    return;
  }

  selectedFile = file;

  resetOutput();
  clearError();

  if (preview.src) {
    URL.revokeObjectURL(preview.src);
  }

  preview.src = URL.createObjectURL(file);

  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);

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
  processText.textContent = "PATCH VIDEO";
}

// ===============================
// REMOVE FILE
// ===============================
function removeFile() {
  selectedFile = null;

  resetOutput();

  filePanel.classList.add("hidden");

  processBtn.disabled =
    !currentUser ||
    !hasActivePremium(currentProfile);

  processText.textContent =
    currentUser && hasActivePremium(currentProfile)
      ? "SELECT VIDEO"
      : "LOGIN TO PATCH";

  fileInput.value = "";

  if (preview.src) {
    URL.revokeObjectURL(preview.src);

    preview.removeAttribute("src");
    preview.load();
  }
}

pickBtn.addEventListener("click", () => {
  if (!currentUser) {
    showError("Please login first.");
    return;
  }

  if (!hasActivePremium(currentProfile)) {
    showError(
      "Premium access is required to upload and patch videos."
    );
    return;
  }

  fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files?.[0]) {
    selectFile(fileInput.files[0]);
  }
});

removeBtn.addEventListener("click", removeFile);

// ===============================
// PATCH VIDEO
// ===============================
processBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  if (!currentUser) {
    showError("Please login first.");
    return;
  }

  if (!hasActivePremium(currentProfile)) {
    showError(
      "Premium access is required to patch videos."
    );
    return;
  }

  clearError();
  resetOutput();

  processBtn.disabled = true;
  spinner.classList.remove("hidden");

  progressBox.classList.remove("hidden");

  setProgress(2, "Reading video…");

  try {
    await new Promise((r) => setTimeout(r, 30));

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
        { type: "video/mp4" }
      );

    const base =
      selectedFile.name.replace(
        /\.(mp4|mov)$/i,
        ""
      );

    outputName =
      `${base}_TL-NoBlur.mp4`;

    setProgress(100, "Complete");

    resultMeta.textContent =
      `${formatBytes(outputBlob.size)} • original video stream not re-encoded`;

    result.classList.remove("hidden");

  } catch (err) {
    console.error(err);

    showError(
      `Patch failed: ${err?.message || String(err)}`
    );

    setProgress(0, "Failed");

  } finally {
    processBtn.disabled = !selectedFile;

    spinner.classList.add("hidden");

    processText.textContent =
      outputBlob
        ? "PATCH AGAIN"
        : "PATCH VIDEO";
  }
});

// ===============================
// DOWNLOAD
// ===============================
downloadBtn.addEventListener("click", () => {
  if (!outputBlob) return;

  const url =
    URL.createObjectURL(outputBlob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = outputName;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
});
