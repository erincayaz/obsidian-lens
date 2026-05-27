import * as path from "path";
import {FileSystemAdapter, Notice} from "obsidian";
import ObsidianLens from "../main";
import {captureScreenRegion} from "../services/capture";
import {runOCR} from "../services/swift-runner";
import {cleanupFile} from "../utils/temp-file";
import {LensError, showErrorNotice} from "../utils/errors";

export function registerCommands(plugin: ObsidianLens): void {
	plugin.addCommand({
		id: "capture-and-ocr",
		name: "Capture screen region and run OCR",
		editorCallback: async (editor, view) => {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const vaultBasePath = adapter.getBasePath();
			const pluginDir = path.join(
				vaultBasePath,
				plugin.app.vault.configDir,
				"plugins",
				plugin.manifest.id,
			);
			const swiftScriptPath = path.join(
				pluginDir,
				"assets",
				"ocr.swift",
			);

			try {
				// Step 1: Screen capture
				const imagePath = await captureScreenRegion();
				if (!imagePath) {
					return;
				}

				// Show a processing notice while OCR runs
				const processingNotice = new Notice("OCR is processing…", 0);

				try {
					// Step 2: Run OCR
					const text = await runOCR(
						swiftScriptPath,
						imagePath,
						plugin.settings!.language,
					);

					// Step 3: Insert recognized text at cursor
					editor.replaceSelection(text);
				} finally {
					// Dismiss the processing notice
					processingNotice.hide();
				}

				// Step 6: Clean up the temp image
				cleanupFile(imagePath);
			} catch (error) {
				console.error("[Obsidian Lens]", error);
				showErrorNotice(error as LensError);
			}
		},
	});
}