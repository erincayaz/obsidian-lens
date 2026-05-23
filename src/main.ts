import {Plugin} from 'obsidian';
import {LensSettings, DEFAULT_SETTINGS, LensSettingTab} from "./settings";
import {registerCommands} from "./commands/ocr-command";

export default class ObsidianLens extends Plugin {
	settings: LensSettings;

	async onload() {
		await this.loadSettings();

		// Register the OCR command
		registerCommands(this);

		// Add settings tab
		this.addSettingTab(new LensSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup is handled automatically via register* helpers
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<LensSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
