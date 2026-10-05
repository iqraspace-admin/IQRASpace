#!/usr/bin/env bash
# Cloudflare credential preflight — runs BEFORE `wrangler deploy` so a bad
# token/account id fails with a clear, specific message instead of an opaque
# "exit code 1". Prints only Cloudflare's own error messages and HTTP codes;
# never the token. Needs env CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.
# Optional: CF_NEEDS_D1=true (site uses a D1 binding).
set -u
fail=0
QUIET=0
err() { [ "$QUIET" = 1 ] && return 0; echo "::error title=Cloudflare preflight::$*"; fail=1; }

[ -n "${CLOUDFLARE_API_TOKEN:-}" ]  || err "Repo secret CLOUDFLARE_API_TOKEN is empty or missing."
[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || err "Repo secret CLOUDFLARE_ACCOUNT_ID is empty or missing."
[ "$fail" = 0 ] || exit 1

API=https://api.cloudflare.com/client/v4
# call <label> <path>  -> prints "<label>: HTTP <code> <first error message>"; returns 0 on 2xx
call() {
  local out code msg
  out=$(curl -s -m 30 -w '\n%{http_code}' -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "$API$2") || { err "$1: network error"; return 1; }
  code=${out##*$'\n'}; body=${out%$'\n'*}
  msg=$(printf '%s' "$body" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log((j.errors||[]).map(e=>e.code+" "+e.message).join("; "))}catch(e){console.log("non-JSON response")}})')
  echo "$1: HTTP $code ${msg}"
  LAST_BODY=$body
  [ "${code:0:1}" = "2" ] || { err "$1 failed: HTTP $code ${msg}"; return 1; }
}

# 1) token valid + active (account-owned tokens verify here; user tokens use /user/tokens/verify)
QUIET=1; call "token verify (account)" "/accounts/$CLOUDFLARE_ACCOUNT_ID/tokens/verify"; a=$?
call "token verify (user)" "/user/tokens/verify"; u=$?; QUIET=0; fail=0
if [ $a -ne 0 ] && [ $u -ne 0 ]; then err "CLOUDFLARE_API_TOKEN is invalid, expired, revoked, or not valid for account $CLOUDFLARE_ACCOUNT_ID (both verify endpoints rejected it)."; fi
# 2) the permissions wrangler deploy needs
call "Workers Scripts (need: Workers Scripts:Edit)" "/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts"
if [ "${CF_NEEDS_D1:-}" = "true" ]; then
  call "D1 (need: D1:Edit)" "/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database"
fi
if call "Zone lookup iqraspace.org (need: Zone:Read)" "/zones?name=iqraspace.org&account.id=$CLOUDFLARE_ACCOUNT_ID"; then
  zid=$(printf '%s' "$LAST_BODY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const r=JSON.parse(s).result;console.log(r&&r[0]?r[0].id:"")}catch(e){console.log("")}})')
  if [ -z "$zid" ]; then err "Zone iqraspace.org not visible to this token/account (token needs Zone:Read on that zone)."
  else call "Worker Routes (need: Workers Routes:Edit)" "/zones/$zid/workers/routes"; fi
fi
[ "$fail" = 0 ] && echo "Cloudflare preflight OK" || { echo "Cloudflare preflight FAILED — fix the token permissions listed above (see DEPLOYMENT.md)."; exit 1; }
