@echo off
echo Starting GuardianLink Backend Server...
start cmd /k "cd server && npm run dev"

echo Starting GuardianLink React Native App...
start cmd /k "npm start"

echo Both services have been started in separate windows!
