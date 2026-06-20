#!/usr/bin/env bash
# Run this script once from the CarbonIQ directory to:
#  1. Initialise a local git repo
#  2. Create a public GitHub repo named CarbonIQ
#  3. Push all code
#  4. Enable GitHub Pages (via Actions) on the repo

set -e

REPO_NAME="CarbonIQ"
GITHUB_USER="ravikugupta"

echo "===== 1. Logging into GitHub CLI ====="
gh auth login

echo ""
echo "===== 2. Initialising local git repo ====="
git init
git add .
git commit -m "feat: initial commit — CarbonIQ v1.0"

echo ""
echo "===== 3. Creating public GitHub repository ====="
gh repo create "$GITHUB_USER/$REPO_NAME" \
  --public \
  --description "AI-powered carbon footprint tracker for India — built with React + Vite + Tailwind" \
  --source=. \
  --remote=origin \
  --push

echo ""
echo "===== 4. Enabling GitHub Pages (Actions source) ====="
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/$GITHUB_USER/$REPO_NAME/pages \
  -f build_type=workflow \
  -f source='{"branch":"main","path":"/"}' 2>/dev/null || true

echo ""
echo "===== ✅ Done! ====="
echo "Repo:  https://github.com/$GITHUB_USER/$REPO_NAME"
echo "Pages: https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""
echo "GitHub Actions will build & deploy in ~2-3 minutes."
echo "Check progress at: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
