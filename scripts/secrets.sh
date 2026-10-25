#!/bin/sh
# Pushes the values in .env to where production reads them:
#   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET -> Worker secrets (Cloudflare)
#   SESSION_SECRET                         -> Worker secret, generated here
#                                             unless .env defines one
#   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID -> GitHub Actions secrets
#
# Run after the first `pnpm run deploy` (the Worker must exist). Values are
# piped straight from the file and never printed.
#
#   sh scripts/secrets.sh
set -eu
cd "$(dirname "$0")/.."
[ -f .env ] || { echo ".env not found" >&2; exit 1; }

value() { grep "^$1=" .env | head -n1 | cut -d= -f2- | tr -d '"' ; }
require() { [ -n "$(value "$1")" ] || { echo "$1 missing from .env" >&2; exit 1; }; }

require GITHUB_CLIENT_ID
require GITHUB_CLIENT_SECRET
require CLOUDFLARE_API_TOKEN
require CLOUDFLARE_ACCOUNT_ID

echo "Worker secrets (Cloudflare):"
value GITHUB_CLIENT_ID | pnpm exec wrangler secret put GITHUB_CLIENT_ID
value GITHUB_CLIENT_SECRET | pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
if [ -n "$(value SESSION_SECRET)" ]; then
  value SESSION_SECRET | pnpm exec wrangler secret put SESSION_SECRET
else
  openssl rand -base64 32 | pnpm exec wrangler secret put SESSION_SECRET
fi

echo "GitHub Actions secrets:"
repo="$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')"
value CLOUDFLARE_API_TOKEN | gh secret set CLOUDFLARE_API_TOKEN --repo "$repo"
value CLOUDFLARE_ACCOUNT_ID | gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$repo"
echo "done"
