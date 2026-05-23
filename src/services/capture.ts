import {execFile} from "child_process";
import {tempFilePath, cleanupFile} from "../utils/temp-file";
import {LensError} from "../utils/errors";

/**
 * Launch interactive screen capture via `screencapture -i`.
 *
 * @returns The path to the captured image, or `null` if the user cancelled.
 * @throws {LensError.VisionError} if screencapture fails unexpectedly.
 */
export async function captureScreenRegion(): Promise<string | null> {
	const imagePath = tempFilePath("png");

	return new Promise<string | null>((resolve, reject) => {
		execFile("/usr/sbin/screencapture", ["-i", imagePath], (error, stdout, stderr) => {
			if (error) {
				console.error("[Obsidian Lens] screencapture stderr:", stderr);
				console.error("[Obsidian Lens] screencapture error:", error.message, "code:", error.code);
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
		});
	});
}