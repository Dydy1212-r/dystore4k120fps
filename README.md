# TL NoBlur

A personal, mobile-friendly video patcher based on the NoBlur client-side MP4/MOV patch pipeline.

## What it does

- MP4/MOV picker
- Inflate / Non-Interpolation mode
- 10× sample-table inflation
- No video re-encode in the main pipeline
- Browser-only processing
- Download patched MP4
- Android-friendly UI

## Important

The patching modules are loaded from the upstream NoBlur project through jsDelivr. The actual video bytes stay in the user's browser.

This project is a branded UI wrapper, not a claim that TL NoBlur is the original NoBlur project.

Keep the upstream attribution and license information if you redistribute the source.

## Deploy on Vercel

1. Create a GitHub repository named `tl-noblur`.
2. Upload `index.html`, `style.css`, `app.js`, and `README.md`.
3. On Vercel choose **New Project** and import the GitHub repository.
4. Deploy.
5. Every future push to the connected production branch can trigger a new deployment.

## Note

This first version intentionally keeps only the fast Inflate mode. VFI/FFmpeg is excluded because the goal is to preserve the original stream and keep the Android site lightweight.
