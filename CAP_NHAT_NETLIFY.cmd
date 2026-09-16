@echo off
setlocal
cd /d "%~dp0"
echo Cap nhat V6.1 cho website Netlify hien co.
echo Hay chon DUNG site tuduyhinhtoan8 khi Netlify hoi.
call npm ci
if errorlevel 1 goto fail
call npx netlify-cli login
if errorlevel 1 goto fail
call npx netlify-cli link
if errorlevel 1 goto fail
call npx netlify-cli deploy --prod
if errorlevel 1 goto fail
echo Da hoan tat lenh trien khai. Kiem tra URL Netlify vua tra ve.
pause
exit /b 0
:fail
echo Chua trien khai thanh cong. Xem thong bao loi o tren.
pause
exit /b 1
