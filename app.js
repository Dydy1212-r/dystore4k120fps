// TL NoBlur
// The patching modules are loaded from the upstream NoBlur repository via jsDelivr.
// Video bytes are processed locally in the user's browser; they are not uploaded.

const { normalizeContainer } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-normalize.mjs"
);
const { inflateSampleTableVideo } = await import(
  "https://cdn.jsdelivr.net/gh/irgifebry/NoBlur@main/src/mp4-inflate.mjs"
);

const $ = (id) => document.getElementById(id);
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

let selectedFile = null;
let outputBlob = null;
let outputName = "";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B","KB","MB","GB"];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 2 : 0)} ${units[i]}`;
}

function setProgress(value, text) {
  const n = Math.max(0, Math.min(100, Math.round(value)));
  percent.textContent = `${n}%`;
  barFill.style.width = `${n}%`;
  if (text) status.textContent = text;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

function resetOutput() {
  outputBlob = null;
  outputName = "";
  result.classList.add("hidden");
}

async function readVideoInfo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const fps = "FPS not read by browser";
      resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration, fps });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      resolve({ width: 0, height: 0, duration: 0, fps: "—" });
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
}

function selectFile(file) {
  if (!file) return;
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".mp4") && !lower.endsWith(".mov")) {
    showError("Please select an MP4 or MOV video.");
    return;
  }
  selectedFile = file;
  resetOutput();
  clearError();

  if (preview.src) URL.revokeObjectURL(preview.src);
  preview.src = URL.createObjectURL(file);

  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);

  readVideoInfo(file).then((info) => {
    const dims = info.width && info.height ? `${info.width}×${info.height}` : "Video";
    const dur = info.duration ? `${info.duration.toFixed(1)}s` : "—";
    fileStats.textContent = `${dims} • ${dur}`;
  });

  filePanel.classList.remove("hidden");
  processBtn.disabled = false;
  processText.textContent = "PATCH VIDEO";
}

function removeFile() {
  selectedFile = null;
  resetOutput();
  filePanel.classList.add("hidden");
  processBtn.disabled = true;
  fileInput.value = "";
  if (preview.src) {
    URL.revokeObjectURL(preview.src);
    preview.removeAttribute("src");
    preview.load();
  }
}

pickBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files?.[0]) selectFile(fileInput.files[0]);
});
removeBtn.addEventListener("click", removeFile);

processBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  clearError();
  resetOutput();

  processBtn.disabled = true;
  spinner.classList.remove("hidden");
  progressBox.classList.remove("hidden");
  setProgress(2, "Reading video…");

  try {
    // Avoid accidental UI freeze on mobile before the large ArrayBuffer allocation.
    await new Promise((r) => setTimeout(r, 30));

    const source = await selectedFile.arrayBuffer();
    setProgress(18, "Normalizing MP4 container…");

    const inputBytes = new Uint8Array(source);
    const inputView = new DataView(source);

    const normalized = normalizeContainer(inputBytes, inputView);
    if (!normalized.valid) {
      throw new Error("Invalid MP4/MOV container: moov box was not found.");
    }

    setProgress(42, "Applying 10× sample-table inflation…");

    // This is the upstream NoBlur non-interpolation pipeline.
    const inflated = inflateSampleTableVideo(
      normalized.newBytes,
      normalized.newView,
      10
    );

    setProgress(88, "Building download file…");

    const finalBuffer = inflated.newBuffer;
    outputBlob = new Blob([finalBuffer], { type: "video/mp4" });

    const base = selectedFile.name.replace(/\.(mp4|mov)$/i, "");
    outputName = `${base}_TL-NoBlur.mp4`;

    setProgress(100, "Complete");
    resultMeta.textContent = `${formatBytes(outputBlob.size)} • original video stream not re-encoded`;
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
    processText.textContent = outputBlob ? "PATCH AGAIN" : "PATCH VIDEO";
  }
});

downloadBtn.addEventListener("click", () => {
  if (!outputBlob) return;
  const url = URL.createObjectURL(outputBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = outputName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});
