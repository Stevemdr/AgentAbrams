---
title: "Building a Video Sanitizer with OCR and OpenCV"
description: "How I built an automated pipeline that scans video frames for sensitive data using Tesseract OCR, then blurs it with OpenCV before publishing to YouTube."
date: 2026-02-25
tags: ["opencv", "ocr", "python", "video", "security"]
---

When you're building in public, every screencast is a potential data leak. Terminal windows, dashboard UIs, config files — they all flash by in a video, and any one of them could contain credentials, internal names, or business data you never meant to share.

So I built a pipeline that watches my own videos before I publish them.

## The Problem

I record walkthroughs of my development environment constantly. Claude Code sessions, dashboard tours, agent infrastructure demos. These recordings are raw — they capture whatever's on screen, including things that should never hit YouTube.

The list of sensitive patterns is long: IP addresses, API keys, vendor names, database connection strings, internal pricing data. Over 200 patterns, all ported from the text sanitizer I already use for blog posts.

## The Approach

The pipeline runs in seven stages:

1. **Frame extraction** — FFmpeg pulls one frame per second from the video
2. **OCR scanning** — Tesseract reads every frame, enhanced with contrast/brightness/sharpening for dark-theme terminals
3. **Pattern matching** — Each OCR result runs against 214 regex patterns (company names, credentials, vendor data, pricing fields)
4. **Blur map** — Detections get converted to time-based blur regions with padding (1 second before and after each detection, 20px spatial padding)
5. **Blur application** — OpenCV processes every frame, applying Gaussian blur to active regions
6. **Voiceover** — Edge TTS generates two-voice narration synced to video timestamps
7. **Final mux** — FFmpeg combines sanitized video + voiceover + watermark

## What I Learned

**OCR on dark themes is hard.** Default Tesseract struggles with light text on dark backgrounds. Preprocessing with PIL — cranking contrast to 2x, brightness to 1.3x, then sharpening — made detection reliable.

**Sliding window detection catches multi-word patterns.** A single-word scan would miss multi-word company names if OCR splits them across words. Running 2-5 word sliding windows over the OCR data catches compound names reliably.

**FFmpeg filter chains break at scale.** My first approach used ffmpeg's split/crop/blur/overlay chain per region. It works for 2-3 regions but collapses with 8+. OpenCV frame-by-frame processing is slower but handles any number of regions cleanly.

**Verification is the pipeline.** After processing, I re-run the exact same OCR scan on the output. Zero detections on the sanitized video means the blur worked. The same tool that finds problems validates fixes.

## Results

Scanned five videos (287 total frames). Four were clean. One had a platform name visible in a dashboard for 8 seconds — 40 detection hits across 8 frames. After processing: zero detections on re-scan.

The whole pipeline — extract, scan, blur, mux — runs in about 2 minutes for a 50-second video. Good enough for a pre-publish gate.

## Watch the Video

<div class="youtube-embed">
  <iframe src="https://www.youtube.com/embed/Ug0CYFPv1Xs" title="Parallel Agents at Scale" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

[**Subscribe to @AgentAbrams on YouTube**](https://www.youtube.com/@AgentAbrams) for new videos every week.

---

## Ask Me Anything

Got questions about OCR pipelines, video processing, or building content safety tools? Hit me up:

- [YouTube — @AgentAbrams](https://www.youtube.com/@AgentAbrams)
- [X — @goodquestionai](https://x.com/goodquestionai)
- [Bluesky — @agentabrams](https://bsky.app/profile/agentabrams.bsky.social)
- [goodquestion.ai](https://goodquestion.ai)
