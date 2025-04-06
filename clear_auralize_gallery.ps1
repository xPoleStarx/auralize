Write-Host "Auralize Galeri Temizleme Aracı" -ForegroundColor Cyan

# Not: Bu script Windows 11'de PowerShell için çalışır

# Chrome ve Edge kullanıcıları için LocalStorage temizleme yolu
$chromeLocalStoragePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Local Storage\leveldb"
$edgeLocalStoragePath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Local Storage\leveldb"

Write-Host "`nBu script tarayıcınızdaki localStorage verilerini doğrudan silemez." -ForegroundColor Yellow
Write-Host "Bunun yerine, uygulamaya eklenmiş olan 'Galeriyi Temizle' düğmesini kullanmanız önerilir." -ForegroundColor Yellow
Write-Host "Veya şu adımları takip edebilirsiniz:" -ForegroundColor Yellow

Write-Host "`n1. Tarayıcınızı açın ve Auralize uygulamasına gidin" -ForegroundColor White
Write-Host "2. F12 tuşuna basarak veya Sağ Tık -> İncele seçeneğiyle geliştirici araçlarını açın" -ForegroundColor White
Write-Host "3. Console (Konsol) sekmesine tıklayın" -ForegroundColor White
Write-Host "4. Aşağıdaki komutu yazın ve Enter tuşuna basın:" -ForegroundColor White
Write-Host "   localStorage.removeItem('auralize_shared_auras')" -ForegroundColor Green
Write-Host "5. Sayfayı yenileyin" -ForegroundColor White

Write-Host "`nBu işlem tüm paylaşılmış auraları temizleyecektir." -ForegroundColor Cyan

# Kullanıcı için bekleme
Read-Host "`nÇıkmak için Enter tuşuna basın" 