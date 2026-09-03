# HackDesk

Hackathon registration app built on SELISE Blocks — no server code. A Vite + React SPA
talking only to `@seliseblocks/client`; Blocks IAM, Data, Localization, Storage, Captcha,
and Release are the backend.

- `hackdesk/` — the scaffolded app (`blocks new web`)
- `.codex/skills/`, `.claude/skills/` — vendored Blocks skills (see `AGENTS.md`)

## What it does

Residents sign up for the hackathon, activate their account by email, fill in their
team details, and upload a logo. Organizers (a real IAM role, not a hardcoded email
check) review and approve or waitlist registrations.

See `AGENTS.md` for how Blocks work in this repo is driven — through the `blocks` CLI
and the SDK, never raw HTTP against the platform.
