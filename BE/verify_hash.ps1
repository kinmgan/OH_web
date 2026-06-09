$key = "XXX1ER7ZU3GHCPWP55Y08U3PAK2Z5855"
$data = "vnp_Amount=18000000&vnp_Command=pay&vnp_CreateDate=20260525170621&vnp_CurrCode=VND&vnp_ExpireDate=20260525172121&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORH18&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3000%2Fdat-hang%2F18%2Fthanh-toan%2Fresult&vnp_TmnCode=H5LSBZMQ&vnp_TxnRef=18_1779703581384&vnp_Version=2.1.0"

$hmac = New-Object System.Security.Cryptography.HMACSHA512
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($key)
$hashBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($data))
$hexHash = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ''

Write-Host "Key: $key"
Write-Host "Data: $data"
Write-Host ""
Write-Host "PowerShell HMAC-SHA512: $hexHash"
Write-Host "Java HMAC-SHA512:       e2f192ac85dffab3ea395c351cc64baf9d94c05eb5274cdfc3388cdb2f8af4bada7cdb2f09d7ddeb5445091d57cf69d72d8f30c50a45869ac13afe37ef58bf1b"
Write-Host ""
if ($hexHash -eq "e2f192ac85dffab3ea395c351cc64baf9d94c05eb5274cdfc3388cdb2f8af4bada7cdb2f09d7ddeb5445091d57cf69d72d8f30c50a45869ac13afe37ef58bf1b") {
    Write-Host "MATCH - Java hash computation is correct"
} else {
    Write-Host "MISMATCH - there is a bug!"
}
