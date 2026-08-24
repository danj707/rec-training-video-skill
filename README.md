# Rec Training Video skill

A Claude skill that turns a plain-language request into a **narrated, captioned,
Rec-branded walkthrough video** of the rec.us admin — it logs in, clicks through the
pages, adds an ElevenLabs voiceover synced to on-screen captions, and wraps it in a
Rec title card and a "Thanks for watching / partnersupport@rec.us" outro. The output
is an MP4.

No downloads, no coding, no setup — everything runs in the cloud and Claude does the work.

---

## Make a video (the short version)

1. At **[claude.ai/code](https://claude.ai/code)**, make sure your environment's **network
   access is Full** (Step C — this trips people up), then start a session on **this repo**
   (`rec-training-video-skill`).
2. Ask, in plain English: *"Make a Rec training video walking through the Memberships settings."*
3. Claude asks you a few quick questions — a **rec.us login** to record with, **which site/org**, an **example link** to the page (if you have one), **what to cover**, roughly **how long**, and a **narrator voice**.
4. Wait ~3–5 minutes and download the **MP4** Claude posts back, then **review it for correctness**.

First time? Follow the three setup sections below, then come back to this.

---

## One-time setup

### Step A — Get access to this repo

You can only open a repo in Claude Code if you've been given access to it.

- Ask Dan to invite your **GitHub username** to this repo, then check your email (or
  **github.com/notifications**) for the invite and click **Accept invitation**.
- No GitHub account? Create one at **github.com/signup** first, then send Dan your username.

### Step B — Connect Claude Code to GitHub (first time only)

Claude needs to see your GitHub so it can open the repo. You do this once.

1. **Go to [claude.ai/code](https://claude.ai/code)** and sign in with your Rec account (same login you use for Claude).
2. Click **New session** (or the **+**). The first time, you'll see a **"Connect GitHub"** button — click it.
3. A **GitHub authorization** window pops up. Sign in to GitHub if asked, then **authorize the Anthropic / Claude app**.
4. GitHub asks **which repositories** Claude may access:
   - Choose **"Only select repositories"** and pick **`rec-training-video-skill`** (recommended — least access), **or** "All repositories" if you prefer.
   - Click **Install / Approve access**.
5. You'll land back in Claude Code, and the repo now appears in the list.

> **If the repo isn't in the list:** either the invite in Step A hasn't been accepted,
> or you granted access to a different set of repos. Fix repo access at
> **github.com → Settings → Applications → Installed GitHub Apps → Claude → Configure**,
> add `rec-training-video-skill`, and save.

---

### Step C — Set your environment's network access to **Full** ⚠️

**Do this before you start a session, not during one.** The skill has to reach the narration
service (`api.elevenlabs.io`) and `rec.us` itself. If your environment's network access is
anything narrower, the build fails partway through with a proxy error that looks like a
broken skill and isn't.

At **[claude.ai/code](https://claude.ai/code)**, open your environment's settings and set
**network access to Full**:

<img width="597" height="573" alt="image" src="https://github.com/user-attachments/assets/ef5737fc-861c-4198-a638-fe0eaee5b5f3" />

**Then start a new session.** The network policy is applied when a session's workspace is
created, so changing the setting does **not** unblock a session that is already open — you
have to open a fresh one afterwards. This is the single most common way people get stuck:
flip the setting, retry in the same session, see the identical error.

> **Access to the repo is not the same as access to the network.** Being invited to this repo
> (Step A) gives you the skill *and* the shared narration key — but **not** a network policy.
> Everyone runs sessions in their own environment, so "it works for Dan" does not carry over.
> You have to set your own environment to Full.

**Check it in one line**, inside any session:

```bash
curl -s -o /dev/null -w 'elevenlabs -> HTTP %{http_code}\n' https://api.elevenlabs.io/v1/voices
```

`200` means you are good to go. `000`, `403` or `407` means the session is still blocked — set
the environment to Full and open a **new** session. This check needs no API key, so it can
never be confused with a credentials problem. For a fuller read-out, ask Claude to run
`bash scripts/check-egress.sh`, which also checks `rec.us` and prints the fix.

Still blocked in a brand-new session on Full? Then the restriction is on your
account/organization rather than the environment — flag it to whoever administers Claude for
your org.

---

## Making a video (every time)

1. On **[claude.ai/code](https://claude.ai/code)**, confirm the environment's network access is
   still **Full** (Step C), then click **New session** (or **+**).
2. When it asks which **repository**, pick **`rec-training-video-skill`** and leave the branch as **`main`**. Start the session. (This spins up a temporary cloud workspace — you don't install anything; Claude works in there.)
3. Type what you want, e.g.:
   - *"Make a Rec training video walking through the Memberships settings."*
   - *"Record a walkthrough of the check-in flow."*
   - *"Demo video for Facilities → Reservations."*
4. Claude asks a few quick questions before it starts:
   - **Login** — a rec.us email + password to record with (use a sandbox/admin login with no real PII). It's used only for this one video and is **never saved or committed** — see Notes.
   - **Which site / org** — production by default; paste the org's admin URL or name.
   - **Example link** — a URL to the exact page it's about, if you have one (removes guesswork).
   - **What to cover** — plain-language description of the sections/flow to record and explain.
   - **How long** — a rough target, e.g. "~90 seconds" or "2–3 minutes".
   - **Voice** — pick a narrator (Adam is the default and matches the existing videos).
5. Wait ~3–5 minutes. Claude logs in, records the screen, adds the voiceover and captions,
   brands it, and posts the finished **MP4** in the chat. **Review it for correctness** —
   it's a draft; Claude will note anything it wasn't sure about, and can re-cut with fixes.

Stuck at any point? Just ask Claude in that session — *"how do I use this?"* — and it'll walk you through it.

---

## Notes

- **Login is never stored.** You provide a rec.us login when Claude asks; it's used only to
  log in for that one recording and is **never written to disk or committed to this repo**.
  Nothing but the shared **ElevenLabs API key** is bundled (in
  `.claude/skills/rec-training-video/credentials.json`, for zero-setup narration).
- **Keep this repo internal to Rec.** If the ElevenLabs key ever leaks outside Rec, rotate it
  from the Rec ElevenLabs account.
- ⚠️ **Open item (2026-08-24): the bundled key is currently exposed.** This repo's visibility
  is **public**, and `credentials.json` is committed (`822ba83`) — so the shared ElevenLabs key
  is readable by anyone who finds the repo. Rotate the key, and either make the repo private or
  move the key out of git and into an environment variable. `make-video.js` already prefers
  `ELEVENLABS_API_KEY` over the bundled file, so nothing in the code has to change. Trade-off
  worth knowing: an env var is the one thing that does *not* travel to teammates via a clone —
  though as Step C shows, each person's environment needs setting up regardless.
- **Not everyone needs access.** Anyone with a GitHub account can connect in ~1 minute; if
  some teammates don't use GitHub, have one person generate the videos and share the MP4s.
- **Tweaking voice / pacing / branding:** everything lives in
  `.claude/skills/rec-training-video/config.json` (narrator voice, timing, title/outro
  cards). Change the narrator by dropping in a different ElevenLabs voice ID.
- **How it works / authoring specs:** see `.claude/skills/rec-training-video/SKILL.md`.
- The skill needs a container with a headless browser + ffmpeg. It does **not** render on plain
  claude.ai chat. Chromium comes pre-installed, but **ffmpeg does not** — the session ships only
  Playwright's stripped-down build (no H.264/AAC, so the MP4 mux fails on it). Claude installs
  the real one with `apt-get update && apt-get install -y ffmpeg`, plus `npm ci` for the
  builder's two dependencies. Both are quick; just don't be surprised by the setup step.
- **Network: set the environment to Full — see Step C.** The cloud environment must reach
  `rec.us` and `api.elevenlabs.io`. **Do not assume the default works: it does not always.**
  A teammate lost a session to exactly this in Aug 2026, on a narrower policy, using this repo
  and this key. The policy is per-environment and per-person, it is applied when the session
  starts (so a mid-session change needs a new session), and a proxy `403` is a policy denial —
  not something to retry, and never a key problem.
