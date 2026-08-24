---
name: rec-training-video
description: "Produce a narrated, captioned, Rec-branded training/walkthrough video of the rec.us admin (or any logged-in rec.us page) from a plain-language prompt. Use whenever someone asks for a training video, walkthrough video, screen recording, demo video, 'how-to' video, or Loom-style tutorial of a Rec feature or admin section — e.g. 'make a training video of the Finance settings', 'record a walkthrough of the memberships page', 'demo video for the check-in flow'. The skill asks for a login, which site to record, and a plain-language narrative of what to capture, then logs in, clicks through the real pages, adds an ElevenLabs voiceover synced to on-screen captions, and wraps it in a Rec title card and a 'Thanks for watching / partnersupport@rec.us' outro. Outputs an MP4 for the requester to review."
---

# Rec Training Video

Turns a plain-language request like *"walk through the Finance settings, about two minutes"*
into a finished MP4: a **Rec title card** → a **narrated + captioned click-through** of the
real admin pages → a **narrated outro splash** with the Customer Experience contact.

You gather a few inputs from the requester, log in, learn how the pages actually work,
write the narration, and run a deterministic builder (`make-video.js`). Production settings
(voice, tempo, fonts, logo, cards) are fixed in `config.json` so every video looks and
sounds identical. **The requester reviews the finished video for correctness** — so keep
narration factual and flag anything you were unsure about when you deliver.

## Step 00 — Environment network access must be FULL (check this before anything else)

**Do this before intake.** The builder cannot make a video without reaching
`api.elevenlabs.io` (narration) and `rec.us` (recording). If the session's environment
does not allow that egress, the build dies inside `make-video.js` at the first TTS call,
where it reads like a code or key bug and is neither.

```bash
bash scripts/check-egress.sh      # exits 0 = safe to build, 1 = blocked, with the fix
```

If it reports BLOCKED, stop and fix the environment — do not start writing a spec:

1. At **claude.ai/code**, set the environment's **network access to FULL**.
2. **Start a NEW session.** The policy is applied when the session's container is created,
   so a session already running keeps the policy it started with. Flipping the setting does
   **not** unblock the session you are in. (Observable: `HTTPS_PROXY`'s port is per-container
   and changes across sessions — that proxy is stood up with the container, not reloaded.)
3. Re-run the check in the new session.

Still blocked in a fresh session on FULL ⇒ the denial is above the environment (an
account/org-level egress policy) and needs an org owner, not an environment change.

### Access to this repo is NOT the same as access to the network (learned 2026-08-24)

A teammate spent a session blocked here while using this repo, this skill, and the shared
ElevenLabs key. **Cloning the repo carries the skill and the bundled key; it cannot carry an
egress policy.** Whoever runs the session runs it in *their own* account's environment, with
whatever network policy that environment was created with. So "it works for Dan" tells you
nothing about your session, and a `403` at the proxy is never a key problem — the proxy
blocks on hostname before any key is sent.

Do not treat a proxy `403`/`407` as retryable, and do not route around it: it is a policy
denial, and the fix is the three steps above.

## Step 0 — Intake (ask the requester first)

Before doing anything else, collect these. Ask for them together in one message; fill
sensible defaults where the request already answered one.

1. **Login** — the rec.us **email and password** to record with. These are used only for
   this build, passed to the builder via `REC_EMAIL` / `REC_PASSWORD` env vars, and **never
   written to disk or committed**. Nothing is bundled. Prefer a sandbox/admin login with no
   real PII. (The shared ElevenLabs narration key *is* bundled, so don't ask for that.)
2. **Which site** — default `https://www.rec.us` (production). If they name a different
   rec.us environment (sandbox/staging), use that host. Also get the **org** — either the
   admin URL they want (`/admin/o/<uuid>/…`) or the org name (resolve the UUID with the
   `search_organizations` MCP tool).
3. **Example link (if applicable)** — ask for a URL to the exact part of Rec the video is
   about (e.g. the settings page or a specific record). If they give one, it's your `start`
   URL and removes all guesswork about which org/section they mean. If there's no single
   page (a multi-step flow), just take the narrative.
4. **Narrative** — a plain-language description of what to record: which section/flow, what
   to click into, and what to explain. This is the script outline.
5. **How long** — a rough target (e.g. "~90 seconds", "2–3 minutes"). Use it to decide how
   many sections to include and how much to say per section; pacing auto-fits each section
   to its narration, so length ≈ sum of what you write.
6. **Voice** — which narrator to use. Default **Adam** (deep, neutral male — matches the
   existing Finance / General Ledger / Meet Seb videos, so keep it for anything in that
   series). Offer these presets and pass the chosen ID via the spec's `voiceId` (or
   `REC_TTS_VOICE_ID`); the requester may also paste any ElevenLabs voice ID:
   | Voice | Style | voiceId |
   |---|---|---|
   | Adam (default) | deep, neutral male | `pNInz6obpgDQGcFmaJgB` |
   | Rachel | calm, warm female | `21m00Tcm4TlvDq8ikWAM` |
   | Antoni | friendly male | `ErXwobaYiN019PkySvjV` |
   | Bella | soft, upbeat female | `EXAVITQu4vr4xnSDxMaL` |
   | Josh | younger male | `TxGEqnHWrfWFTfGW9XjX` |
   | Domi | confident female | `AZnzlk1XvdvUeBnXmlld` |
   These are standard ElevenLabs preset IDs (no `voices_read` scope needed). If a pasted ID
   fails, fall back to Adam and tell the requester.
7. **Any specific context** — audience (partner admins? internal staff?), things to
   emphasize or avoid, terminology, a specific example record to open, etc.

If a required input is missing and you can't safely default it, ask a short follow-up
rather than guessing. Don't proceed to recording without a working login and a clear target.

### Credential handling (hard rules — the login must never persist)

The login the requester gives you is used **only** to record this one video, then discarded:

- Pass it to the builder **through the environment only** (`REC_EMAIL='…' REC_PASSWORD='…' node make-video.js …`). Never put it in a spec file, `config.json`, `credentials.json`, a script, a note, or any file.
- The builder uses the login solely to fill the rec.us login form; it writes it nowhere. All intermediate files (narration, recording) go to a temp dir outside the repo that is deleted when the build finishes. The finished MP4 contains no credentials.
- **Never commit the login.** It doesn't belong in git at all. Only ever commit the code/config; the output MP4 and the `work/` dir are git-ignored.
- Don't echo the password back to the requester or print it in logs.

Net effect: the credentials live only in the running build's memory and the ephemeral container, never in the repository. When the build is done, they're gone.

### Demo data — never show real resident PII

When a video needs to show people — a user, a household, a profile, a search result, a roster — use a **fake test household**, not the live directory, so no real resident's name, email, phone, or birthdate ever lands on screen:

- **Niagara Falls sandbox (org `a976a11a-5303-4785-838a-1b281ca77678`):** use **Ron Swanson's Household** — login/owner `niagara@rec.us`, household id `ced1aee0-e89d-404c-abe1-c0ce27bd14f4`. It's fully fake (Parks & Rec) data with lots of members, bookings, transactions, etc. Point every people-related step at this household.
- **Avoid these as general shots — they expose real PII:** the **Users directory** (`/users`, even filtered) and a household's **Profiles tab** both list real residents' emails, phones, and birthdates. Safe to show: a household's **overview / Bookings** (names only) and the **Groups** list (group names, coverage, counts — no individuals).
- **Other orgs:** ask the requester for their designated fake/test household before showing any personal data; don't default to the live directory.
- After building any video that touched people data, sample frames and confirm no real emails/phones/birthdates are visible before delivering.

## What's fixed vs. what you provide

**Fixed (config.json — don't change unless the user asks):**
- Voice: ElevenLabs **Adam** (`pNInz6obpgDQGcFmaJgB`), model `eleven_turbo_v2_5`.
- Tempo: each section stays on screen for `narration length + ~2.9s`; caption updates the instant you navigate.
- Brand: **Inter** typeface + the **Rec wordmark**, "REC TRAINING VIDEO" title card, outro splash to **partnersupport@rec.us**.
- 1280×720, 25fps, H.264 + AAC.

**You provide (a `spec.json`):** the start URL, the cards to click, and the caption + narration text per section. See `examples/finance-settings.spec.json` for the full shape.

## Prerequisites (check first, tell the user if missing)

- **Network: FULL** — see Step 00 above. Check it first; everything else is wasted if this fails.
- Login: provided at intake → export as `REC_EMAIL` / `REC_PASSWORD` for the build only.
- ElevenLabs key: **bundled** in `credentials.json` (shared Rec key); `ELEVENLABS_API_KEY` overrides it.
  The shared key is scoped to **text-to-speech only** — verified 2026-08-24: the TTS POST
  returns 200, while `/v1/voices`, `/v1/models`, `/v1/user` and `/v1/user/subscription` all
  return **401** with it. So never make the build depend on a voice or model lookup (use the
  preset IDs in the table above), and read a 401 from those endpoints as the key's scope, not
  as a bad key or a network block. Note `/v1/voices` answers 200 *unauthenticated*, which is
  what makes it a clean network-only probe.
- `node_modules` is git-ignored, so a fresh session needs `npm ci` in the skill directory
  (2 packages, ~2s).
- **`ffmpeg`: install the real one — Playwright's will not work.** The bundled
  `/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux` is built `--disable-everything` (webm/VP8/PNG
  only: no H.264, no AAC, no mp4 muxer), so the final mux fails on it. Install with
  `apt-get update && apt-get install -y ffmpeg` — **the `update` is required**, since a stale
  apt index 404s on half the dependency debs. Verify `ffmpeg` and `ffprobe` are both on PATH.
- Chromium is pre-installed at `/opt/pw-browsers` — do not run `playwright install`.
- Behind the CCR agent proxy, the builder handles TLS itself (pins the proxy CA, caps TLS at 1.2, reads `HTTPS_PROXY`). No action needed.

## Workflow

### 1. Resolve the target and org
- From the narrative, identify the section/flow and the **org UUID** (rec.us admin URLs look like `/admin/o/<uuid>/...`). Resolve a named org's UUID with `search_organizations`. Note the base path, e.g. `https://www.rec.us/admin/o/<uuid>/settings/finance`.

### 2. Discover the subpages (build the click list)
Do NOT guess the page structure. Get the real one:
- **Log in and look**: with the provided login, open the start page and read the section-card headings and breadcrumb (this is what the tour clicks). A quick throwaway Playwright script is fine — reuse the launch opts from `make-video.js` (proxy + TLS pin) so it works behind the proxy.
- Or, to enumerate every subpage an admin actually uses, query PostHog pageviews:
  `SELECT DISTINCT replaceRegexpAll(properties.$pathname,'[0-9a-f-]{36}',':id') FROM events WHERE event='$pageview' AND properties.$pathname LIKE '/admin/o/%/<section>%'`.
- Confirm each intended page actually renders (no redirect to `/locations`) before including it.

### 3. Learn how each page works (so narration is accurate)
For every page, read its real content (screenshot or dump `main` innerText while logged in) and, when it's data/behavior you can't see in the UI, verify with the Staff MCP (`query_subagent`, `discover_schema`). Narration must describe what's actually there — never invent fields or behavior. This is what the requester will check.

### 4. Write the spec
Copy an example and edit. Top-level: `title`/`subtitle` (title card), `start` (landing URL — the example link if they gave one), optional `baseUrl` (non-prod host), optional `voiceId` (chosen narrator), `intro`, optional `back` (breadcrumb link text to return between sections). Per section provide:
- `card`: exact on-screen text of the card/row to click (SPA nav keeps the caption overlay alive). Use `path` instead for a direct URL if there's no card to click.
- `title` + `lines`: the on-screen caption (short; `lines` is an array, one per line).
- `narration`: 1–3 spoken sentences. Write for the ear — expand abbreviations the way they should be *said* ("GL" reads fine; write "partner support at rec dot us", "twelve months", etc.).
Size the number of sections and narration length to the requester's target length. Keep narration tight and factual.

### 5. Build
Pass the login through the environment for this one invocation (do not hard-code it in the spec or write it to a file):
```bash
cd .claude/skills/rec-training-video
REC_EMAIL='<email>' REC_PASSWORD='<password>' \
  node make-video.js examples/your-spec.json ../../Rec-Training_<Topic>.mp4
```
The ElevenLabs key comes from the bundled `credentials.json` (override with `ELEVENLABS_API_KEY`). To record a non-production host, set `baseUrl` in the spec or `REC_BASE_URL`. Runs narrate → record → mux → brand and writes the MP4. ~2–4 min depending on length (login + full-page loads go through the proxy).

### 6. Verify, then hand off for review
- Confirm duration ≈ title(4.8s) + sum(section dwells) + outro, and that both a video and audio stream exist (`ffprobe`).
- Sample a few frames (`ffmpeg -ss <t> -i out.mp4 -frames:v 1 f.png`) to confirm captions match their pages and the title/outro cards render.
- Spot-check audio alignment: speech during sections, silence in the gaps.
- Deliver with `SendUserFile` (display: render). Tell the requester it's a **draft for their review**, name anything you were uncertain about (a field you couldn't verify, a page that behaved oddly), and offer to re-cut with fixes.

## Troubleshooting a failed narration call

Every one of these presents as "ElevenLabs won't answer", and they have different fixes.
Read the **status code**, not the hostname, and run `bash scripts/check-egress.sh` first.

| Symptom | What it is | Fix |
|---|---|---|
| `403` / `407` from the proxy, on the CONNECT line before TLS | The environment's egress policy blocked the host | Step 00 — set network to FULL, **new session**. Never retry or route around it |
| `000` / no HTTP response | Same class: CONNECT refused | As above |
| `405 Method Not Allowed` from the proxy | A client sent plain HTTP instead of CONNECT | Unset `HTTP_PROXY`; only `HTTPS_PROXY` is served. Upgrade axios if < 1.16.1 |
| Hangs, then times out, no proxy error | A client that ignores `HTTPS_PROXY` | Node's built-in `fetch` needs `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21); `make-video.js` sets it in `narrateAll()`. A hand-rolled script won't have it |
| `401` on `/v1/voices`, `/v1/models`, `/v1/user` | The shared key is TTS-scoped — expected, not a fault | Use the preset voice IDs; don't look voices up |
| `401` on the TTS POST itself | Genuinely bad or rotated key | Check `credentials.json` / `ELEVENLABS_API_KEY` |

Confirm which one you have from the proxy itself — the port is per-session, so read it from
the environment rather than hardcoding it:

```bash
curl -sS "$HTTPS_PROXY/__agentproxy/status"   # selective:true and recentRelayFailures name real denials
```

A genuine policy denial appears in `recentRelayFailures`; an empty list plus a successful
CONNECT means the failure was never egress. `/root/.ccr/README.md` documents the full set of
failure classes.

## Consistency across a set
Reuse the same `config.json` for every video in a series so voice, pacing, and branding match. Only the spec's `title`, `subtitle`, and per-section text change. Keep output names consistent, e.g. `Rec-Training_<Topic>.mp4`.

## Tuning knobs (config.json)
- `tts.voiceId` / `voiceName` — swap the narrator (the provided key may lack `voices_read`; pass a known voice ID). `tts.voiceSettings.stability` etc. shape delivery.
- `tempo.leadMs` / `tailMs` — pacing (how long a section lingers after its line ends). Raise `tailMs` for a slower feel.
- `brand.outro.email` and copy — change the contact or wording.
- `brand.titleCardSeconds` — title-card hold time.

## Files
- `make-video.js` — orchestrator (narrate → record → mux → brand). Login via `REC_EMAIL`/`REC_PASSWORD`; site via spec `baseUrl` / `REC_BASE_URL`; narration key bundled.
- `config.json` — fixed production settings (voice, tempo, brand).
- `card.html` / `render-card.js` — the Rec title + outro cards.
- `overlay.js` — the caption + cursor overlay injected into each page.
- `credentials.json` — bundled ElevenLabs key only (no login).
- `examples/` — sample specs to copy.
- `../../../scripts/check-egress.sh` (repo root `scripts/`) — the Step 00 pre-flight check.

## Scope note
The packaged builder records **click-through walkthroughs** (navigate to pages / click cards, describe them). For flows that need live interaction with streaming responses (e.g. typing into Rec AI / Seb chat and waiting for it to think), that needs a hand-built recorder with think-gap compression — out of scope for the one-command builder; do it as a bespoke script if asked.
