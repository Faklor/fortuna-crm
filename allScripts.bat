@echo off
chcp 65001

echo Запуск основного приложения...
cd /d "D:\Приложение Fortuna-crm и ее файлы\fortuna-crm"
call npm run build
if errorlevel 1 (
    echo Ошибка при сборке основного приложения
    pause
    exit /b 1
)

start cmd /k "npm run start"
echo Ожидание запуска основного приложения...
timeout /t 30

:: Проверяем, запущено ли приложение (порт 3000)
netstat -an | find "3000" | find "LISTENING"
if errorlevel 1 (
    echo Ошибка: основное приложение не запустилось
    pause
    exit /b 1
)
echo Основное приложение успешно запущено

echo Запуск сервиса уведомлений...
cd /d "D:\Приложение Fortuna-crm и ее файлы\notices"
start cmd /k "npm run start"
echo Ожидание запуска уведомлений...
timeout /t 15

:: Проверяем, запущен ли сервис уведомлений (порт 4300)
netstat -an | find "4300" | find "LISTENING"
if errorlevel 1 (
    echo Ошибка: сервис уведомлений не запустился
    pause
    exit /b 1
)
echo Сервис уведомлений успешно запущен

echo Запуск туннеля pinggy...

:: Запускаем туннель pinggy с автоматическим переподключением
start cmd /c "title Pinggy Tunnel && (
    :loop
    taskkill /F /IM ssh.exe >nul 2>&1
    timeout /t 2 >nul
    powershell -Command "$wshell = New-Object -ComObject wscript.shell; Start-Process cmd -ArgumentList '/c ssh -p 443 -R0:127.0.0.1:3000 -L4300:127.0.0.1:4300 -o StrictHostKeyChecking=no -o ServerAliveInterval=3 -t D9MNmNrORJ4+qr@a.pinggy.io x:https' -NoNewWindow; Start-Sleep 2; $wshell.SendKeys('{ENTER}')"

    :check_connection
    timeout /t 2 >nul
    tasklist | find "ssh.exe" >nul
    if errorlevel 1 (
        echo Connection lost. Reconnecting...
        goto loop
    ) else (
        goto check_connection
    )
)"

echo.
echo Все сервисы успешно запущены!
echo - Основное приложение
echo - Сервис уведомлений
echo - Туннель pinggy
echo.
echo Сворачиваем все окна командной строки...

:: Сворачиваем все окна cmd.exe
powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"
:: Разворачиваем текущее окно
powershell -command "$sig = '[DllImport(\"user32.dll\")] public static extern bool ShowWindow(int handle, int state);' ; Add-Type -MemberDefinition $sig -Name Win32ShowWindow -Namespace Win32Functions ; [Win32Functions.Win32ShowWindow]::ShowWindow(([System.Diagnostics.Process]::GetCurrentProcess() | Get-Process).MainWindowHandle, 1)"

echo Все окна свернуты. Для просмотра логов разверните соответствующие окна командной строки.
echo Для завершения работы всех сервисов закройте все окна командной строки.
pause