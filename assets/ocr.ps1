param(
    [string]$ImagePath,
    [string]$LanguageMode
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Runtime.InteropServices.WindowsRuntime

# Load WinRT types
$null = [Windows.Storage.StorageFile,                Windows.Storage,         ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,                Windows.Media.Ocr,       ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,     Windows.Graphics.Imaging,ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap,    Windows.Graphics.Imaging,ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language,             Windows.Globalization,   ContentType = WindowsRuntime]

# Find the generic GetAwaiter method for IAsyncOperation`1 via reflection.
# PowerShell cannot call .GetAwaiter() on COM proxies, but WindowsRuntimeSystemExtensions
# is a managed class whose GetAwaiter<T>(IAsyncOperation<T>) we can invoke via reflection.
$getAwaiterMethod = [WindowsRuntimeSystemExtensions].GetMember('GetAwaiter').
    Where({ $PSItem.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }, 'First')[0]

function Await($AsyncOp, $ResultType) {
    $getAwaiterMethod.MakeGenericMethod($ResultType).Invoke($null, @($AsyncOp)).GetResult()
}

# Load the image file
try {
    $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)) ([Windows.Storage.StorageFile])
    $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
} catch {
    [Console]::Error.WriteLine("Failed to load image: " + $_.Exception.Message)
    exit 2
}

# Create the OCR engine based on language mode
$ocrEngine = $null

switch ($LanguageMode) {
    "auto" {
        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
        if ($ocrEngine -eq $null) {
            $fallback = New-Object Windows.Globalization.Language("en-US")
            $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($fallback)
        }
        break
    }
    "tr-TR" {
        $lang = New-Object Windows.Globalization.Language("tr-TR")
        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
        if ($ocrEngine -eq $null) { exit 3 }
        break
    }
    "en-US" {
        $lang = New-Object Windows.Globalization.Language("en-US")
        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
        if ($ocrEngine -eq $null) { exit 3 }
        break
    }
    default {
        [Console]::Error.WriteLine("Unknown language mode '$LanguageMode'. Use auto, tr-TR, or en-US.")
        exit 2
    }
}

if ($ocrEngine -eq $null) {
    [Console]::Error.WriteLine("Could not create OCR engine.")
    exit 2
}

# Run OCR
try {
    $result = Await ($ocrEngine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
} catch {
    [Console]::Error.WriteLine("OCR recognition failed: " + $_.Exception.Message)
    exit 2
}

if ($result -eq $null -or $result.Lines -eq $null -or $result.Lines.Count -eq 0) {
    exit 1
}

# Output recognized text
$lines = $result.Lines | ForEach-Object { $_.Text }
Write-Output ($lines -join "`n")

exit 0