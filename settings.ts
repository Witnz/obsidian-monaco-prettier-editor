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
	semanticValidation: boolean;
	syntaxValidation: boolean;
	lightweightValidation: boolean;
	enableTreeSitter: boolean;
	linkPreviews: boolean;
	autoDetectLanguage: boolean;
	
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
		// Markup
		"md", "markdown",
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
	semanticValidation: true,
	syntaxValidation: true,
	lightweightValidation: true,
	enableTreeSitter: false,
	linkPreviews: true,
	autoDetectLanguage: true,
	
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
};
