import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Generate a unique temporary file path with the given extension.
 * Uses timestamp + random suffix to avoid collisions.
 */
export function tempFilePath(extension: string): string {
	const id =
		Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
	return path.join(os.tmpdir(), `obsidian-lens-${id}.${extension}`);
}

/**
 * Delete a file at the given path. Swallows errors silently (temp file cleanup
 * should never interrupt the user's workflow).
 */
export function cleanupFile(filePath: string): void {
	try {
		if (filePath) {
			fs.unlinkSync(filePath);
		}
	} catch {
		// Ignore — temp file may have already been removed
	}
}
