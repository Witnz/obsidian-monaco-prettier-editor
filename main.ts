import { Plugin } from "obsidian";
import { MonacoPrettierView, VIEW_TYPE_MONACO_PRETTIER } from "./MonacoView";
import { MonacoPrettierSettings, DEFAULT_SETTINGS } from "./settings";
import { MonacoPrettierSettingTab } from "./SettingsTab";
import { CreateCodeFileModal } from "./CreateCodeFileModal";
import { FenceEditModal } from "./FenceEditModal";
import { ThemeManager } from "./ThemeManager";
import { LinkPreviewManager } from "./LinkPreviewManager";

export default class MonacoPrettierPlugin extends Plugin {
	settings: MonacoPrettierSettings;
	themeManager: ThemeManager;
	linkPreviewManager: LinkPreviewManager | null = null;

	async onload() {
		await this.loadSettings();

		// Initialize theme manager
		this.themeManager = new ThemeManager(this.app);
		this.themeManager.initializePresetThemes();

		// Initialize link preview manager
		this.linkPreviewManager = new LinkPreviewManager(this.app, this);
		if (this.settings.linkPreviews) {
			this.linkPreviewManager.start();
		}

		// Register the Monaco Prettier view
		this.registerView(
			VIEW_TYPE_MONACO_PRETTIER,
			(leaf) => new MonacoPrettierView(leaf, this)
		);

		// Register file extensions for Monaco editor (one by one to handle conflicts)
		const registeredExtensions: string[] = [];
		const failedExtensions: string[] = [];
		
		for (const ext of this.settings.fileExtensions) {
			try {
				this.registerExtensions([ext], VIEW_TYPE_MONACO_PRETTIER);
				registeredExtensions.push(ext);
			} catch (error) {
				failedExtensions.push(ext);
				console.warn(`Monaco Prettier: Extension "${ext}" already registered by another plugin`);
			}
		}
		
		if (registeredExtensions.length > 0) {
			console.log(`Monaco Prettier: Registered extensions: ${registeredExtensions.join(", ")}`);
		}
		
		if (failedExtensions.length > 0) {
			console.log(`Monaco Prettier: Skipped extensions (already registered): ${failedExtensions.join(", ")}`);
		}

		// Add command to open current file in Monaco editor
		this.addCommand({
			id: "open-in-monaco-prettier",
			name: "Open current file in Monaco Prettier Editor",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && this.isCodeFile(activeFile.extension)) {
					this.app.workspace.getLeaf(true).openFile(activeFile);
				}
			},
		});

		// Add command to format current file
		this.addCommand({
			id: "format-with-prettier",
			name: "Format current file with Prettier",
			callback: () => {
				const view = this.app.workspace.getActiveViewOfType(MonacoPrettierView);
				if (view) {
					view.formatDocument();
				}
			},
		});

		// Add command to create new code file
		this.addCommand({
			id: "create-code-file",
			name: "Create new code file",
			callback: () => {
				new CreateCodeFileModal(this).open();
			},
		});

		// Add command to edit code block at cursor
		this.addCommand({
			id: "edit-code-block",
			name: "Edit code block in Monaco editor",
			editorCallback: () => {
				FenceEditModal.openOnCurrentCode(this);
			},
		});

		// Add ribbon icon for creating code files
		this.addRibbonIcon("file-code", "Create code file", () => {
			new CreateCodeFileModal(this).open();
		});

		// Add file menu item for creating code files
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle("Create code file")
						.setIcon("file-code")
						.onClick(() => {
							new CreateCodeFileModal(this, file).open();
						});
				});
			})
		);

		// Add editor menu item for editing code blocks
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item
						.setTitle("Edit code block in Monaco")
						.setIcon("code")
						.onClick(() => {
							FenceEditModal.openOnCurrentCode(this);
						});
				});
			})
		);

		// Add settings tab
		this.addSettingTab(new MonacoPrettierSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	isCodeFile(extension: string): boolean {
		return this.settings.fileExtensions.includes(extension);
	}

	onunload() {
		// Stop link preview manager
		if (this.linkPreviewManager) {
			this.linkPreviewManager.stop();
			this.linkPreviewManager = null;
		}
		console.log("Monaco Prettier Plugin unloaded");
	}
}
