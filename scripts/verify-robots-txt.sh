#!/usr/bin/env bash
set -euo pipefail

base_url="${1:?Usage: bash scripts/verify-robots-txt.sh <base-url>}"
base_url="${base_url%/}"
body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT

metadata="$(curl \
  --silent \
  --show-error \
  --retry 3 \
  --retry-delay 1 \
  --retry-all-errors \
  --connect-timeout 5 \
  --max-time 20 \
  --output "$body_file" \
  --write-out '%{http_code} %{content_type}' \
  "$base_url/robots.txt")"
read -r status content_type <<< "$metadata"

if [[ "$status" != "200" ]]; then
  echo "::error::robots.txt returned HTTP $status; expected 200."
  exit 1
fi

if [[ "${content_type,,}" != text/plain* ]]; then
  echo "::error::robots.txt returned an unexpected Content-Type: $content_type."
  exit 1
fi

if [[ ! -s "$body_file" ]]; then
  echo "::error::robots.txt is empty."
  exit 1
fi

if grep -Eiq '<!doctype[[:space:]]+html|<html([[:space:]>])' "$body_file"; then
  echo "::error::robots.txt returned HTML instead of a robots policy."
  exit 1
fi

required_directives=(
  'User-agent: *'
  'Allow: /'
  'Disallow: /api/'
)

for directive in "${required_directives[@]}"; do
  if ! grep -Fqx "$directive" "$body_file"; then
    echo "::error::robots.txt is missing the required directive: $directive"
    exit 1
  fi
done

echo "Verified robots.txt: HTTP 200, text/plain, and required crawl directives."
