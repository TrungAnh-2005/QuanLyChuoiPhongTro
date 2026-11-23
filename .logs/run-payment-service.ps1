$Host.UI.RawUI.WindowTitle = "[payment-service] - Port 8087"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location -LiteralPath "D:\QuanLyChuoiPhongTro"
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  SERVICE : payment-service" -ForegroundColor Green
Write-Host "  PORT    : 8087" -ForegroundColor Yellow
Write-Host "  JAR     : D:\QuanLyChuoiPhongTro\backend\services\payment-service\target\payment-service-1.0.0-SNAPSHOT.jar" -ForegroundColor DarkGray
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
& java "-Dfile.encoding=UTF-8" "-Xms32m" "-Xmx128m" "-XX:MaxMetaspaceSize=128m" "-XX:+UseSerialGC" "-XX:ActiveProcessorCount=2" -jar "D:\QuanLyChuoiPhongTro\backend\services\payment-service\target\payment-service-1.0.0-SNAPSHOT.jar"
$code = $LASTEXITCODE
Set-Content -Path "D:\QuanLyChuoiPhongTro\.logs\payment-service.exit" -Value "$code"
Write-Host ""
Write-Host "[!] Service payment-service da dung (Exit Code: $code). Cua so duoc giu lai de doc log." -ForegroundColor Red
