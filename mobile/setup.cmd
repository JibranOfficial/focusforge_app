@echo off
REM FocusForge mobile setup for Expo SDK 57.
REM Run from the mobile folder:  setup.cmd
REM Expo picks the correct version of every package for SDK 57, so we never guess versions.

cd /d "%~dp0"

echo.
echo === 1/4  Cleaning old installs ===
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json

echo.
echo === 2/4  Installing Expo, React and React Native ===
call npm install
if errorlevel 1 goto fail

echo.
echo === 3/4  Installing app libraries (versions chosen by Expo) ===
call npx expo install expo-router react-native-screens react-native-safe-area-context react-native-svg expo-constants expo-linking expo-status-bar expo-font @expo/vector-icons expo-secure-store expo-notifications expo-keep-awake expo-haptics expo-auth-session expo-crypto expo-web-browser expo-system-ui @react-native-community/datetimepicker react-dom react-native-web @expo/metro-runtime
if errorlevel 1 goto fail
call npm install @expo-google-fonts/inter @tanstack/react-query zustand
if errorlevel 1 goto fail

echo.
echo === 4/4  Aligning versions with SDK 57 ===
call npx expo install --fix
if errorlevel 1 goto fail

echo.
echo ================================================
echo  Done. Start the app with:   npx expo start -c
echo ================================================
goto end

:fail
echo.
echo *** Something failed. Take a screenshot of the red text above and send it to Claude. ***

:end
pause
