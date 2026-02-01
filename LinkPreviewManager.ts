import { App, TFile } from "obsidian";
import MonacoPrettierEditorPlugin from "./main";
import * as monaco from "monaco-editor";

export class LinkPreviewManager {
	private app: App;
	private plugin: MonacoPrettierEditorPlugin;
	private observer: MutationObserver;
	private hoverData: {
		linkText: string | null;
		sourcePath: string;
		event: MouseEvent | null;
	} = {
		linkText: null,
		sourcePath: "",
		event: null,
	};

	constructor(app: App, plugin: MonacoPrettierEditorPlugin) {
		this.app = app;
		this.plugin = plugin;
		
		// Create MutationObserver to detect when Obsidian's hover popover appears
		this.observer = new MutationObserver(async (mutations) => {
			// Only process single mutations with single node additions
			if (mutations.length !== 1) return;
			if (mutations[0].addedNodes.length !== 1) return;
			if (this.hoverData.linkText === null) return;
			
			const addedNode = mutations[0].addedNodes[0];
			// @ts-ignore - className exists on Element
			if (!(addedNode instanceof HTMLElement) || addedNode.className !== "popover hover-popover") {
				return;
			}
			
			await this.renderLinkPreview(addedNode);
		});
	}

	/**
	 * Start observing for hover popover elements
	 */
	start(): void {
		// Listen for Obsidian's hover-link events
		// @ts-ignore - hover-link is a valid event but not in TypeScript definitions
		this.plugin.registerEvent(
			// @ts-ignore
			this.app.workspace.on("hover-link", (event: any) => {
				const linkText: string = event.linktext;
				const sourcePath: string = event.sourcePath;
				if (!linkText || !sourcePath) return;
				
				this.hoverData.linkText = linkText;
				this.hoverData.sourcePath = sourcePath;
				this.hoverData.event = event.event;
			})
		);

		// Observe document for popover additions
		this.observer.observe(document, { childList: true, subtree: true });
	}

	/**
	 * Stop observing and clean up
	 */
	stop(): void {
		this.observer.disconnect();
	}

	/**
	 * Render a Monaco editor preview inside the hover popover
	 */
	private async renderLinkPreview(popoverNode: HTMLElement): Promise<void> {
		if (!this.hoverData.linkText || !this.hoverData.event) return;

		// Resolve the file from the link
		const file = this.app.metadataCache.getFirstLinkpathDest(
			this.hoverData.linkText,
			this.hoverData.sourcePath
		);
		
		if (!file) return;

		// Check if it's a code file (same check as MonacoView)
		const codeExtensions = [
			"js", "ts", "jsx", "tsx", "json", "py", "java", "c", "cpp", "cs", 
			"php", "rb", "go", "rs", "swift", "kt", "scala", "sh", "bash", 
			"ps1", "sql", "r", "m", "html", "css", "scss", "sass", "less",
			"xml", "yaml", "yml", "toml", "ini", "conf", "cfg", "env",
			"vue", "svelte", "astro", "lua", "dart", "pl", "ex", "exs",
			"erl", "hrl", "clj", "cljs", "elm", "hs", "ml", "fs", "vb",
			"asm", "s", "sol", "move", "cairo"
		];
		
		if (!codeExtensions.includes(file.extension)) return;

		// Read file content
		const fileContent = await this.app.vault.read(file);

		// Create container for Monaco editor
		const contentEl = createDiv();
		
		// Create Monaco editor instance for preview
		const editorContainer = createDiv();
		contentEl.appendChild(editorContainer);

		// Determine language from file extension
		const language = this.getMonacoLanguage(file.extension);

		// Create read-only Monaco editor
		const previewEditor = monaco.editor.create(editorContainer, {
			value: fileContent,
			language: language,
			readOnly: true,
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			lineNumbers: "on",
			folding: true,
			automaticLayout: true,
			wordWrap: "on",
			theme: this.plugin.settings.selectedTheme,
			fontSize: this.plugin.settings.fontSize,
			fontFamily: this.plugin.settings.fontFamily,
			fontLigatures: this.plugin.settings.fontLigatures,
		});

		// Apply transparent theme if enabled
		if (this.plugin.settings.transparentBackground) {
			this.plugin.themeManager.createTransparentTheme(
				this.plugin.settings.selectedTheme
			);
			previewEditor.updateOptions({
				theme: `${this.plugin.settings.selectedTheme}-transparent`
			});
		}

		// Position and size the popover
		const width = 700;
		const height = 500;
		const gap = 10;

		if (this.hoverData.event) {
			const event = this.hoverData.event;
			const x = event.clientX;
			const y = event.clientY;
			const target = event.target as HTMLElement;
			const targetRect = target.getBoundingClientRect();

			popoverNode.style.position = "absolute";
			popoverNode.style.left = `${x + gap}px`;

			const spaceBelow = window.innerHeight - y - gap * 3;
			const spaceAbove = y - gap * 3;
			
			// Position above, below, or to the side based on available space
			if (spaceBelow > height) {
				popoverNode.style.top = `${targetRect.bottom + gap}px`;
			} else if (spaceAbove > height) {
				popoverNode.style.top = `${targetRect.top - height - gap}px`;
			} else {
				popoverNode.style.top = `${targetRect.top - (height / 2) - gap}px`;
				popoverNode.style.left = `${targetRect.right + gap * 2}px`;
			}
		}

		// Set dimensions
		contentEl.setCssProps({
			width: `${width}px`,
			height: `${height}px`,
			"padding-top": "10px",
			"padding-bottom": "10px",
		});

		// Replace popover content with our Monaco editor
		popoverNode.empty();
		popoverNode.appendChild(contentEl);

		// Clean up editor when popover is removed
		const cleanupObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const removedNode of Array.from(mutation.removedNodes)) {
					if (removedNode === popoverNode) {
						previewEditor.dispose();
						cleanupObserver.disconnect();
					}
				}
			}
		});
		
		cleanupObserver.observe(popoverNode.parentElement || document.body, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * Map file extension to Monaco language identifier
	 */
	private getMonacoLanguage(extension: string): string {
		const languageMap: Record<string, string> = {
			"js": "javascript",
			"jsx": "javascript",
			"ts": "typescript",
			"tsx": "typescript",
			"json": "json",
			"py": "python",
			"java": "java",
			"c": "c",
			"cpp": "cpp",
			"cs": "csharp",
			"php": "php",
			"rb": "ruby",
			"go": "go",
			"rs": "rust",
			"swift": "swift",
			"kt": "kotlin",
			"scala": "scala",
			"sh": "shell",
			"bash": "shell",
			"ps1": "powershell",
			"sql": "sql",
			"r": "r",
			"m": "objective-c",
			"html": "html",
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
			"env": "shell",
			"vue": "html",
			"svelte": "html",
			"astro": "html",
			"lua": "lua",
			"dart": "dart",
			"pl": "perl",
			"ex": "elixir",
			"exs": "elixir",
			"erl": "erlang",
			"hrl": "erlang",
			"clj": "clojure",
			"cljs": "clojure",
			"elm": "elm",
			"hs": "haskell",
			"ml": "fsharp",
			"fs": "fsharp",
			"vb": "vb",
			"asm": "asm",
			"s": "asm",
			"sol": "sol",
		};

		return languageMap[extension] || "plaintext";
	}
}
