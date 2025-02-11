@echo off
echo start fortuna-crm

:loop
taskkill /F /IM ssh.exe >nul 2>&1
timeout /t 2 >nul
powershell -Command "$wshell = New-Object -ComObject wscript.shell; Start-Process cmd -ArgumentList '/c ssh -p 443 -R0:127.0.0.1:3000 -L4300:127.0.0.1:4300 -o StrictHostKeyChecking=no -o ServerAliveInterval=3 -t D9MNmNrORJ4+qr@a.pinggy.io x:https' -NoNewWindow; Start-Sleep 2; $wshell.SendKeys('{ENTER}')"

REM Ждем пока соединение не прервется
:check_connection
timeout /t 2 >nul
tasklist | find "ssh.exe" >nul
if errorlevel 1 (
    echo Connection lost. Reconnecting...
    goto loop
) else (
    goto check_connection
)


