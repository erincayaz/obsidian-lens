import {execFile} from "child_process";
import {tempFilePath, cleanupFile} from "../utils/temp-file";
import {LensError} from "../utils/errors";
import type {LanguageMode} from "../settings";

/**
 * Compile the Swift OCR script and run it against the given image.
 *
 * @param swiftScriptPath — Absolute path to `assets/ocr.swift`
 * @param imagePath       — Absolute path to the captured PNG
 * @param language        — Language mode to pass to the Swift script
 * @returns Recognized text string.
 * @throws {LensError} on any failure.
 */
export async function runOCR(
	swiftScriptPath: string,
	imagePath: string,
	language: LanguageMode,
): Promise<string> {
	// 1. Verify swiftc is available
	await checkSwiftc();

	// 2. Compile the Swift script to a temp binary
	const binaryPath = tempFilePath("ocr");
	await compileSwift(swiftScriptPath, binaryPath);

	try {
		// 3. Execute the binary
		const text = await executeBinary(binaryPath, imagePath, language);
		return text;
	} finally {
		// 4. Always clean up the compiled binary
		cleanupFile(binaryPath);
	}
}

/**
 * Check that `swiftc` is available on PATH.
 */
function checkSwiftc(): Promise<void> {
	return new Promise((resolve, reject) => {
		execFile("which", ["swiftc"], (error) => {
			if (error) {
				console.error("[Obsidian Lens] swiftc not found on PATH");
				reject(new Error(LensError.SwiftcMissing));
			} else {
				resolve();
			}
		});
	});
}

/**
 * Compile `ocr.swift` to a binary at `outputPath`.
 */
function compileSwift(sourcePath: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		execFile(
			"swiftc",
			[sourcePath, "-o", outputPath],
			{timeout: 30_000},
			(error, stdout, stderr) => {
				if (error) {
					console.error("[Obsidian Lens] swiftc stderr:", stderr);
					console.error("[Obsidian Lens] swiftc error:", error.message);
					reject(new Error(LensError.VisionError));
				} else {
					resolve();
				}
			},
		);
	});
}

/**
 * Execute the compiled OCR binary and return its stdout.
 */
function executeBinary(
	binaryPath: string,
	imagePath: string,
	language: LanguageMode,
): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			binaryPath,
			[imagePath, language],
			{timeout: 30_000, maxBuffer: 1024 * 1024},
			(error, stdout, stderr) => {
				if (error) {
					console.error("[Obsidian Lens] OCR binary stderr:", stderr);
					console.error("[Obsidian Lens] OCR binary error:", error.message, "code:", error.code);
					switch (error.code) {
						case 1:
							reject(new Error(LensError.NoTextFound));
							break;
						case 2:
							reject(new Error(LensError.VisionError));
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