#!/bin/bash
set +e
OUT=out-ios; mkdir -p $OUT
APP=$(find ios/build/Build/Products -maxdepth 2 -name "*.app" | head -1)
echo "app=$APP" > $OUT/info.txt
DEV=$(xcrun simctl list devices available | grep -E "iPhone 1[5-7]( Pro)? \(" | head -1 | grep -oE "[0-9A-F-]{36}")
echo "dev=$DEV" >> $OUT/info.txt
xcrun simctl boot "$DEV"; sleep 20
xcrun simctl install booted "$APP" >> $OUT/info.txt 2>&1
BID=$(/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "$APP/Info.plist")
shot() { sleep "$2"; xcrun simctl io booted screenshot "$OUT/$1.png" >/dev/null 2>&1; }
xcrun simctl launch booted "$BID" >> $OUT/info.txt 2>&1
shot 01-start 15
shot 02-intro-keyin 8
for p in "" login cabinet search post; do
  xcrun simctl openurl booted "mohir://$p" 2>>$OUT/info.txt
  shot "10-${p:-home}" 8
done
xcrun simctl spawn booted log show --last 5m --predicate "process == \"$SCHEME\"" --style compact 2>/dev/null | grep -iE "error|exception|fatal|warn" | tail -150 > $OUT/log.txt
xcrun simctl spawn booted launchctl list 2>/dev/null | grep -i "$BID" > $OUT/alive.txt
echo done
