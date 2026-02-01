export interface TreeSitterLanguageParser {
	language: string;
	displayName: string;
	version: string;
	installed: boolean;
	installedVersion?: string;
	cdnUrl: string;
	localPath?: string;
	size?: number;
	lastUpdated?: number;
}

export interface MonacoPrettierSettings {
	// File extensions to handle
	fileExtensions: string[];
	
	// Editor settings
	fontSize: number;
	fontFamily: string;
	fontLigatures: boolean;
	lineNumbers: boolean;
	minimap: boolean;
	wordWrap: boolean;
	folding: boolean;
	inlineErrorFont: string;
	inlineErrorFontSize: number;
	semanticValidation: boolean;
	syntaxValidation: boolean;
	lightweightValidation: boolean;
	enableTreeSitter: boolean;
	treeSitterParsers: Record<string, TreeSitterLanguageParser>;
	linkPreviews: boolean;
	autoDetectLanguage: boolean;
	enableConsoleLogging: boolean;
	
	// Prettier settings
	formatOnSave: boolean;
	formatOnType: boolean;
	tabWidth: number;
	useTabs: boolean;
	semi: boolean;
	singleQuote: boolean;
	trailingComma: "none" | "es5" | "all";
	bracketSpacing: boolean;
	arrowParens: "always" | "avoid";
	printWidth: number;
	
	// Theme
	selectedTheme: string;
	transparentBackground: boolean;
	customThemes: Record<string, any>; // Store custom themes as JSON
}

export const DEFAULT_SETTINGS: MonacoPrettierSettings = {
	fileExtensions: [
		// JavaScript/TypeScript
		"js", "jsx", "ts", "tsx", "json",
		// Web
		"html", "htm", "css", "scss", "sass", "less", "xml",
		// Python
		"py", "pyw",
		// Java/JVM
		"java", "kt", "kts", "scala",
		// C/C++/C#
		"c", "cpp", "cc", "cxx", "h", "hpp", "cs",
		// Other compiled languages
		"go", "rs", "swift", "dart",
		// Scripting
		"php", "rb", "lua", "pl", "r",
		// Shell
		"sh", "bash", "zsh", "ps1",
		// Data/Config
		"yaml", "yml", "toml", "ini", "conf", "cfg", "sql",
		// Functional
		"ex", "exs", "erl", "hrl", "clj", "cljs", "hs", "ml", "fs",
		// Visual Basic
		"vb"
	],
	
	fontSize: 14,
	fontFamily: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
	fontLigatures: true,
	lineNumbers: true,
	minimap: true,
	wordWrap: false,
	folding: true,
	inlineErrorFont: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
	inlineErrorFontSize: 12,
	semanticValidation: true,
	syntaxValidation: true,
	lightweightValidation: true,
	enableTreeSitter: false,
	treeSitterParsers: {
		'javascript': {
			language: 'javascript',
			displayName: 'JavaScript',
			version: '0.25.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-javascript@0.25.0/tree-sitter-javascript.wasm'
		},
		'typescript': {
			language: 'typescript',
			displayName: 'TypeScript',
			version: '0.23.2',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-typescript@0.23.2/tree-sitter-typescript.wasm'
		},
		'tsx': {
			language: 'tsx',
			displayName: 'TSX/JSX',
			version: '0.23.2',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-typescript@0.23.2/tree-sitter-tsx.wasm'
		},
		'python': {
			language: 'python',
			displayName: 'Python',
			version: '0.25.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-python@0.25.0/tree-sitter-python.wasm'
		},
		'json': {
			language: 'json',
			displayName: 'JSON',
			version: '0.24.8',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-json@0.24.8/tree-sitter-json.wasm'
		},
		'css': {
			language: 'css',
			displayName: 'CSS',
			version: '0.25.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-css@0.25.0/tree-sitter-css.wasm'
		},
		'go': {
			language: 'go',
			displayName: 'Go',
			version: '0.25.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-go@0.25.0/tree-sitter-go.wasm'
		},
		'rust': {
			language: 'rust',
			displayName: 'Rust',
			version: '0.24.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-rust@0.24.0/tree-sitter-rust.wasm'
		},
		'java': {
			language: 'java',
			displayName: 'Java',
			version: '0.25.2',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-java@0.25.2/tree-sitter-java.wasm'
		},
		'cpp': {
			language: 'cpp',
			displayName: 'C++',
			version: '0.25.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-cpp@0.25.0/tree-sitter-cpp.wasm'
		},
		'bash': {
			language: 'bash',
			displayName: 'Bash/Shell',
			version: '0.25.0',
			installed: false,
			cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-bash@0.25.0/tree-sitter-bash.wasm'
		}
	},
	linkPreviews: true,
	autoDetectLanguage: true,
	enableConsoleLogging: false,
	
	formatOnSave: true,
	formatOnType: false,
	tabWidth: 2,
	useTabs: false,
	semi: true,
	singleQuote: false,
	trailingComma: "es5",
	bracketSpacing: true,
	arrowParens: "always",
	printWidth: 80,
	
	selectedTheme: "vs-dark",
	transparentBackground: false,
	customThemes: {},
};
