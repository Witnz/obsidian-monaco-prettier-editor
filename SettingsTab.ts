import { App, PluginSettingTab, Setting } from "obsidian";
import MonacoPrettierPlugin from "./main";
import { BUILT_IN_THEMES, THEME_PRESETS } from "./ThemeManager";

export class MonacoPrettierSettingTab extends PluginSettingTab {
	plugin: MonacoPrettierPlugin;

	constructor(app: App, plugin: MonacoPrettierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Monaco Prettier Editor Settings" });

		// File Extensions
		containerEl.createEl("h3", { text: "File Extensions" });
		new Setting(containerEl)
			.setName("Supported file extensions")
			.setDesc("Comma-separated list of file extensions to open with Monaco editor")
			.addText((text) =>
				text
					.setPlaceholder("ts,js,json,css,html")
					.setValue(this.plugin.settings.fileExtensions.join(","))
					.onChange(async (value) => {
						this.plugin.settings.fileExtensions = value
							.split(",")
							.map((ext) => ext.trim())
							.filter((ext) => ext.length > 0);
						await this.plugin.saveSettings();
					})
			);

		// Editor Settings
		containerEl.createEl("h3", { text: "Editor Settings" });
		
		new Setting(containerEl)
			.setName("Font size")
			.setDesc("Editor font size in pixels")
			.addSlider((slider) =>
				slider
					.setLimits(10, 24, 1)
					.setValue(this.plugin.settings.fontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.fontSize = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Font family")
			.setDesc("Editor font family (supports multiple fallback fonts)")
			.addText((text) =>
				text
					.setPlaceholder("'Fira Code', Consolas, monospace")
					.setValue(this.plugin.settings.fontFamily)
					.onChange(async (value) => {
						this.plugin.settings.fontFamily = value || "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Font ligatures")
			.setDesc("Enable font ligatures (requires a font that supports them, like Fira Code)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.fontLigatures)
					.onChange(async (value) => {
						this.plugin.settings.fontLigatures = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show line numbers")
			.setDesc("Display line numbers in the editor")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.lineNumbers)
					.onChange(async (value) => {
						this.plugin.settings.lineNumbers = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show minimap")
			.setDesc("Display code minimap on the right side")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.minimap)
					.onChange(async (value) => {
						this.plugin.settings.minimap = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Word wrap")
			.setDesc("Wrap long lines")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.wordWrap)
					.onChange(async (value) => {
						this.plugin.settings.wordWrap = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Code folding")
			.setDesc("Enable code block folding")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.folding)
					.onChange(async (value) => {
						this.plugin.settings.folding = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Semantic validation")
			.setDesc("Enable semantic validation for TypeScript/JavaScript (checks types, imports, etc.)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.semanticValidation)
					.onChange(async (value) => {
						this.plugin.settings.semanticValidation = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Syntax validation")
			.setDesc("Enable syntax validation for TypeScript/JavaScript (checks for syntax errors)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.syntaxValidation)
					.onChange(async (value) => {
						this.plugin.settings.syntaxValidation = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Lightweight syntax validation")
			.setDesc("Enable syntax error detection for JSON, YAML, Python, CSS (lightweight, no language server)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.lightweightValidation)
					.onChange(async (value) => {
						this.plugin.settings.lightweightValidation = value;
						await this.plugin.saveSettings();
					})
			);

		// Tree-sitter toggle hidden for now (planned feature)
		// new Setting(containerEl)
		// 	.setName("Advanced tree-sitter validation")
		// 	.setDesc("Enable professional-grade parsing for Python, JavaScript, TypeScript, JSON, CSS, Go, Rust. Uses tree-sitter parsers (~10-15MB bundle increase). Disable for smaller bundle size.")
		// 	.addToggle((toggle) =>
		// 		toggle
		// 			.setValue(this.plugin.settings.enableTreeSitter)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.enableTreeSitter = value;
		// 				await this.plugin.saveSettings();
		// 			})
		// 	);

		new Setting(containerEl)
			.setName("Internal link previews")
			.setDesc("Show Monaco editor preview when hovering over internal links to code files")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.linkPreviews)
					.onChange(async (value) => {
						this.plugin.settings.linkPreviews = value;
						await this.plugin.saveSettings();
						// Restart link preview manager
						if (value && this.plugin.linkPreviewManager) {
							this.plugin.linkPreviewManager.start();
						} else if (this.plugin.linkPreviewManager) {
							this.plugin.linkPreviewManager.stop();
						}
					})
			);

		new Setting(containerEl)
			.setName("Auto-detect programming language")
			.setDesc("Automatically detect the programming language from code content when file extension is ambiguous or missing")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoDetectLanguage)
					.onChange(async (value) => {
						this.plugin.settings.autoDetectLanguage = value;
						await this.plugin.saveSettings();
					})
			);

		// Prettier Settings
		containerEl.createEl("h3", { text: "Prettier Formatting" });

		new Setting(containerEl)
			.setName("Format on save")
			.setDesc("Automatically format files when saving")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.formatOnSave)
					.onChange(async (value) => {
						this.plugin.settings.formatOnSave = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Format on type")
			.setDesc("Automatically format code while typing (with 1s delay)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.formatOnType)
					.onChange(async (value) => {
						this.plugin.settings.formatOnType = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Tab width")
			.setDesc("Number of spaces per indentation level")
			.addSlider((slider) =>
				slider
					.setLimits(2, 8, 1)
					.setValue(this.plugin.settings.tabWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.tabWidth = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Use tabs")
			.setDesc("Use tabs instead of spaces for indentation")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useTabs)
					.onChange(async (value) => {
						this.plugin.settings.useTabs = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Semicolons")
			.setDesc("Add semicolons at the end of statements")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.semi)
					.onChange(async (value) => {
						this.plugin.settings.semi = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Single quotes")
			.setDesc("Use single quotes instead of double quotes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.singleQuote)
					.onChange(async (value) => {
						this.plugin.settings.singleQuote = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Trailing commas")
			.setDesc("Add trailing commas wherever possible")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("none", "None")
					.addOption("es5", "ES5 (objects, arrays)")
					.addOption("all", "All (including function parameters)")
					.setValue(this.plugin.settings.trailingComma)
					.onChange(async (value: "none" | "es5" | "all") => {
						this.plugin.settings.trailingComma = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Bracket spacing")
			.setDesc("Add spaces between brackets in object literals")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.bracketSpacing)
					.onChange(async (value) => {
						this.plugin.settings.bracketSpacing = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Arrow function parentheses")
			.setDesc("Include parentheses around arrow function parameters")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("always", "Always")
					.addOption("avoid", "Avoid when possible")
					.setValue(this.plugin.settings.arrowParens)
					.onChange(async (value: "always" | "avoid") => {
						this.plugin.settings.arrowParens = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Print width")
			.setDesc("Maximum line length (Prettier will try to wrap lines)")
			.addSlider((slider) =>
				slider
					.setLimits(40, 120, 10)
					.setValue(this.plugin.settings.printWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.printWidth = value;
						await this.plugin.saveSettings();
					})
			);

		// Theme Settings
		containerEl.createEl("h3", { text: "Theme" });

		new Setting(containerEl)
			.setName("Editor theme")
			.setDesc("Choose a color theme for the Monaco editor")
			.addDropdown((dropdown) => {
				// Add built-in themes
				BUILT_IN_THEMES.forEach((theme) => {
					dropdown.addOption(theme.id, theme.name);
				});

				// Add separator
				dropdown.addOption("separator", "――――――――");

				// Add preset themes
				Object.entries(THEME_PRESETS).forEach(([id, theme]) => {
					dropdown.addOption(id, theme.name || id);
				});

				// Set current value
				dropdown.setValue(this.plugin.settings.selectedTheme);

				dropdown.onChange(async (value) => {
					if (value === "separator") return; // Ignore separator
					this.plugin.settings.selectedTheme = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Import custom theme")
			.setDesc("Load a VS Code theme JSON file from your vault")
			.addText((text) => {
				text
					.setPlaceholder("path/to/theme.json")
					.setValue("");
				text.inputEl.style.width = "300px";
				return text;
			})
			.addButton((button) => {
				button
					.setButtonText("Load")
					.onClick(async () => {
						const inputEl = button.buttonEl.parentElement?.querySelector("input");
						const path = inputEl?.value;
						if (!path) return;

						const themeId = await this.plugin.themeManager.loadThemeFromFile(path);
						if (themeId) {
							this.plugin.settings.selectedTheme = themeId;
							await this.plugin.saveSettings();
							// Refresh settings to show new theme in dropdown
							this.display();
						}
					});
			});

		containerEl.createEl("h4", { text: "Import from VS Code Marketplace" });

		new Setting(containerEl)
			.setName("Extension ID")
			.setDesc("Load themes from marketplace by extension ID (e.g., Avetis.tokyo-night)")
			.addText((text) => {
				text
					.setPlaceholder("publisher.extensionName")
					.setValue("");
				text.inputEl.style.width = "300px";
				return text;
			})
			.addButton((button) => {
				button
					.setButtonText("Load")
					.onClick(async () => {
						const inputEl = button.buttonEl.parentElement?.querySelector("input");
						const extensionId = inputEl?.value;
						if (!extensionId) return;

						const themeIds = await this.plugin.themeManager.loadThemesFromMarketplace(extensionId);
						if (themeIds.length > 0) {
							// Select first theme from extension
							this.plugin.settings.selectedTheme = themeIds[0];
							await this.plugin.saveSettings();
							this.display();
						}
					});
			});

		new Setting(containerEl)
			.setName("Marketplace URL")
			.setDesc("Load themes from marketplace URL")
			.addText((text) => {
				text
					.setPlaceholder("https://marketplace.visualstudio.com/items?itemName=...")
					.setValue("");
				text.inputEl.style.width = "300px";
				return text;
			})
			.addButton((button) => {
				button
					.setButtonText("Load")
					.onClick(async () => {
						const inputEl = button.buttonEl.parentElement?.querySelector("input");
						const url = inputEl?.value;
						if (!url) return;

						const themeIds = await this.plugin.themeManager.loadThemesFromMarketplaceURL(url);
						if (themeIds.length > 0) {
							this.plugin.settings.selectedTheme = themeIds[0];
							await this.plugin.saveSettings();
							this.display();
						}
					});
			});

		new Setting(containerEl)
			.setName("Local VSIX file")
			.setDesc("Load themes from a VSIX file in your vault")
			.addText((text) => {
				text
					.setPlaceholder("path/to/extension.vsix")
					.setValue("");
				text.inputEl.style.width = "300px";
				return text;
			})
			.addButton((button) => {
				button
					.setButtonText("Load")
					.onClick(async () => {
						const inputEl = button.buttonEl.parentElement?.querySelector("input");
						const path = inputEl?.value;
						if (!path) return;

						const themeIds = await this.plugin.themeManager.loadThemesFromVSIX(path);
						if (themeIds.length > 0) {
							this.plugin.settings.selectedTheme = themeIds[0];
							await this.plugin.saveSettings();
							this.display();
						}
					});
			});

		new Setting(containerEl)
			.setName("Transparent background")
			.setDesc("Make editor background transparent to blend with Obsidian theme")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.transparentBackground)
					.onChange(async (value) => {
						this.plugin.settings.transparentBackground = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("p", {
			text: "Note: Changes to most settings require reopening files to take effect.",
			cls: "setting-item-description",
		});
	}
}
