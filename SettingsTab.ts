import { App, PluginSettingTab, Setting, Notice, Modal, requestUrl } from "obsidian";
import MonacoPrettierPlugin from "./main";
import { BUILT_IN_THEMES, THEME_PRESETS } from "./ThemeManager";
import type { TreeSitterLanguageParser } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";

type SettingsTabType = 'general' | 'editor' | 'formatting' | 'theme';

export class MonacoPrettierSettingTab extends PluginSettingTab {
	plugin: MonacoPrettierPlugin;
	private activeTab: SettingsTabType = 'general';

	constructor(app: App, plugin: MonacoPrettierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Monaco Prettier Editor Settings" });

		// Create tab navigation
		const tabContainer = containerEl.createDiv({ cls: "monaco-settings-tabs" });
		
		const tabs: { id: SettingsTabType; label: string }[] = [
			{ id: 'general', label: 'General' },
			{ id: 'editor', label: 'Editor' },
			{ id: 'formatting', label: 'Formatting' },
			{ id: 'theme', label: 'Theme' }
		];

		tabs.forEach(tab => {
			const button = tabContainer.createEl("button", {
				text: tab.label,
				cls: this.activeTab === tab.id ? "monaco-tab-active" : ""
			});
			button.addEventListener("click", () => {
				this.activeTab = tab.id;
				this.display();
			});
		});

		// Create content container
		const contentEl = containerEl.createDiv({ cls: "monaco-settings-content" });

		// Render active tab
		switch (this.activeTab) {
			case 'general':
				this.displayGeneralSettings(contentEl);
				break;
			case 'editor':
				this.displayEditorSettings(contentEl);
				break;
			case 'formatting':
				this.displayFormattingSettings(contentEl);
				break;
			case 'theme':
				this.displayThemeSettings(contentEl);
				break;
		}
	}

	private displayGeneralSettings(containerEl: HTMLElement): void {
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

		// Feature Toggles
		containerEl.createEl("h3", { text: "Features" });

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
	}

	private displayEditorSettings(containerEl: HTMLElement): void {
		// Font Settings
		containerEl.createEl("h3", { text: "Font" });
		
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ fontSize: value });
							}
						});
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ fontFamily: this.plugin.settings.fontFamily });
							}
						});
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ fontLigatures: value });
							}
						});
					})
			);

		// Display Settings
		containerEl.createEl("h3", { text: "Display" });

		new Setting(containerEl)
			.setName("Show line numbers")
			.setDesc("Display line numbers in the editor")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.lineNumbers)
					.onChange(async (value) => {
						this.plugin.settings.lineNumbers = value;
						await this.plugin.saveSettings();
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ lineNumbers: value ? 'on' : 'off' });
							}
						});
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ minimap: { enabled: value } });
							}
						});
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ wordWrap: value ? 'on' : 'off' });
							}
						});
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ folding: value });
							}
						});
					})
			);

		// Inline Error Messages
		containerEl.createEl("h3", { text: "Inline Error Messages" });

		new Setting(containerEl)
			.setName("Inline error font")
			.setDesc("Font family for inline error and warning messages")
			.addText((text) =>
				text
					.setPlaceholder("'Cascadia Code', Consolas, monospace")
					.setValue(this.plugin.settings.inlineErrorFont)
					.onChange(async (value) => {
						this.plugin.settings.inlineErrorFont = value || DEFAULT_SETTINGS.inlineErrorFont;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Inline error font size")
			.setDesc("Font size for inline error messages (in pixels)")
			.addText((text) =>
				text
					.setPlaceholder("12")
					.setValue(String(this.plugin.settings.inlineErrorFontSize))
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0 && numValue <= 24) {
							this.plugin.settings.inlineErrorFontSize = numValue;
							await this.plugin.saveSettings();
						}
					})
			);
		
		// Advanced Settings
		containerEl.createEl("h3", { text: "Advanced" });

		new Setting(containerEl)
			.setName("Enable Tree-sitter")
			.setDesc("Use advanced tree-sitter parsing for better syntax validation. Requires language parser downloads (see below).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTreeSitter)
					.onChange(async (value) => {
						this.plugin.settings.enableTreeSitter = value;
						await this.plugin.saveSettings();
					})
			);

		// Tree-sitter Language Parsers Section
		containerEl.createEl("h4", { text: "Tree-sitter Language Parsers" });
		
		const parserDescEl = containerEl.createEl("div", { cls: "setting-item-description" });
		parserDescEl.style.marginBottom = "1em";
		parserDescEl.setText(
			"Download language-specific parsers for advanced syntax validation. " +
			"Parsers are stored locally and loaded from your vault."
		);

		const parsers = this.plugin.settings.treeSitterParsers;
		const sortedLanguages = Object.keys(parsers).sort((a, b) => 
			parsers[a].displayName.localeCompare(parsers[b].displayName)
		);

		for (const lang of sortedLanguages) {
			const parser = parsers[lang];
			const setting = new Setting(containerEl);
			
			// Create status badge
			const statusBadge = setting.nameEl.createSpan({ cls: "monaco-parser-status" });
			if (parser.installed) {
				statusBadge.setText("✓ Installed");
				statusBadge.style.color = "var(--text-success)";
			} else {
				statusBadge.setText("○ Not installed");
				statusBadge.style.color = "var(--text-muted)";
			}
			statusBadge.style.fontSize = "0.85em";
			statusBadge.style.marginLeft = "0.5em";

			setting
				.setName(parser.displayName)
				.setDesc(`Version ${parser.version}${parser.size ? ` • ${(parser.size / 1024).toFixed(1)} KB` : ""}`);

			// Download/Remove button
			if (parser.installed) {
				setting.addButton((button) =>
					button
						.setButtonText("Remove")
						.setCta()
						.onClick(async () => {
							button.setDisabled(true);
							button.setButtonText("Removing...");
							await this.removeParser(lang);
							button.setButtonText("Download");
							button.setCta();
							button.setDisabled(false);
							statusBadge.setText("○ Not installed");
							statusBadge.style.color = "var(--text-muted)";
							this.display(); // Refresh display
						})
				);
			} else {
				setting.addButton((button) =>
					button
						.setButtonText("Download")
						.setCta()
						.onClick(async () => {
							button.setDisabled(true);
							button.setButtonText("Downloading...");
							const success = await this.downloadParser(lang);
							if (success) {
								button.setButtonText("Remove");
								statusBadge.setText("✓ Installed");
								statusBadge.style.color = "var(--text-success)";
							} else {
								button.setButtonText("Retry");
								button.setDisabled(false);
							}
							this.display(); // Refresh display
						})
				);
			}

			// Info button with details
			setting.addExtraButton((button) =>
				button
					.setIcon("info")
					.setTooltip("View parser details")
					.onClick(() => {
						const modal = new ParserInfoModal(this.app, parser);
						modal.open();
					})
			);
		}

		// Bulk actions
		const bulkActionsDiv = containerEl.createDiv({ cls: "monaco-bulk-actions" });
		bulkActionsDiv.style.display = "flex";
		bulkActionsDiv.style.gap = "0.5em";
		bulkActionsDiv.style.marginTop = "1em";

		const downloadAllBtn = bulkActionsDiv.createEl("button", { text: "Download All" });
		downloadAllBtn.style.flex = "1";
		downloadAllBtn.addEventListener("click", async () => {
			downloadAllBtn.disabled = true;
			downloadAllBtn.textContent = "Downloading...";
			await this.downloadAllParsers();
			downloadAllBtn.disabled = false;
			downloadAllBtn.textContent = "Download All";
			this.display();
		});

		const removeAllBtn = bulkActionsDiv.createEl("button", { text: "Remove All" });
		removeAllBtn.style.flex = "1";
		removeAllBtn.addEventListener("click", async () => {
			removeAllBtn.disabled = true;
			removeAllBtn.textContent = "Removing...";
			await this.removeAllParsers();
			removeAllBtn.disabled = false;
			removeAllBtn.textContent = "Remove All";
			this.display();
		});

		new Setting(containerEl)
			.setName("Console logging to file")
			.setDesc("Log all console output to 'monaco-prettier-console.log' in vault root (requires restart)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableConsoleLogging)
					.onChange(async (value) => {
						this.plugin.settings.enableConsoleLogging = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private displayFormattingSettings(containerEl: HTMLElement): void {
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
						
						// Update all open Monaco editors immediately
						this.plugin.app.workspace.iterateAllLeaves((leaf) => {
							const view = leaf.view as any;
							if (view.editor?.updateOptions) {
								view.editor.updateOptions({ tabSize: value });
							}
						});
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
	}

	private displayThemeSettings(containerEl: HTMLElement): void {
		// Theme Selection
		containerEl.createEl("h3", { text: "Theme Selection" });

		new Setting(containerEl)
			.setName("Editor theme")
			.setDesc("Choose a color theme for the Monaco editor")
			.addDropdown((dropdown) => {
				// Get all available themes from ThemeManager
				const availableThemes = this.plugin.themeManager.getAvailableThemes();
				
				// Group themes by type
				const builtInThemes = availableThemes.filter(t => t.type === "builtin");
				const presetThemes = availableThemes.filter(t => t.type === "preset");
				const customThemes = availableThemes.filter(t => t.type === "custom");
				
				// Add built-in themes
				builtInThemes.forEach((theme) => {
					dropdown.addOption(theme.id, theme.name);
				});

				// Add separator if there are presets or custom themes
				if (presetThemes.length > 0 || customThemes.length > 0) {
					dropdown.addOption("separator1", "――――――――");
				}

				// Add preset themes
				presetThemes.forEach((theme) => {
					dropdown.addOption(theme.id, theme.name);
				});

				// Add custom themes section
				if (customThemes.length > 0) {
					dropdown.addOption("separator2", "―― Custom ――");
					customThemes.forEach((theme) => {
						dropdown.addOption(theme.id, theme.name);
					});
				}

				// Set current value
				dropdown.setValue(this.plugin.settings.selectedTheme);

				dropdown.onChange(async (value) => {
					// Ignore separators
					if (value.startsWith("separator")) return;
					this.plugin.settings.selectedTheme = value;
					await this.plugin.saveSettings();
					
					// Apply theme globally to all Monaco editors immediately
					this.plugin.themeManager.applyTheme(value);
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
						
						// Apply transparent background immediately
						this.plugin.themeManager.applyTheme(this.plugin.settings.selectedTheme);
					})
			);

		// Theme Management
		containerEl.createEl("h3", { text: "Manage Custom Themes" });

		const availableThemes = this.plugin.themeManager.getAvailableThemes();
		const customThemes = availableThemes.filter(t => t.type === "custom");

		if (customThemes.length > 0) {
			new Setting(containerEl)
				.setName("Delete custom theme")
				.setDesc("Remove a custom theme from your collection")
				.addDropdown((dropdown) => {
					customThemes.forEach((theme) => {
						dropdown.addOption(theme.id, theme.name);
					});
					return dropdown;
				})
				.addButton((button) => {
					button
						.setButtonText("Delete")
						.setWarning()
						.onClick(async () => {
							const dropdown = button.buttonEl.parentElement?.querySelector("select") as HTMLSelectElement;
							const themeId = dropdown?.value;
							if (!themeId) return;

							const themeName = customThemes.find(t => t.id === themeId)?.name || themeId;
							
							if (await this.plugin.themeManager.deleteCustomTheme(themeId)) {
								// If deleted theme was active, switch to default
								if (this.plugin.settings.selectedTheme === themeId) {
									this.plugin.settings.selectedTheme = "vs-dark";
									await this.plugin.saveSettings();
									this.plugin.themeManager.applyTheme("vs-dark");
								}
								new Notice(`Deleted theme: ${themeName}`);
								this.display();
							}
						});
				});

			new Setting(containerEl)
				.setName("Clear all custom themes")
				.setDesc(`Remove all ${customThemes.length} custom theme(s) from your collection`)
				.addButton((button) => {
					button
						.setButtonText("Clear All")
						.setWarning()
						.onClick(async () => {
							await this.plugin.themeManager.clearAllCustomThemes();
							
							// Switch to default if current theme was custom
							const wasCustom = customThemes.some(t => t.id === this.plugin.settings.selectedTheme);
							if (wasCustom) {
								this.plugin.settings.selectedTheme = "vs-dark";
								await this.plugin.saveSettings();
								this.plugin.themeManager.applyTheme("vs-dark");
							}
							
							new Notice(`Cleared ${customThemes.length} custom theme(s)`);
							this.display();
						});
				});
		} else {
			containerEl.createEl("p", {
				text: "No custom themes loaded yet. Import themes below to get started.",
				cls: "setting-item-description"
			});
		}

		// Theme Loading
		containerEl.createEl("h3", { text: "Load Custom Themes" });

		containerEl.createEl("h4", { text: "From Local Files" });

		new Setting(containerEl)
			.setName("Theme file path")
			.setDesc("Load a theme from your vault (JSON theme file or VSIX extension)")
			.addText((text) => {
				text
					.setPlaceholder("path/to/theme.json or path/to/extension.vsix")
					.setValue("");
				text.inputEl.style.width = "300px";
				return text;
			})
			.addButton((button) => {
				button
					.setButtonText("Load")
					.onClick(async () => {
						const inputEl = button.buttonEl.parentElement?.querySelector("input");
						const path = inputEl?.value?.trim();
						if (!path) return;

						let themeIds: string[] = [];
						
						// Detect file type by extension
						if (path.endsWith('.vsix')) {
							themeIds = await this.plugin.themeManager.loadThemesFromVSIX(path);
						} else {
							// Assume JSON for .json or any other extension
							const themeId = await this.plugin.themeManager.loadThemeFromFile(path);
							if (themeId) themeIds = [themeId];
						}

						if (themeIds.length > 0) {
							this.plugin.settings.selectedTheme = themeIds[0];
							await this.plugin.saveSettings();
							this.display();
						}
					});
			});

		containerEl.createEl("h4", { text: "From VS Code Marketplace" });

		new Setting(containerEl)
			.setName("Extension ID or URL")
			.setDesc("Load themes from marketplace (e.g., 'Avetis.tokyo-night' or full marketplace URL)")
			.addText((text) => {
				text
					.setPlaceholder("publisher.extensionName or https://marketplace.visualstudio.com/...")
					.setValue("");
				text.inputEl.style.width = "300px";
				return text;
			})
			.addButton((button) => {
				button
					.setButtonText("Load")
					.onClick(async () => {
						const inputEl = button.buttonEl.parentElement?.querySelector("input");
						const input = inputEl?.value?.trim();
						if (!input) return;

						let themeIds: string[] = [];
						
						// Detect if input is a URL or extension ID
						if (input.startsWith("http://") || input.startsWith("https://")) {
							themeIds = await this.plugin.themeManager.loadThemesFromMarketplaceURL(input);
						} else {
							themeIds = await this.plugin.themeManager.loadThemesFromMarketplace(input);
						}

						if (themeIds.length > 0) {
							// Select first theme from extension
							this.plugin.settings.selectedTheme = themeIds[0];
							await this.plugin.saveSettings();
							this.display();
						}
					});
			});
	}

	// Tree-sitter parser management methods
	private async downloadParser(language: string): Promise<boolean> {
		const parser = this.plugin.settings.treeSitterParsers[language];
		if (!parser) {
			new Notice(`Parser not found: ${language}`);
			return false;
		}

		try {
			new Notice(`Downloading ${parser.displayName} parser...`);
			
			// Download WASM file from CDN
			const response = await requestUrl({
				url: parser.cdnUrl,
				method: 'GET'
			});

			if (response.status !== 200) {
				throw new Error(`HTTP ${response.status}: ${response.text}`);
			}

			// Ensure wasm directory exists
			const wasmDir = '.obsidian/plugins/monaco-prettier-editor/wasm';
			const adapter = this.app.vault.adapter;
			
			try {
				await adapter.mkdir(wasmDir);
			} catch (e) {
				// Directory might already exist
			}

			// Save WASM file locally
			const fileName = `tree-sitter-${language}.wasm`;
			const localPath = `${wasmDir}/${fileName}`;
			
			await adapter.writeBinary(localPath, response.arrayBuffer);

			// Update settings
			parser.installed = true;
			parser.installedVersion = parser.version;
			parser.localPath = localPath;
			parser.size = response.arrayBuffer.byteLength;
			parser.lastUpdated = Date.now();

			await this.plugin.saveSettings();
			
			new Notice(`✓ ${parser.displayName} parser downloaded successfully`);
			console.log(`✅ Downloaded parser for ${language} (${(parser.size / 1024).toFixed(1)} KB)`);
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to download parser for ${language}:`, error);
			new Notice(`Failed to download ${parser.displayName} parser: ${error.message}`);
			return false;
		}
	}

	private async removeParser(language: string): Promise<boolean> {
		const parser = this.plugin.settings.treeSitterParsers[language];
		if (!parser || !parser.installed) {
			return false;
		}

		try {
			const adapter = this.app.vault.adapter;
			
			// Delete WASM file if it exists
			if (parser.localPath) {
				try {
					await adapter.remove(parser.localPath);
				} catch (e) {
					console.warn(`Could not delete file ${parser.localPath}:`, e);
				}
			}

			// Update settings
			parser.installed = false;
			delete parser.installedVersion;
			delete parser.localPath;
			delete parser.size;
			delete parser.lastUpdated;

			await this.plugin.saveSettings();
			
			new Notice(`✓ ${parser.displayName} parser removed`);
			console.log(`✅ Removed parser for ${language}`);
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to remove parser for ${language}:`, error);
			new Notice(`Failed to remove ${parser.displayName} parser: ${error.message}`);
			return false;
		}
	}

	private async downloadAllParsers(): Promise<void> {
		const parsers = Object.keys(this.plugin.settings.treeSitterParsers);
		new Notice(`Downloading ${parsers.length} parsers...`);
		
		let successCount = 0;
		for (const lang of parsers) {
			if (!this.plugin.settings.treeSitterParsers[lang].installed) {
				const success = await this.downloadParser(lang);
				if (success) successCount++;
			}
		}
		
		new Notice(`✓ Downloaded ${successCount} of ${parsers.length} parsers`);
	}

	private async removeAllParsers(): Promise<void> {
		const parsers = Object.keys(this.plugin.settings.treeSitterParsers);
		let removeCount = 0;
		
		for (const lang of parsers) {
			if (this.plugin.settings.treeSitterParsers[lang].installed) {
				const success = await this.removeParser(lang);
				if (success) removeCount++;
			}
		}
		
		new Notice(`✓ Removed ${removeCount} parsers`);
	}
}

// Modal for displaying parser information
class ParserInfoModal extends Modal {
	parser: TreeSitterLanguageParser;

	constructor(app: App, parser: TreeSitterLanguageParser) {
		super(app);
		this.parser = parser;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: `${this.parser.displayName} Parser` });

		const infoDiv = contentEl.createDiv({ cls: "monaco-parser-info" });
		
		this.addInfoRow(infoDiv, "Language", this.parser.language);
		this.addInfoRow(infoDiv, "Version", this.parser.version);
		this.addInfoRow(infoDiv, "Status", this.parser.installed ? "✓ Installed" : "○ Not installed");
		
		if (this.parser.installed) {
			this.addInfoRow(infoDiv, "Installed Version", this.parser.installedVersion || "Unknown");
			if (this.parser.size) {
				this.addInfoRow(infoDiv, "Size", `${(this.parser.size / 1024).toFixed(1)} KB`);
			}
			if (this.parser.lastUpdated) {
				const date = new Date(this.parser.lastUpdated);
				this.addInfoRow(infoDiv, "Last Updated", date.toLocaleString());
			}
			if (this.parser.localPath) {
				this.addInfoRow(infoDiv, "Local Path", this.parser.localPath);
			}
		}
		
		this.addInfoRow(infoDiv, "CDN URL", this.parser.cdnUrl);

		const noteDiv = contentEl.createDiv({ cls: "monaco-parser-note" });
		noteDiv.style.marginTop = "1em";
		noteDiv.style.padding = "0.5em";
		noteDiv.style.backgroundColor = "var(--background-secondary)";
		noteDiv.style.borderRadius = "4px";
		noteDiv.setText(
			"Tree-sitter parsers provide advanced syntax analysis for their respective languages. " +
			"They are downloaded from jsDelivr CDN and stored locally in your vault."
		);

		const closeBtn = contentEl.createEl("button", { text: "Close" });
		closeBtn.style.marginTop = "1em";
		closeBtn.addEventListener("click", () => this.close());
	}

	private addInfoRow(container: HTMLElement, label: string, value: string) {
		const row = container.createDiv({ cls: "monaco-parser-info-row" });
		row.style.display = "flex";
		row.style.marginBottom = "0.5em";
		
		const labelEl = row.createSpan({ text: label + ":" });
		labelEl.style.fontWeight = "bold";
		labelEl.style.minWidth = "140px";
		
		const valueEl = row.createSpan({ text: value });
		valueEl.style.wordBreak = "break-all";
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
