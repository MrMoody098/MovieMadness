@echo off
echo Starting MovieMadness in Production Mode...
echo Building optimized production container...

docker-compose -f docker-compose.prod.yml up --build -d

echo MovieMadness is running at http://localhost
echo View logs with: docker-compose -f docker-compose.prod.yml logs -f
pause

