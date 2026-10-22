#!/bin/bash
BR=$1; DIR=$2
mkdir -p "$DIR"; cd "$DIR"
git init -q -b "$BR"
git config user.name "github-actions[bot]"; git config user.email "github-actions[bot]@users.noreply.github.com"
git add -A; git commit -qm "sinov ${GITHUB_SHA::7}" || true
git push -q -f "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" "$BR"
