import { TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import * as monaco from "monaco-editor";
import * as prettier from "prettier";
import MonacoPrettierPlugin from "./main";
import { LanguageDetector } from "./LanguageDetector";
import { ValidationManager } from "./ValidationManager";


export const VIEW_TYPE_MONACO_PRETTIER = "monaco-prettier-editor";

// Configure Monaco environment to disable web workers
// This prevents "Unexpected usage" errors in Obsidian's bundled environment
(self as any).MonacoEnvironment = {
	getWorker() {
		return new Worker('', { type: 'module' });
	}
};

export class MonacoPrettierView extends TextFileView {
	plugin: MonacoPrettierPlugin;
	editor: monaco.editor.IStandaloneCodeEditor | null = null;
	private formatOnTypeDisposable: monaco.IDisposable | null = null;
	private static monacoConfigured = false;
	private languageDetector: LanguageDetector;

	constructor(leaf: WorkspaceLeaf, plugin: MonacoPrettierPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.languageDetector = new LanguageDetector();
		
		// Configure Monaco environment once
		if (!MonacoPrettierView.monacoConfigured) {
			this.configureMonacoEnvironment();
			MonacoPrettierView.monacoConfigured = true;
		}
	}
	
	private configureMonacoEnvironment(): void {
		// Disable web workers to prevent module loading errors
		(window as any).MonacoEnvironment = {
			getWorker(): Worker {
				// Return a dummy worker to satisfy Monaco's requirements
				return {
					postMessage: () => {},
					addEventListener: () => {},
					removeEventListener: () => {},
					terminate: () => {},
				} as any;
			}
		};
	}

	getViewType(): string {
		return VIEW_TYPE_MONACO_PRETTIER;
	}

	getDisplayText(): string {
		return this.file?.name ?? "Monaco Prettier Editor";
	}

	async onLoadFile(file: TFile): Promise<void> {
		console.log('Monaco Prettier: onLoadFile START');
		
		// Wait for container to be ready
		await new Promise(resolve => setTimeout(resolve, 10));
		
		console.log('Monaco Prettier: contentEl dimensions:', this.contentEl.clientWidth, 'x', this.contentEl.clientHeight);
		
		// If dimensions are 0, wait a bit more
		if (this.contentEl.clientWidth === 0 || this.contentEl.clientHeight === 0) {
			console.log('Monaco Prettier: Container not ready, waiting...');
			await new Promise(resolve => setTimeout(resolve, 100));
			console.log('Monaco Prettier: After wait, dimensions:', {
				clientWidth: this.contentEl.clientWidth,
				clientHeight: this.contentEl.clientHeight
			});
		}
		
		// Create Monaco editor settings
		const settings = this.plugin.settings;
		
		// Determine theme to use
		let theme = settings.selectedTheme;
		if (settings.transparentBackground) {
			theme = this.plugin.themeManager.createTransparentTheme(theme);
		}
		
		// Apply selected theme
		this.plugin.themeManager.applyTheme(settings.selectedTheme);
		
		// Configure TypeScript/JavaScript validation settings
		this.configureLanguageDefaults();
		
		console.log('Monaco Prettier: Creating editor...');
		
		// Create Monaco editor directly in contentEl (like vscode-editor)
		this.editor = monaco.editor.create(this.contentEl, {
			automaticLayout: true,
			language: this.getLanguageFromExtension(file.extension),
			theme: theme,
			fontSize: settings.fontSize,
			fontFamily: settings.fontFamily,
			fontLigatures: settings.fontLigatures,
			lineNumbers: settings.lineNumbers ? "on" : "off",
			glyphMargin: false,
			minimap: { enabled: settings.minimap },
			wordWrap: settings.wordWrap ? "on" : "off",
			folding: settings.folding,
			tabSize: settings.tabWidth,
			insertSpaces: !settings.useTabs,
			scrollBeyondLastLine: false,
			renderWhitespace: "selection",
			bracketPairColorization: { enabled: true },
		});
		
		console.log('Monaco Prettier: Editor created');
		
		// Debug: Check Monaco's actual DOM
		const monacoContainer = this.contentEl.querySelector('.monaco-editor');
		if (monacoContainer) {
			const computed = window.getComputedStyle(monacoContainer as HTMLElement);
			console.log('Monaco Prettier: Monaco container found!', {
				width: computed.width,
				height: computed.height,
				display: computed.display,
				position: computed.position,
				visibility: computed.visibility,
				overflow: computed.overflow
			});
		} else {
			console.log('Monaco Prettier: ERROR - No .monaco-editor div found!');
		}

		// Listen to content changes
		this.editor.onDidChangeModelContent(async () => {
			this.requestSave();
			
			// Run lightweight syntax validation if enabled
			if (settings.lightweightValidation && this.editor) {
				const language = this.getLanguageFromExtension(file.extension);
				await ValidationManager.validateAndDisplayMarkers(
					this.editor,
					language,
					this.editor.getValue(),
					settings.enableTreeSitter
				);
			}
		});
		
		// Add keyboard handlers like vscode-editor
		this.addKeyboardEventHandlers();
		
		console.log('Monaco Prettier: Calling super.onLoadFile');
		
		// Call super which will load file and call setViewData
		await super.onLoadFile(file);
		
		console.log('Monaco Prettier: super.onLoadFile complete, forcing layout');
		
		// Force multiple layout passes to ensure proper sizing
		if (this.editor) {
			// Get actual dimensions
			const width = this.contentEl.clientWidth;
			const height = this.contentEl.clientHeight;
			console.log('Monaco Prettier: Forcing layout with dimensions:', width, 'x', height);
			
			// Force explicit layout
			this.editor.layout({ width, height });
			
			// Also use automaticLayout's internal trigger
			setTimeout(() => {
				if (this.editor) {
					this.editor.layout();
					this.editor.focus();
					console.log('Monaco Prettier: Final layout applied');
				}
			}, 50);
		}
	}
	
	// TextFileView calls this to set the file content
	setViewData(data: string, clear: boolean): void {
		console.log('Monaco Prettier: setViewData called, data length:', data?.length || 0);
		if (this.editor) {
			// If file is empty or just whitespace, add blank lines for easier clicking
			let content = data;
			if (!data || data.trim().length === 0) {
				content = '\n'.repeat(30); // Add 30 blank lines for new/empty files
			}
			
			if (clear) {
				this.editor.getModel()?.setValue(content);
			} else {
				this.editor.setValue(content);
			}
		}
	}
	
	// TextFileView calls this to get the current content
	getViewData(): string {
		const content = this.editor?.getValue() ?? "";
		// Trim trailing blank lines on save
		return content.replace(/\n+$/, '\n');
	}
	
	clear(): void {
		this.editor?.setValue('');
	}

	private configureLanguageDefaults(): void {
		// Configure JavaScript language defaults
		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: !this.plugin.settings.semanticValidation,
			noSyntaxValidation: !this.plugin.settings.syntaxValidation,
		});

		// Configure TypeScript language defaults
		monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: !this.plugin.settings.semanticValidation,
			noSyntaxValidation: !this.plugin.settings.syntaxValidation,
		});

		// Enable more helpful compiler options for better validation
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
			typeRoots: ["node_modules/@types"],
		});
	}

	private addKeyboardEventHandlers(): void {
		// Fix Obsidian's global keyboard event capture preventing Monaco shortcuts
		// Obsidian uses capture phase (useCapture=true) which blocks Monaco
		window.addEventListener('keydown', this.handleKeyDown, true);
	}

	private handleKeyDown = (event: KeyboardEvent): void => {
		if (!this.editor?.hasTextFocus()) return;

		// Map of Ctrl+key combinations that need manual triggering in Monaco
		const ctrlKeyMap = new Map<string, string>([
			['f', 'actions.find'],
			['h', 'editor.action.startFindReplaceAction'],
			['/', 'editor.action.commentLine'],
			['Enter', 'editor.action.insertLineAfter'],
			['[', 'editor.action.outdentLines'],
			[']', 'editor.action.indentLines'],
			['d', 'editor.action.copyLinesDownAction'],
		]);

		if (event.ctrlKey && ctrlKeyMap.has(event.key)) {
			event.preventDefault();
			event.stopPropagation();
			const action = ctrlKeyMap.get(event.key)!;
			this.editor.trigger('keyboard', action, null);
		}

		// Alt+Z to toggle word wrap
		if (event.altKey && event.key === 'z') {
			event.preventDefault();
			event.stopPropagation();
			this.plugin.settings.wordWrap = !this.plugin.settings.wordWrap;
			this.plugin.saveSettings();
			this.editor.updateOptions({
				wordWrap: this.plugin.settings.wordWrap ? "on" : "off",
			});
		}
	};

	private setupFormatOnType(): void {
		if (!this.editor) return;

		// Clean up previous disposable
		if (this.formatOnTypeDisposable) {
			this.formatOnTypeDisposable.dispose();
		}

		// Format on type with debouncing
		let timeout: NodeJS.Timeout;
		this.formatOnTypeDisposable = this.editor.onDidChangeModelContent(() => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				this.formatDocument();
			}, 1000);
		});
	}

	async formatDocument(): Promise<void> {
		if (!this.editor || !this.file) return;

		try {
			const currentValue = this.editor.getValue();
			const parser = this.getPrettierParser(this.file.extension);
			
			if (!parser) {
				console.log("No Prettier parser available for", this.file.extension);
				return;
			}

			const formatted = await prettier.format(currentValue, {
				parser,
				plugins: [],
				tabWidth: this.plugin.settings.tabWidth,
				useTabs: this.plugin.settings.useTabs,
				semi: this.plugin.settings.semi,
				singleQuote: this.plugin.settings.singleQuote,
				trailingComma: this.plugin.settings.trailingComma,
				bracketSpacing: this.plugin.settings.bracketSpacing,
				arrowParens: this.plugin.settings.arrowParens,
				printWidth: this.plugin.settings.printWidth,
			});

			if (formatted !== currentValue) {
				const position = this.editor.getPosition();
				this.editor.setValue(formatted);
				if (position) {
					this.editor.setPosition(position);
				}
			}
		} catch (error) {
			console.error("Prettier formatting error:", error);
		}
	}

	private getLanguageFromExtension(ext: string): string {
		// Use LanguageDetector with auto-detection if enabled
		if (this.plugin.settings.autoDetectLanguage && this.editor) {
			const content = this.editor.getValue();
			return this.languageDetector.getLanguageFromExtension(ext, content);
		}
		// Fall back to extension-only detection
		return this.languageDetector.getLanguageFromExtension(ext);
	}

	private getPrettierParser(ext: string): string | null {
		const parserMap: Record<string, string> = {
			ts: "typescript",
			tsx: "typescript",
			js: "babel",
			jsx: "babel",
			json: "json",
			css: "css",
			scss: "scss",
			less: "less",
			html: "html",
			md: "markdown",
			yaml: "yaml",
			yml: "yaml",
		};
		return parserMap[ext] || null;
	}

	async onUnloadFile(file: TFile): Promise<void> {
		// Clean up keyboard event listener
		window.removeEventListener('keydown', this.handleKeyDown, true);
		
		await super.onUnloadFile(file);
		
		if (this.editor) {
			this.editor.dispose();
			this.editor = null;
		}
		if (this.formatOnTypeDisposable) {
			this.formatOnTypeDisposable.dispose();
			this.formatOnTypeDisposable = null;
		}
	}

	// Handle window resize
	onResize(): void {
		if (this.editor) {
			this.editor.layout();
		}
	}

	async onClose(): Promise<void> {
		if (this.editor) {
			this.editor.dispose();
			this.editor = null;
		}
		return super.onClose();
	}
}
