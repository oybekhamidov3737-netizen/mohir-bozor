#!/bin/bash
set +e
OUT=out-android; mkdir -p $OUT
APK=$(ls android/app/build/outputs/apk/release/*.apk | head -1)
adb install -r "$APK" > $OUT/install.txt 2>&1
adb logcat -c
PKG=uz.mohir.bozor
shot() { sleep "$2"; adb exec-out screencap -p > "$OUT/$1.png"; }
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
shot 01-start 12
shot 02-intro-keyin 8
adb shell input tap 540 2000; shot 03-tap 5
for p in "" login cabinet search post; do
  adb shell am start -W -a android.intent.action.VIEW -d "mohir://$p" $PKG >/dev/null 2>&1
  shot "10-${p:-home}" 8
done
adb logcat -d | grep -iE "ReactNativeJS|FATAL|AndroidRuntime|Error" | grep -v "^--" | tail -150 > $OUT/log.txt
adb shell pidof $PKG > $OUT/alive.txt 2>&1
echo done
