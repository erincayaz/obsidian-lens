import * as path from "path";
import { Plugin, FileSystemAdapter } from "obsidian";
import { LensSettings, DEFAULT_SETTINGS, LensSettingTab } from "./settings";
import { registerCommands } from "./commands/ocr-command";
import { deployScripts } from "./services/deploy-scripts";

export default class ObsidianLens extends Plugin {
	settings: LensSettings | undefined;
	
	assetsPath!: string;

	async onload() {
		await this.loadSettings();

		// Deploy platform OCR scripts to the plugin folder inside the vault
		this.deployPluginScripts();

		// Register the OCR command
		registerCommands(this);

		// Add settings tab
		this.addSettingTab(new LensSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup is handled automatically via register* helpers
	}

	private deployPluginScripts() {
		const adapter = this.app.vault.adapter as FileSystemAdapter;
		const vaultBasePath = adapter.getBasePath();
		const pluginDir = path.join(
			vaultBasePath,
			this.app.vault.configDir,
			"plugins",
			this.manifest.id,
		);
		this.assetsPath = deployScripts(pluginDir);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<LensSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
