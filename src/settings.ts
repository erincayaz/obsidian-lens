import {App, PluginSettingTab, Setting} from "obsidian";
import ObsidianLens from "./main";

export type LanguageMode = "auto" | "tr-TR" | "en-US";

export interface LensSettings {
	language: LanguageMode;
}

export const DEFAULT_SETTINGS: LensSettings = {
	language: "auto",
};

export class LensSettingTab extends PluginSettingTab {
	plugin: ObsidianLens;

	constructor(app: App, plugin: ObsidianLens) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Obsidian Lens")
			.setHeading()
			.setDesc("Capture a screen region and digitize handwritten text via native macOS OCR.");

		new Setting(containerEl)
			.setName("OCR language")
			.setHeading();

		new Setting(containerEl)
			.setName("Language mode")
			.setDesc("Auto-detect prioritizes Turkish and English.")
			.addDropdown(dropdown => dropdown
				.addOption("auto", "Auto-detect")
				.addOption("en-US", "English")
				.addOption("tr-TR", "Turkish")
				.setValue(this.plugin.settings!.language)
				.onChange(async (value: string) => {
					this.plugin.settings!.language = value as LanguageMode;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Hotkey")
			.setHeading();

		containerEl.createEl("p", {
			text: "Bind a hotkey to the \"Capture screen region and run OCR\" command in Settings → Hotkeys.",
		});
	}
}
