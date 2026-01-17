# build.ps1 - Clean Build Script for FLUX

Write-Host "--- [1/3] Preparing Environment ---" -ForegroundColor Cyan

# 1. Create Dummy setup-dev-bundler.js to suppress Next.js warning
$dummyDir = ".next\standalone\node_modules\next\dist\server\lib\router-utils"
$dummyFile = "$dummyDir\setup-dev-bundler.js"

if (-not (Test-Path $dummyDir)) {
    New-Item -Path $dummyDir -ItemType Directory -Force | Out-Null
}
"module.exports={setupDevBundler:()=>Promise.resolve()};" | Out-File -FilePath $dummyFile -Encoding ASCII

Write-Host " - Created dummy setup-dev-bundler.js" -ForegroundColor Green

Write-Host "--- [2/3] Building Executable (pkg) ---" -ForegroundColor Cyan
Write-Host " - This may produce some warnings, but we will filter the noise..." -ForegroundColor Gray

# 2. Run pkg with output filtering
# We redirect stderr to stdout to catch warnings, then filter line by line.
$process = Start-Process -FilePath "cmd" -ArgumentList "/c npx pkg . --compress GZip --output dist/FLUX.exe --icon launcher/icon.ico" -NoNewWindow -PassThru -RedirectStandardOutput "pkg_stdout.log" -RedirectStandardError "pkg_stderr.log" -Wait

# 3. Process logs and display only relevant info
$stdOut = Get-Content "pkg_stdout.log" -ErrorAction SilentlyContinue
$stdErr = Get-Content "pkg_stderr.log" -ErrorAction SilentlyContinue

# Filter patterns for noise
$noisePatterns = @(
    "Warning Failed to make bytecode",
    "Warning Cannot include directory",
    "Warning Cannot find module",
    "%1:",
    "%2:"
)

Write-Host "`n=== Build Log Summary ===" -ForegroundColor Yellow

$stdOut | ForEach-Object { Write-Host $_ }
$stdErr | ForEach-Object {
    $line = $_
    $isNoise = $false
    foreach ($pattern in $noisePatterns) {
        if ($line -like "*$pattern*") {
            $isNoise = $true
            break
        }
    }
    
    if (-not $isNoise) {
        Write-Host $line -ForegroundColor Red
    }
}

# Cleanup temporary logs
Remove-Item "pkg_stdout.log" -ErrorAction SilentlyContinue
Remove-Item "pkg_stderr.log" -ErrorAction SilentlyContinue

if ($process.ExitCode -eq 0) {
    Write-Host "`n--- [3/3] Build Successful! ---" -ForegroundColor Green
}
else {
    Write-Host "`n--- [Error] Build Failed with Exit Code $($process.ExitCode) ---" -ForegroundColor Red
    exit $process.ExitCode
}
