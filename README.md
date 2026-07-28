# Rec Training Video skill

A Claude skill that turns a plain-language request into a **narrated, captioned,
Rec-branded walkthrough video** of the rec.us admin — it logs in, clicks through the
pages, adds an ElevenLabs voiceover synced to on-screen captions, and wraps it in a
Rec title card and a "Thanks for watching / partnersupport@rec.us" outro. The output
is an MP4.

No downloads, no coding, no setup — everything runs in the cloud and Claude does the work.

---

## Make a video (the short version)

1. Go to **[claude.ai/code](https://claude.ai/code)** and start a session on **this repo** (`rec-training-video-skill`).
2. Ask, in plain English: *"Make a Rec training video walking through the Memberships settings."*
3. Wait ~3–5 minutes and download the **MP4** Claude posts back.

First time? Follow the two setup sections below, then come back to this.

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

## Making a video (every time)

1. On **[claude.ai/code](https://claude.ai/code)**, click **New session** (or **+**).
2. When it asks which **repository**, pick **`rec-training-video-skill`** and leave the branch as **`main`**. Start the session. (This spins up a temporary cloud workspace — you don't install anything; Claude works in there.)
3. Type what you want, e.g.:
   - *"Make a Rec training video walking through the Memberships settings."*
   - *"Record a walkthrough of the check-in flow."*
   - *"Demo video for Facilities → Reservations."*
4. Wait ~3–5 minutes. Claude logs into the rec.us sandbox, records the screen, adds the
   voiceover and captions, brands it, and posts the finished **MP4** in the chat to download.

Stuck at any point? Just ask Claude in that session — *"how do I use this?"* — and it'll walk you through it.

---

## Notes

- **Keep this repo internal to Rec.** It contains an internal *sandbox* rec.us login and a
  live ElevenLabs API key (bundled in `.claude/skills/rec-training-video/credentials.json`
  so there's zero setup). If either leaks outside Rec, rotate the ElevenLabs key from the
  Rec ElevenLabs account.
- **Not everyone needs access.** Anyone with a GitHub account can connect in ~1 minute; if
  some teammates don't use GitHub, have one person generate the videos and share the MP4s.
- **Tweaking voice / pacing / branding:** everything lives in
  `.claude/skills/rec-training-video/config.json` (narrator voice, timing, title/outro
  cards). Change the narrator by dropping in a different ElevenLabs voice ID.
- **How it works / authoring specs:** see `.claude/skills/rec-training-video/SKILL.md`.
- The skill needs a container with a headless browser + ffmpeg (which Claude Code on the web
  provides). It does **not** render on plain claude.ai chat.
- **Network:** the cloud environment must be able to reach `rec.us` and `api.elevenlabs.io`.
  If someone hits a network/login error, that environment's outbound-access policy is the
  cause — the default usually works; flag it to whoever manages your Claude Code environments.
