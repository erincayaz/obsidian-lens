import {Notice} from "obsidian";

/**
 * Error kinds that can arise during the OCR flow.
 */
export enum LensError {
	/** User cancelled the screen capture (screencapture exit code 1) */
	CaptureCancelled = "capture-cancelled",
	/** swiftc not found on PATH */
	SwiftcMissing = "swiftc-missing",
	/** Swift script ran but found no text */
	NoTextFound = "no-text-found",
	/** Swift script encountered a Vision framework error */
	VisionError = "vision-error",
	/** No active markdown editor or cursor position available */
	NoActiveEditor = "no-active-editor",
}

/**
 * Map each error kind to a human-readable message suitable for Notice.
 */
function errorMessage(error: LensError): string {
	switch (error) {
		case LensError.CaptureCancelled:
			return ""; // silent — user intentionally cancelled
		case LensError.SwiftcMissing:
			return (
				"Xcode Command Line Tools required. Install via: xcode-select --install"
			);
		case LensError.NoTextFound:
			return "No text detected in the selected region.";
		case LensError.VisionError:
			return "OCR failed. Please try again.";
		case LensError.NoActiveEditor:
			return "Please open a note before using Obsidian Lens.";
	}
}

/**
 * Show an appropriate user-facing notice for the given error.
 * Accepts a LensError enum value or an Error whose .message is a LensError.
 * Returns true if a notice was shown, false if the error is silent.
 */
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