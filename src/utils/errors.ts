import { Notice } from "obsidian";

export enum LensError {
	/** User cancelled the screen capture (screencapture exit code 1) */
	CaptureCancelled = "capture-cancelled",
	/** swiftc not found on PATH */
	SwiftcMissing = "swiftc-missing",
	/** OCR language pack not installed (Windows) */
	LanguagePackMissing = "language-pack-missing",
	/** PowerShell / Swift script ran but found no text */
	NoTextFound = "no-text-found",
	/** PowerShell / Swift script encountered a Vision/WinRT error */
	VisionError = "vision-error",
	/** No active markdown editor or cursor position available */
	NoActiveEditor = "no-active-editor",
	/** Unsupported platform */
	PlatformNotSupported = "platform-not-supported",
}

function errorMessage(error: LensError): string {
	switch (error) {
		case LensError.CaptureCancelled:
			return ""; // silent — user intentionally cancelled
		case LensError.SwiftcMissing:
			return "Xcode Command Line Tools required. Install via: xcode-select --install";
		case LensError.LanguagePackMissing:
			return "OCR language pack not installed. Add it in Windows Settings → Time & Language → Language.";
		case LensError.NoTextFound:
			return "No text detected in the selected region.";
		case LensError.VisionError:
			return "OCR failed. Please try again.";
		case LensError.NoActiveEditor:
			return "Please open a note before using Obsidian Lens.";
		case LensError.PlatformNotSupported:
			return "Obsidian Lens requires macOS or Windows.";
	}
}

export function showErrorNotice(error: unknown): boolean {
	if (error instanceof Error) {
		return showErrorNotice(error.message);
	}
	const msg = errorMessage(error as LensError);
	if (!msg) {
		return false; // silent error
	}
	new Notice(msg, 5000);
	return true;
}
