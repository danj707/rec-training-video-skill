# Rec Training Video skill

A Claude skill that turns a plain-language request into a **narrated, captioned,
Rec-branded walkthrough video** of the rec.us admin — logs in, clicks through the
pages, adds an ElevenLabs voiceover synced to on-screen captions, and wraps it in
a Rec title card and a "Thanks for watching / partnersupport@rec.us" outro. Output
is an MP4.

## How to use it (no command line, no setup)

1. Go to **[claude.ai/code](https://claude.ai/code)** and start a session on **this repo** (`rec-training-video-skill`).
2. Ask in plain English, e.g.:
   - *"Make a Rec training video walking through the Memberships settings."*
   - *"Record a walkthrough of the check-in flow."*
   - *"Demo video for Facilities → Reservations."*
3. Claude logs into the rec.us sandbox, records the screen, adds the voiceover +
   captions, brands it, and hands you back the **MP4**. ~3–5 minutes per video.

That's it — the sandbox login and voice key are already bundled in
`.claude/skills/rec-training-video/credentials.json`, so there's nothing to configure.

## Notes

- **Keep this repo internal to Rec.** It contains an internal sandbox rec.us login
  and a live ElevenLabs API key. If either ever leaks outside Rec, rotate the
  ElevenLabs key from the Rec ElevenLabs account.
- **Tweaking voice / pacing / branding:** everything lives in
  `.claude/skills/rec-training-video/config.json` (narrator voice, timing, title/outro
  cards). Change the narrator by dropping a different ElevenLabs voice ID in there.
- **How it works / authoring specs:** see `.claude/skills/rec-training-video/SKILL.md`.
- The skill needs a container with a headless browser + ffmpeg (which Claude Code
  provides). It does **not** render on plain claude.ai chat.
