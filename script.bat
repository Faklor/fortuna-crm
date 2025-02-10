@echo off
echo start fortuna-crm
powershell -Command "$wshell = New-Object -ComObject wscript.shell; Start-Process cmd -ArgumentList '/c ssh -p 443 -R0:127.0.0.1:3000 -L4300:127.0.0.1:4300 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -t D9MNmNrORJ4+qr@a.pinggy.io x:https' -NoNewWindow; Start-Sleep 2; $wshell.SendKeys('{ENTER}')"
pause 