import { execFile } from "child_process";
import { cleanupFile } from "../utils/temp-file";
import { LensError } from "../utils/errors";
import type { LanguageMode } from "../settings";
import type {
	IOcrBackend,
	CaptureResult,
	OcrResult,
} from "../platform/interfaces";
import { captureScreenRegionWindows } from "./capture";

/**
 * Windows backend: uses Windows.Media.Ocr via a PowerShell script.
 * PowerShell activates WinRT types directly and uses AsTask() to
 * bridge IAsyncOperation COM proxies to managed Task<T> objects.
 * No compilation, no external dependencies.
 */
export class PowerShellOcrBackend implements IOcrBackend {
	private scriptPath: string;

	constructor(scriptPath: string) {
		this.scriptPath = scriptPath;
	}

	async captureRegion(): Promise<CaptureResult> {
		const imagePath = await captureScreenRegionWindows();
		return { imagePath };
	}

	async runOcr(
		imagePath: string,
		language: LanguageMode,
	): Promise<OcrResult> {
		const text = await executeOcrScript(
			this.scriptPath,
			imagePath,
			language,
		);
		return { text };
	}

	async cleanup(paths: string[]): Promise<void> {
		for (const p of paths) {
			cleanupFile(p);
		}
	}
}

/**
 * Execute the PowerShell OCR script and return its stdout.
 */
function executeOcrScript(
	scriptPath: string,
	imagePath: string,
	language: LanguageMode,
): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			"powershell.exe",
			[
				"-NoProfile",
				"-NonInteractive",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				scriptPath,
				imagePath,
				language,
			],
			{ timeout: 30_000, maxBuffer: 1024 * 1024 },
			(error, stdout, stderr) => {
				if (error) {
					console.error(
						"[Obsidian Lens] PowerShell OCR stderr:",
						stderr,
					);
					console.error(
						"[Obsidian Lens] PowerShell OCR error:",
						error.message,
						"code:",
						error.code,
					);
					switch (error.code) {
						case 1:
							reject(new Error(LensError.NoTextFound));
							break;
						case 2:
							reject(new Error(LensError.VisionError));
							break;
						case 3:
							reject(new Error(LensError.LanguagePackMissing));
							break;
						default:
							reject(new Error(LensError.VisionError));
							break;
					}
					return;
				}

				resolve(stdout.trim());
			},
		);
	});
}
