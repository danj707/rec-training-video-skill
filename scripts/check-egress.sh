#!/usr/bin/env bash
# Pre-flight check: can this session reach the hosts the video builder needs?
#
# Run this FIRST, before asking for a login or writing a spec. If ElevenLabs is
# unreachable the build cannot produce narration, and the failure surfaces deep in
# make-video.js where it reads like a code bug rather than an environment setting.
#
#   bash scripts/check-egress.sh
#
# Nothing here needs an API key: /v1/voices answers unauthenticated, so a failure
# is unambiguously the network and never a credential problem.

set -uo pipefail

fail=0

echo "== proxy =="
echo "HTTPS_PROXY=${HTTPS_PROXY:-<unset>}"
if [ -n "${HTTPS_PROXY:-}" ]; then
  # Port differs per session — always read it from the environment, never hardcode.
  curl -sS --max-time 10 "$HTTPS_PROXY/__agentproxy/status" \
    | grep -oE '"(enabled|selective)":[^,}]*|"recentRelayFailures":\[[^]]*\]' \
    || echo "(status endpoint unavailable)"
else
  echo "(no proxy configured — running outside the CCR agent proxy)"
fi

check() {
  local label="$1" url="$2"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url")
  printf '%-22s HTTP %s  ' "$label" "$code"
  case "$code" in
    200|30[0-9])
      echo "OK — reachable" ;;
    000)
      echo "BLOCKED — no HTTP response (CONNECT refused or host unreachable)"; fail=1 ;;
    403|407)
      echo "BLOCKED by the environment's egress policy"; fail=1 ;;
    405)
      echo "PROXY MISUSE — plain-HTTP request; unset HTTP_PROXY (only HTTPS_PROXY is served)"; fail=1 ;;
    *)
      echo "reachable (that code is the server's own answer, not a block)" ;;
  esac
}

echo
echo "== reachability =="
check "api.elevenlabs.io" "https://api.elevenlabs.io/v1/voices"
check "www.rec.us"        "https://www.rec.us/"

echo
echo "== node fetch (the path make-video.js actually uses) =="
# Node's built-in fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1 (Node >= 22.21),
# so this can fail while curl succeeds. make-video.js sets it in narrateAll().
NODE_USE_ENV_PROXY=1 node -e '
fetch("https://api.elevenlabs.io/v1/voices")
  .then(r => console.log("node fetch -> HTTP", r.status))
  .catch(e => { console.log("node fetch -> FAILED:", e.message); process.exit(1); })' || fail=1

echo
if [ "$fail" -eq 0 ]; then
  echo "RESULT: egress OK — safe to build."
else
  cat <<'MSG'
RESULT: BLOCKED — do not start a build; narration or recording will fail.

Fix, in order:
  1. At claude.ai/code, set this environment's network access to FULL.
  2. Start a NEW session. The policy is applied when the session's container is
     created, so a running session keeps the policy it started with — changing the
     setting does not affect the session you are in right now.
  3. Re-run this script in the new session.
If it still fails in a fresh session on FULL, the denial is above the environment
(an account/org-level egress policy) and needs an org owner to change it.
MSG
  exit 1
fi
