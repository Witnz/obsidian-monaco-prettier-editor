/**
 * Programming language detector based on syntax patterns, keywords, and file signatures
 * Supports 30+ programming languages
 */

interface LanguagePattern {
	name: string;
	monacoLanguage: string;
	patterns: RegExp[];
	weight: number;
}

export class LanguageDetector {
	private patterns: LanguagePattern[] = [
		// TypeScript - check before JavaScript
		{
			name: "TypeScript",
			monacoLanguage: "typescript",
			patterns: [
				/\b(interface|type|namespace|enum)\s+\w+/,
				/:\s*(string|number|boolean|any|void|never)\b/,
				/<\w+>/,  // Generics
				/\b(public|private|protected|readonly)\s+\w+/,
				/\bimport\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]/,
				/\bexport\s+(interface|type|class|function|const|let)/,
			],
			weight: 3,
		},
		// TSX/React TypeScript
		{
			name: "TSX",
			monacoLanguage: "typescript",
			patterns: [
				/<\w+[^>]*>/,  // JSX tags
				/\binterface\s+\w+Props/,
				/React\.(FC|Component|useState|useEffect)/,
				/\bconst\s+\w+\s*:\s*React\./,
			],
			weight: 3,
		},
		// JavaScript - comprehensive detection
		{
			name: "JavaScript",
			monacoLanguage: "javascript",
			patterns: [
				/\b(const|let|var)\s+\w+\s*=/,
				/\bfunction\s+\w+\s*\(/,
				/=>\s*\{/,  // Arrow functions
				/\b(async|await)\b/,
				/\brequire\s*\(['"]/,
				/\bmodule\.exports\s*=/,
				/\bconsole\.(log|error|warn)/,
				/\bnew\s+(Promise|Array|Object)/,
			],
			weight: 2,
		},
		// JSX/React
		{
			name: "JSX",
			monacoLanguage: "javascript",
			patterns: [
				/<\w+[^>]*>/,  // JSX tags
				/\breturn\s*\(/,
				/\buseState\(/,
				/\buseEffect\(/,
				/\bprops\.\w+/,
			],
			weight: 2,
		},
		// Python
		{
			name: "Python",
			monacoLanguage: "python",
			patterns: [
				/\bdef\s+\w+\s*\(/,
				/\bclass\s+\w+(\([\w,\s]*\))?:/,
				/\bimport\s+\w+/,
				/\bfrom\s+\w+\s+import\b/,
				/\b(print|len|range|str|int)\s*\(/,
				/\b(if|elif|else|for|while|try|except|finally|with|as)\b:/,
				/\bself\.\w+/,
				/^#!.*python/m,
			],
			weight: 3,
		},
		// Java
		{
			name: "Java",
			monacoLanguage: "java",
			patterns: [
				/\bpublic\s+(class|interface|enum)\s+\w+/,
				/\bprivate\s+(static\s+)?(final\s+)?[\w<>]+\s+\w+/,
				/\bSystem\.(out|err)\.print/,
				/\bpublic\s+static\s+void\s+main\s*\(/,
				/\b(extends|implements)\s+\w+/,
				/\bnew\s+\w+<[^>]+>\(/,
				/@\w+(\([^)]*\))?/,  // Annotations
			],
			weight: 3,
		},
		// C#
		{
			name: "C#",
			monacoLanguage: "csharp",
			patterns: [
				/\bnamespace\s+\w+/,
				/\busing\s+\w+(\.\w+)*;/,
				/\b(public|private|protected|internal)\s+(class|struct|interface)/,
				/\b(var|string|int|bool|decimal|double|float)\s+\w+\s*=/,
				/\bConsole\.Write/,
				/\basync\s+Task/,
				/@"\w+"/,  // Verbatim strings
			],
			weight: 3,
		},
		// C++
		{
			name: "C++",
			monacoLanguage: "cpp",
			patterns: [
				/#include\s*<[\w.]+>/,
				/\bstd::(cout|cin|endl|vector|string|map)/,
				/\btemplate\s*<[^>]+>/,
				/\b(class|struct)\s+\w+\s*{/,
				/\bnamespace\s+\w+\s*{/,
				/::operator/,
				/\bconst\s+\w+\s*\*\s*const/,
			],
			weight: 3,
		},
		// C
		{
			name: "C",
			monacoLanguage: "c",
			patterns: [
				/#include\s*["<][\w./]+[">]/,
				/\bprintf\s*\(/,
				/\bscanf\s*\(/,
				/\bmalloc\s*\(/,
				/\bfree\s*\(/,
				/\bstruct\s+\w+\s*{/,
				/\btypedef\s+(struct|union|enum)/,
			],
			weight: 2,
		},
		// Go
		{
			name: "Go",
			monacoLanguage: "go",
			patterns: [
				/\bpackage\s+\w+/,
				/\bfunc\s+\w+\s*\([^)]*\)\s*(\([^)]*\))?\s*{/,
				/\bimport\s+\(/,
				/:=\s*/,
				/\bmake\s*\(/,
				/\bgo\s+\w+\(/,
				/\bdefer\s+/,
				/\bchan\s+\w+/,
			],
			weight: 3,
		},
		// Rust
		{
			name: "Rust",
			monacoLanguage: "rust",
			patterns: [
				/\bfn\s+\w+\s*\([^)]*\)\s*->\s*\w+/,
				/\blet\s+mut\s+\w+/,
				/\b(pub\s+)?(struct|enum|trait|impl)\s+\w+/,
				/\bmatch\s+\w+\s*{/,
				/\buse\s+\w+(::\w+)*;/,
				/&(mut\s+)?\w+/,
				/\b(Some|None|Ok|Err)\(/,
			],
			weight: 3,
		},
		// Ruby
		{
			name: "Ruby",
			monacoLanguage: "ruby",
			patterns: [
				/\bdef\s+\w+(\([^)]*\))?/,
				/\bclass\s+\w+(\s*<\s*\w+)?/,
				/\bmodule\s+\w+/,
				/\bend\b/,
				/@\w+/,  // Instance variables
				/\b(puts|print|require|include)\b/,
				/:\w+\s*=>/,  // Symbols
			],
			weight: 2,
		},
		// PHP
		{
			name: "PHP",
			monacoLanguage: "php",
			patterns: [
				/<\?php/,
				/\$\w+\s*=/,
				/\bfunction\s+\w+\s*\(/,
				/\becho\s+/,
				/\b(public|private|protected)\s+function/,
				/->\w+/,
				/\bnamespace\s+\w+(\\w+)*/,
			],
			weight: 3,
		},
		// Swift
		{
			name: "Swift",
			monacoLanguage: "swift",
			patterns: [
				/\bfunc\s+\w+\s*\([^)]*\)\s*->\s*\w+/,
				/\b(var|let)\s+\w+:\s*\w+/,
				/\bclass\s+\w+:\s*\w+/,
				/\bextension\s+\w+/,
				/\bguard\s+let\s+/,
				/\b(import\s+UIKit|import\s+Foundation)/,
			],
			weight: 2,
		},
		// Kotlin
		{
			name: "Kotlin",
			monacoLanguage: "kotlin",
			patterns: [
				/\bfun\s+\w+\s*\(/,
				/\b(val|var)\s+\w+:\s*\w+/,
				/\bdata\s+class\s+\w+/,
				/\bwhen\s*\(\w+\)\s*{/,
				/\?.let\s*{/,
				/\bcompanion\s+object\s*{/,
			],
			weight: 2,
		},
		// Scala
		{
			name: "Scala",
			monacoLanguage: "scala",
			patterns: [
				/\bdef\s+\w+\s*\([^)]*\):\s*\w+/,
				/\b(val|var)\s+\w+:\s*\w+/,
				/\bcase\s+class\s+\w+/,
				/\bobject\s+\w+/,
				/\btrait\s+\w+/,
				/_\.\w+/,
			],
			weight: 2,
		},
		// Shell/Bash
		{
			name: "Shell",
			monacoLanguage: "shell",
			patterns: [
				/^#!\/bin\/(bash|sh|zsh)/m,
				/\b(echo|export|source)\s+/,
				/\$\{?\w+\}?/,  // Variables
				/\bif\s+\[\s+/,
				/\bfor\s+\w+\s+in\s+/,
				/\|\s*grep\s+/,
				/\||\||&&/,
			],
			weight: 2,
		},
		// PowerShell
		{
			name: "PowerShell",
			monacoLanguage: "powershell",
			patterns: [
				/\$\w+\s*=/,
				/\b(Get|Set|New|Remove)-\w+/,
				/\bWrite-(Host|Output|Error)/,
				/\bparam\s*\(/,
				/\[Parameter\(/,
				/-\w+\s+/,  // Parameters
			],
			weight: 2,
		},
		// SQL
		{
			name: "SQL",
			monacoLanguage: "sql",
			patterns: [
				/\bSELECT\s+.+\bFROM\b/i,
				/\bINSERT\s+INTO\b/i,
				/\bUPDATE\s+\w+\s+SET\b/i,
				/\bDELETE\s+FROM\b/i,
				/\bCREATE\s+(TABLE|INDEX|VIEW)\b/i,
				/\bWHERE\s+\w+\s*=\s*/i,
				/\bJOIN\s+\w+\s+ON\b/i,
			],
			weight: 3,
		},
		// HTML
		{
			name: "HTML",
			monacoLanguage: "html",
			patterns: [
				/<!DOCTYPE\s+html>/i,
				/<html[^>]*>/,
				/<head[^>]*>/,
				/<body[^>]*>/,
				/<(div|span|p|a|img|input|button)[^>]*>/,
				/<\/\w+>/,
			],
			weight: 2,
		},
		// CSS
		{
			name: "CSS",
			monacoLanguage: "css",
			patterns: [
				/[.#]\w+\s*{/,
				/\w+\s*:\s*[^;]+;/,
				/@media\s+/,
				/@import\s+/,
				/:(hover|active|focus|before|after)\s*{/,
				/rgba?\([^)]+\)/,
			],
			weight: 2,
		},
		// SCSS/Sass
		{
			name: "SCSS",
			monacoLanguage: "scss",
			patterns: [
				/\$\w+\s*:/,  // Variables
				/@mixin\s+\w+/,
				/@include\s+\w+/,
				/@extend\s+/,
				/&:\w+/,  // Nested selectors
			],
			weight: 3,
		},
		// JSON
		{
			name: "JSON",
			monacoLanguage: "json",
			patterns: [
				/^\s*\{/,
				/^\s*\[/,
				/"[\w-]+":\s*("[^"]*"|\d+|true|false|null|\{|\[)/,
				/,\s*$/m,  // Trailing commas typical in JSON
			],
			weight: 2,
		},
		// YAML
		{
			name: "YAML",
			monacoLanguage: "yaml",
			patterns: [
				/^\w+:\s*$/m,
				/^\s+-\s+\w+/m,
				/^---$/m,
				/^\s+\w+:\s+[^{[]/, // Key: value without braces
			],
			weight: 2,
		},
		// XML
		{
			name: "XML",
			monacoLanguage: "xml",
			patterns: [
				/<\?xml\s+version/,
				/<\w+:[^>]+>/,  // Namespaced tags
				/<!\[CDATA\[/,
			],
			weight: 2,
		},
		// Markdown
		{
			name: "Markdown",
			monacoLanguage: "markdown",
			patterns: [
				/^#{1,6}\s+/m,
				/\[.+\]\(.+\)/,
				/^```\w*/m,
				/^\*\s+/m,
				/^>\s+/m,
				/\*\*.+\*\*/,
			],
			weight: 2,
		},
		// R
		{
			name: "R",
			monacoLanguage: "r",
			patterns: [
				/<-\s*/,  // Assignment operator
				/\blibrary\s*\(/,
				/\bfunction\s*\([^)]*\)\s*{/,
				/\b(data\.frame|matrix|vector)\s*\(/,
				/\$\w+/,  // Data frame columns
			],
			weight: 2,
		},
		// Lua
		{
			name: "Lua",
			monacoLanguage: "lua",
			patterns: [
				/\bfunction\s+\w+\s*\(/,
				/\blocal\s+\w+\s*=/,
				/\bend\b/,
				/\bthen\b/,
				/--\s+/,  // Comments
			],
			weight: 2,
		},
		// Dart
		{
			name: "Dart",
			monacoLanguage: "dart",
			patterns: [
				/\bvoid\s+main\s*\(/,
				/\bclass\s+\w+\s+(extends|implements)/,
				/\bfinal\s+\w+\s+\w+\s*=/,
				/\bwidget\s+build\s*\(/i,
				/@override/,
			],
			weight: 2,
		},
	];

	/**
	 * Detect the programming language from code content
	 * @param code - The code content to analyze
	 * @returns Monaco language identifier
	 */
	detectLanguage(code: string): string {
		if (!code || code.trim().length === 0) {
			return "plaintext";
		}

		const scores = new Map<string, number>();

		// Test each pattern against the code
		for (const lang of this.patterns) {
			let score = 0;
			for (const pattern of lang.patterns) {
				if (pattern.test(code)) {
					score += lang.weight;
				}
			}
			if (score > 0) {
				scores.set(lang.monacoLanguage, (scores.get(lang.monacoLanguage) || 0) + score);
			}
		}

		// Find the language with the highest score
		let maxScore = 0;
		let detectedLanguage = "plaintext";

		for (const [language, score] of scores.entries()) {
			if (score > maxScore) {
				maxScore = score;
				detectedLanguage = language;
			}
		}

		// Require minimum confidence threshold
		if (maxScore < 2) {
			return "plaintext";
		}

		return detectedLanguage;
	}

	/**
	 * Get language from file extension, with fallback to content detection
	 * @param extension - File extension without dot
	 * @param content - Optional file content for detection
	 * @returns Monaco language identifier
	 */
	getLanguageFromExtension(extension: string, content?: string): string {
		const extensionMap: Record<string, string> = {
			"js": "javascript",
			"jsx": "javascript",
			"ts": "typescript",
			"tsx": "typescript",
			"json": "json",
			"py": "python",
			"pyw": "python",
			"python": "python",  // Added for .python extension support (vscode-editor compatibility)
			"java": "java",
			"c": "c",
			"cpp": "cpp",
			"cc": "cpp",
			"cxx": "cpp",
			"h": "c",
			"hpp": "cpp",
			"cs": "csharp",
			"php": "php",
			"rb": "ruby",
			"go": "go",
			"rs": "rust",
			"swift": "swift",
			"kt": "kotlin",
			"kts": "kotlin",
			"scala": "scala",
			"sh": "shell",
			"bash": "shell",
			"zsh": "shell",
			"ps1": "powershell",
			"sql": "sql",
			"r": "r",
			"m": "objective-c",
			"html": "html",
			"htm": "html",
			"css": "css",
			"scss": "scss",
			"sass": "scss",
			"less": "less",
			"xml": "xml",
			"yaml": "yaml",
			"yml": "yaml",
			"toml": "ini",
			"ini": "ini",
			"conf": "ini",
			"cfg": "ini",
			"md": "markdown",
			"markdown": "markdown",
			"lua": "lua",
			"dart": "dart",
			"pl": "perl",
			"ex": "elixir",
			"exs": "elixir",
			"erl": "erlang",
			"hrl": "erlang",
			"clj": "clojure",
			"cljs": "clojure",
			"hs": "haskell",
			"ml": "fsharp",
			"fs": "fsharp",
			"vb": "vb",
		};

		// Try extension-based detection first
		const language = extensionMap[extension.toLowerCase()];
		if (language) {
			return language;
		}

		// Fall back to content detection if available
		if (content) {
			return this.detectLanguage(content);
		}

		return "plaintext";
	}
}
