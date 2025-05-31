@echo off
echo Cleaning up project...

REM Remove Next.js cache
if exist .next rmdir /s /q .next

REM Remove node modules and package-lock
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .next\cache rmdir /s /q .next\cache

echo Installing dependencies...
call npm install

echo Cleanup complete! You can now restart your development server.
pause
