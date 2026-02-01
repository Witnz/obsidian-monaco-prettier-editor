import { Modal, Notice } from "obsidian";
import * as monaco from "monaco-editor";
import MonacoPrettierPlugin from "./main";
import { FenceEditContext } from "./FenceEditContext";
import { ValidationManager } from "./ValidationManager";

/**
 * Modal that opens a Monaco editor instance to edit a code block
 */
export class FenceEditModal extends Modal {
	private monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;
	private editorContainer: HTMLElement;

	private constructor(
		private plugin: MonacoPrettierPlugin,
		private code: string,
		private language: string,
		private onSave: (changedCode: string) => void
	) {
		super(plugin.app);
	}

	onOpen() {
		super.onOpen();

		// Set modal size
		this.modalEl.setCssProps({
			"--dialog-width": "90vw",
			"--dialog-height": "90vh",
		});
		this.modalEl.style.height = "var(--dialog-height)";

		// Style close button
		const closeButton = this.modalEl.querySelector<HTMLDivElement>(
			".modal-close-button"
		);
		if (closeButton) {
			closeButton.style.background = "var(--modal-background)";
			closeButton.style.zIndex = "9999";
		}

		// Create editor container
		this.editorContainer = this.contentEl.createDiv();
		this.editorContainer.style.width = "100%";
		this.editorContainer.style.height = "calc(90vh - 60px)"; // Account for modal header

		// Initialize Monaco editor
		this.initializeMonaco();
	}

	private initializeMonaco() {
		const settings = this.plugin.settings;

		// Configure language validation
		this.configureLanguageDefaults();

		// Apply selected theme
		this.plugin.themeManager.applyTheme(settings.selectedTheme);

		// Determine theme to use
		let theme = settings.selectedTheme;
		if (settings.transparentBackground) {
			theme = this.plugin.themeManager.createTransparentTheme(theme);
		}

		// Create editor
		this.monacoEditor = monaco.editor.create(this.editorContainer, {
			value: this.code,
			language: this.language,
			theme: theme,
			automaticLayout: true,
			fontSize: settings.fontSize,
			fontFamily: settings.fontFamily,
			fontLigatures: settings.fontLigatures,
			lineNumbers: settings.lineNumbers ? "on" : "off",
			minimap: { enabled: settings.minimap },
			wordWrap: settings.wordWrap ? "on" : "off",
			folding: settings.folding,
			scrollBeyondLastLine: false,
			tabSize: settings.tabWidth,
			insertSpaces: !settings.useTabs,
			cursorBlinking: "smooth",
			smoothScrolling: true,
		});

		// Listen to content changes for validation
		if (settings.lightweightValidation) {
			this.monacoEditor.onDidChangeModelContent(async () => {
				if (this.monacoEditor) {
					const code = this.monacoEditor.getValue();
					await ValidationManager.validateAndDisplayMarkers(
						this.monacoEditor,
						this.language,
						code,
						settings
					);
				}
			});

			// Run initial validation
			setTimeout(async () => {
				if (this.monacoEditor) {
					await ValidationManager.validateAndDisplayMarkers(
						this.monacoEditor,
						this.language,
						this.code,
						settings
					);
				}
			}, 100);
		}
	}

	private configureLanguageDefaults(): void {
		const settings = this.plugin.settings;

		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: !settings.semanticValidation,
			noSyntaxValidation: !settings.syntaxValidation,
		});

		monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: !settings.semanticValidation,
			noSyntaxValidation: !settings.syntaxValidation,
		});

		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES2020,
			allowNonTsExtensions: true,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			allowJs: true,
			checkJs: false,
		});

		monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES2020,
			allowNonTsExtensions: true,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			jsx: monaco.languages.typescript.JsxEmit.React,
			allowJs: true,
		});
	}

	onClose() {
		super.onClose();

		// Save the edited code
		if (this.monacoEditor) {
			this.onSave(this.monacoEditor.getValue());
			this.monacoEditor.dispose();
			this.monacoEditor = null;
		}
	}

	/**
	 * Static factory method to open the modal on the current code block
	 */
	static openOnCurrentCode(plugin: MonacoPrettierPlugin) {
		const context = FenceEditContext.create(plugin);

		if (!context.isInFence()) {
			new Notice("Your cursor is not in a valid code block.");
			return;
		}

		const fenceData = context.getFenceData();

		if (!fenceData) {
			new Notice("Could not extract code block data.");
			return;
		}

		new FenceEditModal(
			plugin,
			fenceData.content,
			fenceData.language,
			(value) => context.replaceFenceContent(value)
		).open();
	}
}
