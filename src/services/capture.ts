import { execFile } from "child_process";
import { tempFilePath, cleanupFile } from "../utils/temp-file";
import { LensError } from "../utils/errors";

/**
 * macOS: Launch interactive screen capture via `screencapture -i`.
 *
 * @returns The path to the captured image, or `null` if the user cancelled.
 * @throws {LensError.VisionError} if screencapture fails unexpectedly.
 */
export async function captureScreenRegionMacOS(): Promise<string | null> {
	const imagePath = tempFilePath("png");

	return new Promise<string | null>((resolve, reject) => {
		execFile(
			"/usr/sbin/screencapture",
			["-i", imagePath],
			(error, stdout, stderr) => {
				if (error) {
					console.error(
						"[Obsidian Lens] screencapture stderr:",
						stderr,
					);
					console.error(
						"[Obsidian Lens] screencapture error:",
						error.message,
						"code:",
						error.code,
					);
					// Clean up the temp file on failure
					cleanupFile(imagePath);

					if (error.code === 1) {
						// Exit code 1 = user cancelled the selection — silent
						resolve(null);
					} else {
						// Unexpected error
						reject(new Error(LensError.VisionError));
					}
					return;
				}

				resolve(imagePath);
			},
		);
	});
}

/**
 * Windows: Launch interactive screen capture via PowerShell.
 * Uses System.Drawing to create a transparent overlay with a selection rectangle.
 * Escape or right-click cancels with exit code 1 (silent).
 *
 * @returns The path to the captured image, or `null` if the user cancelled.
 * @throws {LensError.VisionError} if capture fails unexpectedly.
 */
export async function captureScreenRegionWindows(): Promise<string | null> {
	const imagePath = tempFilePath("png");

	const psScript = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$form = New-Object System.Windows.Forms.Form
$form.Text = "Obsidian Lens — Drag to select a region"
$form.FormBorderStyle = "None"
$form.TopMost = $true
$form.Cursor = "Cross"
$form.BackColor = "Black"
$form.Opacity = 0.3

# Span across all monitors using VirtualScreen
$virt = [System.Windows.Forms.SystemInformation]::VirtualScreen
$form.StartPosition = "Manual"
$form.Location = $virt.Location
$form.Size = $virt.Size

$startClient = $null
$endClient = $null
$startScreen = $null
$endScreen = $null
$rect = $null

$form.Add_MouseDown({
	if ($_.Button -eq "Right") {
		$script:startClient = $null
		$script:endClient = $null
		$form.Close()
		return
	}
	$script:startClient = $_.Location
	$script:startScreen = $form.PointToScreen($_.Location)
	$script:rect = $form.CreateGraphics()
})

$form.Add_MouseMove({
	if ($script:startClient -ne $null) {
		$script:rect.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
		$current = $_.Location
		$x = [Math]::Min($script:startClient.X, $current.X)
		$y = [Math]::Min($script:startClient.Y, $current.Y)
		$w = [Math]::Abs($script:startClient.X - $current.X)
		$h = [Math]::Abs($script:startClient.Y - $current.Y)
		$script:rect.DrawRectangle([System.Drawing.Pens]::White, $x, $y, $w, $h)
	}
})

$form.Add_MouseUp({
	$script:endClient = $_.Location
	$script:endScreen = $form.PointToScreen($_.Location)
	$form.Close()
})

$form.Add_KeyDown({
	if ($_.KeyCode -eq "Escape") {
		$script:startClient = $null
		$script:endClient = $null
		$form.Close()
	}
})

[void]$form.ShowDialog()

if ($startClient -eq $null -or $endClient -eq $null) {
	exit 1
}

# Use screen (physical) coordinates for CopyFromScreen
$x = [Math]::Min($startScreen.X, $endScreen.X)
$y = [Math]::Min($startScreen.Y, $endScreen.Y)
$w = [Math]::Abs($startScreen.X - $endScreen.X)
$h = [Math]::Abs($startScreen.Y - $endScreen.Y)

if ($w -eq 0 -or $h -eq 0) {
	exit 1
}

$bitmap = New-Object System.Drawing.Bitmap($w, $h)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($x, $y, 0, 0, [System.Drawing.Size]::new($w, $h))
$bitmap.Save("${imagePath}", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`;

	return new Promise<string | null>((resolve, reject) => {
		execFile(
			"powershell.exe",
			["-NoProfile", "-NonInteractive", "-Command", psScript],
			{ timeout: 60_000 },
			(error, stdout, stderr) => {
				if (error) {
					console.error(
						"[Obsidian Lens] PowerShell capture stderr:",
						stderr,
					);
					console.error(
						"[Obsidian Lens] PowerShell capture error:",
						error.message,
						"code:",
						error.code,
					);
					cleanupFile(imagePath);

					if (error.code === 1) {
						// Exit code 1 = user cancelled — silent
						resolve(null);
					} else {
						reject(new Error(LensError.VisionError));
					}
					return;
				}

				resolve(imagePath);
			},
		);
	});
}
