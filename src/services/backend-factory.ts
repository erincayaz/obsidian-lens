import { LensError } from "../utils/errors";
import type { IOcrBackend } from "../platform/interfaces";
import { SwiftOcrBackend } from "../services/swift-runner";
import { PowerShellOcrBackend } from "../services/powershell-runner";

/**
 * Resolve the correct OCR backend for the current platform.
 *
 * @param scriptPath — Absolute path to the platform's OCR script
 *                     (assets/ocr.swift on macOS, assets/ocr.ps1 on Windows)
 * @returns An IOcrBackend instance for the current platform.
 * @throws {Error} with LensError.PlatformNotSupported on unsupported platforms.
 */
export function resolveBackend(scriptPath: string): IOcrBackend {
	if (process.platform === "darwin") {
		return new SwiftOcrBackend(scriptPath);
	}
	if (process.platform === "win32") {
		return new PowerShellOcrBackend(scriptPath);
	}
	throw new Error(LensError.PlatformNotSupported);
}
