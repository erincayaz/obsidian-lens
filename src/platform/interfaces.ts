import type { LanguageMode } from "../settings";

/**
 * Result of a screen capture operation.
 * `imagePath` is null when the user cancels the selection.
 */
export interface CaptureResult {
	imagePath: string | null;
}

/**
 * Result of an OCR recognition operation.
 */
export interface OcrResult {
	text: string;
}

/**
 * Platform-agnostic OCR backend.
 * Both the Swift (macOS) and C# (Windows) backends implement this interface,
 * keeping ocr-command.ts free of platform-specific logic.
 */
export interface IOcrBackend {
	/** Capture a screen region. Returns null if the user cancels. */
	captureRegion(): Promise<CaptureResult>;

	/** Run OCR on the given image and return recognized text. */
	runOcr(imagePath: string, language: LanguageMode): Promise<OcrResult>;

	/** Delete one or more temp files. Errors are silently swallowed. */
	cleanup(paths: string[]): Promise<void>;
}
