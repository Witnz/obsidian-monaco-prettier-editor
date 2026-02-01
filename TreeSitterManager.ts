import * as monaco from "monaco-editor";
import type { TreeSitterLanguageParser } from "./settings";

/**
 * Store for inline error decorations per editor
 */
const treeSitterInlineDecorations = new WeakMap<monaco.editor.IStandaloneCodeEditor, string[]>();

// Type definitions for tree-sitter
type TreeSitterParser = any;
type SyntaxNode = any;
type Tree = any;
type ParserModule = any;

/**
 * Tree-sitter integration for advanced syntax parsing and validation
 * Provides professional-grade parsing for multiple languages
 */

export interface TreeSitterError {
	line: number;
	column: number;
	endLine: number;
	endColumn: number;
	message: string;
	severity: "error" | "warning";
}

export class TreeSitterManager {
	private static initialized = false;
	private static parsers: Map<string, TreeSitterParser> = new Map();
	private static Parser: ParserModule = null;
	private static Language: any = null;
	private static settings: Record<string, TreeSitterLanguageParser> | null = null;
	
	// Language mappings
	private static languageMap: Record<string, string> = {
		'javascript': 'javascript',
		'javascriptreact': 'javascript',
		'typescript': 'typescript',
		'typescriptreact': 'tsx',
		'tsx': 'tsx',
		'python': 'python',
		'json': 'json',
		'css': 'css',
		'scss': 'css',
		'less': 'css',
		'go': 'go',
		'rust': 'rust',
		'java': 'java',
		'cpp': 'cpp',
		'c': 'cpp',
		'sh': 'bash',
		'bash': 'bash',
		'shell': 'bash',
		'zsh': 'bash',
	};

	/**
	 * Set parser settings for checking installation status
	 */
	static setSettings(parsers: Record<string, TreeSitterLanguageParser>): void {
		this.settings = parsers;
	}
	
	/**
	 * Initialize tree-sitter with WASM
	 */
	static async initialize(): Promise<void> {
		if (this.initialized) {
			console.log('Tree-sitter already initialized');
			return;
		}
		
		console.log('🔧 Starting tree-sitter initialization...');
		
		try {
			// Dynamically import tree-sitter - use named import for Parser and Language
			console.log('Importing web-tree-sitter Parser and Language...');
			const module: any = await import('web-tree-sitter');
			console.log('Module imported, available exports:', Object.keys(module).join(', '));
			
			// Get the Parser and Language classes from named exports
			this.Parser = module.Parser;
			this.Language = module.Language;
			console.log('Parser class obtained:', typeof this.Parser);
			console.log('Language class obtained:', typeof this.Language);
			console.log('Parser.init type:', typeof this.Parser?.init);
			
			// In Obsidian plugin context, load WASM from plugin directory
			const pluginDir = (window as any).app?.vault?.adapter?.basePath;
			console.log('Plugin base path:', pluginDir);
			
			// Load WASM file using Obsidian's adapter
			let wasmBuffer: ArrayBuffer;
			if (pluginDir) {
				const adapter = (window as any).app?.vault?.adapter;
				// Use relative path from vault root
				const wasmPath = `.obsidian/plugins/monaco-prettier-editor/wasm/tree-sitter.wasm`;
				console.log('Loading WASM from vault:', wasmPath);
				
				try {
					// Read as binary using vault-relative path
					const wasmData = await adapter.readBinary(wasmPath);
					console.log('WASM data type:', typeof wasmData, 'constructor:', wasmData?.constructor?.name);
					
					// readBinary returns ArrayBuffer directly
					if (wasmData instanceof ArrayBuffer) {
						wasmBuffer = wasmData;
					} else if (wasmData?.buffer instanceof ArrayBuffer) {
						wasmBuffer = wasmData.buffer;
					} else {
						throw new Error('Unexpected WASM data format');
					}
					
					console.log('✅ WASM file loaded successfully, size:', wasmBuffer.byteLength, 'bytes');
				} catch (error) {
					console.error('Failed to read WASM file:', error);
					throw new Error(`Could not load tree-sitter WASM file: ${(error as any).message}`);
				}
			} else {
				throw new Error('Could not determine plugin directory');
			}
			
			// Initialize with the loaded WASM buffer
			await this.Parser.init({
				wasmBinary: new Uint8Array(wasmBuffer),
				locateFile: () => '' // Dummy locateFile since we're providing wasmBinary
			});
			
			this.initialized = true;
			console.log('✅ Tree-sitter initialized successfully!');
		} catch (error) {
			console.error('❌ Failed to initialize tree-sitter:', error);
			console.error('Error name:', (error as any)?.name);
			console.error('Error message:', (error as any)?.message);
			console.error('Error stack:', (error as any)?.stack);
			throw error;
		}
	}
	
	/**
	 * Get or create parser for a language
	 */
	private static async getParser(language: string): Promise<TreeSitterParser | null> {
		const treeSitterLang = this.languageMap[language];
		if (!treeSitterLang) {
			console.log(`No tree-sitter language mapping for: ${language}`);
			return null;
		}

		// Check if parser is installed in settings
		if (this.settings && this.settings[treeSitterLang] && !this.settings[treeSitterLang].installed) {
			console.log(`Parser for ${treeSitterLang} is not installed. Please download it from settings.`);
			return null;
		}
		
		// Return cached parser if available
		if (this.parsers.has(treeSitterLang)) {
			console.log(`Using cached parser for ${treeSitterLang}`);
			return this.parsers.get(treeSitterLang)!;
		}
		
		console.log(`🔄 Loading parser for ${treeSitterLang}...`);
		
		try {
			const parser = new this.Parser();
			console.log('Parser instance created');
			
			// Get vault adapter for file access
			const adapter = (window as any).app?.vault?.adapter;
			if (!adapter) {
				throw new Error('Vault adapter not available');
			}

			// Construct local WASM file path
			const localPath = `.obsidian/plugins/monaco-prettier-editor/wasm/tree-sitter-${treeSitterLang}.wasm`;
			console.log(`Loading language WASM from: ${localPath}`);
			
			// Read WASM file from vault
			const wasmData = await adapter.readBinary(localPath);
			let wasmBuffer: ArrayBuffer;
			
			if (wasmData instanceof ArrayBuffer) {
				wasmBuffer = wasmData;
			} else if (wasmData.buffer instanceof ArrayBuffer) {
				wasmBuffer = wasmData.buffer;
			} else {
				throw new Error('WASM data is not an ArrayBuffer');
			}
			
			console.log(`✅ Language WASM loaded for ${treeSitterLang}, size: ${wasmBuffer.byteLength} bytes`);
			
			// Load the language using Language.load() (Language is separate export)
			const Lang = await this.Language.load(new Uint8Array(wasmBuffer));
			console.log(`Language grammar loaded for ${treeSitterLang}`);
			
			parser.setLanguage(Lang);
			this.parsers.set(treeSitterLang, parser);
			
			console.log(`✅ Tree-sitter parser ready for ${treeSitterLang}`);
			return parser;
			
		} catch (error) {
			console.error(`❌ Failed to load tree-sitter parser for ${treeSitterLang}:`, error);
			console.error('Error details:', (error as any)?.message || error);
			
			// Provide helpful message
			if ((error as any)?.message?.includes('ENOENT') || (error as any)?.message?.includes('not found')) {
				console.error(`💡 Hint: Please download the ${treeSitterLang} parser from plugin settings`);
			}
			
			return null;
		}
	}
	
	/**
	 * Parse code and detect syntax errors
	 */
	static async parse(language: string, code: string): Promise<TreeSitterError[]> {
		console.log(`🔍 Tree-sitter parse called for ${language}, code length: ${code.length}`);
		const errors: TreeSitterError[] = [];
		
		if (!this.initialized) {
			console.log('Tree-sitter not initialized, initializing now...');
			await this.initialize();
		}
		
		const parser = await this.getParser(language);
		if (!parser) {
			// Language not supported by tree-sitter
			console.log(`Parser not available for ${language}`);
			return errors;
		}
		
		console.log(`Parsing code with tree-sitter for ${language}...`);
		console.log(`Parser object type: ${typeof parser}, has parse method: ${typeof parser.parse}`);
		
		try {
			const tree = parser.parse(code);
			const rootNode = tree.rootNode;
			
			// hasError is a property, not a method
			console.log(`Parse completed. Root node type: ${rootNode.type}, has errors: ${rootNode.hasError}`);
			
			// Find ERROR and MISSING nodes in the syntax tree
			this.findErrors(rootNode, errors, code);
			
			console.log(`Found ${errors.length} errors in syntax tree`);
			
		} catch (error) {
			console.error('Tree-sitter parsing error:', error);
			console.error('Error message:', (error as any)?.message);
			console.error('Error stack:', (error as any)?.stack);
		}
		
		return errors;
	}
	
	/**
	 * Recursively find error nodes in syntax tree
	 */
	private static findErrors(
		node: SyntaxNode,
		errors: TreeSitterError[],
		code: string
	): void {
		// Check if node is an error
		if (node.type === 'ERROR' || node.isMissing) {
			const startPos = node.startPosition;
			const endPos = node.endPosition;
			
			let message = node.isMissing 
				? `Missing ${node.type}`
				: 'Syntax error';
			
			// Try to provide more context
			if (node.parent) {
				message = `Unexpected ${node.type} in ${node.parent.type}`;
			}
			
			errors.push({
				line: startPos.row + 1,
				column: startPos.column + 1,
				endLine: endPos.row + 1,
				endColumn: endPos.column + 1,
				message,
				severity: 'error'
			});
		}
		
		// Check children
		for (let i = 0; i < node.childCount; i++) {
			const child = node.child(i);
			if (child) {
				this.findErrors(child, errors, code);
			}
		}
	}
	
	/**
	 * Get syntax tree for code analysis
	 */
	static async getSyntaxTree(language: string, code: string): Promise<Tree | null> {
		if (!this.initialized) {
			await this.initialize();
		}
		
		const parser = await this.getParser(language);
		if (!parser) return null;
		
		try {
			return parser.parse(code);
		} catch (error) {
			console.error('Failed to get syntax tree:', error);
			return null;
		}
	}
	
	/**
	 * Validate code and display markers in Monaco editor
	 */
	static async validateAndDisplayMarkers(
		editor: monaco.editor.IStandaloneCodeEditor,
		language: string,
		code: string,
		inlineFont?: string,
		inlineFontSize?: number
	): Promise<void> {
		const errors = await this.parse(language, code);
		
		const model = editor.getModel();
		if (!model) return;
		
		// Convert tree-sitter errors to Monaco markers
		const markers: monaco.editor.IMarkerData[] = errors.map(error => ({
			severity: error.severity === 'error' 
				? monaco.MarkerSeverity.Error 
				: monaco.MarkerSeverity.Warning,
			message: error.message,
			startLineNumber: error.line,
			startColumn: error.column,
			endLineNumber: error.endLine,
			endColumn: error.endColumn,
			source: 'Tree-sitter'
		}));
		
		console.log('Tree-sitter setting', markers.length, 'markers for', language);
		
		monaco.editor.setModelMarkers(model, 'tree-sitter', markers);
		
		// Add inline error messages using content widgets (since `after` property isn't supported in Monaco 0.45.0)
		// First, clear previous content widgets
		const oldWidgets = treeSitterInlineDecorations.get(editor) || [];
		oldWidgets.forEach(widgetId => {
			const widget = (editor as any)._contentWidgets?.[widgetId];
			if (widget) {
				editor.removeContentWidget(widget);
			}
		});
		
		// Create new content widgets for each error
		const widgetIds: string[] = [];
		errors.forEach((error, index) => {
			const lineContent = model.getLineContent(error.line);
			const isError = error.severity === "error";
			const widgetId = `tree-sitter-inline-${index}-${Date.now()}`;
			
			const widget = {
				getId: () => widgetId,
				getDomNode: () => {
					const node = document.createElement('span');
					node.className = isError ? 'monaco-inline-error' : 'monaco-inline-warning';
					node.textContent = ` ⚠️ ${error.message}`;
					node.style.opacity = '0.7';
				node.style.fontSize = inlineFontSize ? `${inlineFontSize}px` : '12px';
				node.style.fontFamily = inlineFont || "'Cascadia Code', 'Fira Code', Consolas, monospace";
					node.style.fontStyle = 'italic';
					node.style.paddingLeft = '0.75em';
					node.style.whiteSpace = 'nowrap';
					node.style.pointerEvents = 'none';
					node.style.userSelect = 'none';
					node.style.color = isError ? 'var(--text-error, #f48771)' : 'var(--text-warning, #ffa500)';
					return node;
				},
				getPosition: () => ({
					position: {
						lineNumber: error.line,
						column: lineContent.length + 1
					},
					preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
				})
			};
			
			editor.addContentWidget(widget);
			widgetIds.push(widgetId);
		});
		
		treeSitterInlineDecorations.set(editor, widgetIds);
		
		console.log(`[Tree-sitter] Created ${widgetIds.length} inline content widgets`);
		
		console.log('Tree-sitter validation completed for', language);
	}
	
	/**
	 * Clean up resources
	 */
	static dispose(): void {
		this.parsers.clear();
		this.initialized = false;
	}
}
