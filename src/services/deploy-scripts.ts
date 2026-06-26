import * as fs from "fs";
import * as path from "path";

/**
 * Script files inlined at compile time by esbuild's "text" loader.
 * These are written to the plugin's assets/ directory inside the vault
 * on first load, so the plugin is fully self-contained.
 */
import ocrPs1 from "../../assets/ocr.ps1";
import ocrSwift from "../../assets/ocr.swift";

interface ScriptEntry {
	fileName: string;
	content: string;
}

const SCRIPTS: ScriptEntry[] = [
	{ fileName: "ocr.ps1", content: ocrPs1 },
	{ fileName: "ocr.swift", content: ocrSwift },
];

/**
 * Deploy embedded scripts to the plugin's assets directory inside the vault.
 * Creates the directory if it doesn't exist, and writes any script files
 * that are missing or whose content has changed.
 *
 * @param pluginDir — Absolute path to the plugin's folder under `.obsidian/plugins/<id>/`
 * @returns The path to the `assets/` subdirectory.
 */
export function deployScripts(pluginDir: string): string {
	const assetsDir = path.join(pluginDir, "assets");
	fs.mkdirSync(assetsDir, { recursive: true });

	for (const { fileName, content } of SCRIPTS) {
		const filePath = path.join(assetsDir, fileName);

		// Check if file already exists with the exact same content
		let needsWrite = true;
		try {
			const existing = fs.readFileSync(filePath, "utf-8");
			if (existing === content) {
				needsWrite = false;
			}
		} catch {
			// File doesn't exist or can't be read — write it
		}

		if (needsWrite) {
			fs.writeFileSync(filePath, content, "utf-8");
			console.debug(
				`[Lens OCR] Deployed ${fileName} to ${filePath}`,
			);
		}
	}

	return assetsDir;
}