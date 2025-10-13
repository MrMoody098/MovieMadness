@echo off
echo Starting MovieMadness in Development Mode...
echo Building and starting Docker container...

docker-compose up --build

echo MovieMadness is running at http://localhost:3000
pause

