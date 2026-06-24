import * as path from "path";
import { Notice } from "obsidian";
import { FileSystemAdapter } from "obsidian";
import ObsidianLens from "../main";
import { resolveBackend } from "../services/backend-factory";
import { LensError, showErrorNotice } from "../utils/errors";

export function registerCommands(plugin: ObsidianLens): void {
	plugin.addCommand({
		id: "capture-and-ocr",
		name: "Capture screen region and run OCR",
		editorCallback: async (editor) => {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const vaultBasePath = adapter.getBasePath();
			const pluginDir = path.join(
				vaultBasePath,
				plugin.app.vault.configDir,
				"plugins",
				plugin.manifest.id,
			);
			const scriptName =
				process.platform === "darwin" ? "ocr.swift" : "ocr.ps1";
			const scriptPath = path.join(pluginDir, "assets", scriptName);

			const backend = resolveBackend(scriptPath);

			try {
				// Step 1: Screen capture
				const { imagePath } = await backend.captureRegion();
				if (!imagePath) {
					return;
				}

				// Show a processing notice while OCR runs
				const processingNotice = new Notice("OCR is processing…", 0);

				try {
					// Step 2: Run OCR
					const { text } = await backend.runOcr(
						imagePath,
						plugin.settings!.language,
					);

					// Step 3: Insert recognized text at cursor
					editor.replaceSelection(text);
				} finally {
					// Dismiss the processing notice
					processingNotice.hide();
				}

				// Step 4: Clean up the temp image
				backend.cleanup([imagePath]);
			} catch (error) {
				console.error("[Obsidian Lens]", error);
				showErrorNotice(error as LensError);
			}
		},
	});
}
