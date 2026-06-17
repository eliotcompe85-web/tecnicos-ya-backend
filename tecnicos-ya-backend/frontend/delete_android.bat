@echo off
cls
echo Stopping all Java/Node processes...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 2
echo.
echo Current directory:
cd /d C:\Users\jimmy\Desktop\ULTIMO~1\tecnicos-ya-backend\frontend
echo %cd%
echo.
echo Attempting deletion of android folder...
rmdir /s /q android 2>nul
if exist android (
    echo STILL_LOCKED
) else (
    echo DELETED_SUCCESS
)
