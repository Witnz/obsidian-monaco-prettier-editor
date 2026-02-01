import * as monaco from "monaco-editor";
import { App, TFile, normalizePath, Notice } from "obsidian";
import { VSIXThemeLoader } from "./VSIXThemeLoader";

/**
 * VS Code Theme JSON structure
 */
export interface VSCodeTheme {
	name?: string;
	type?: "dark" | "light";
	colors?: Record<string, string>;
	tokenColors?: Array<{
		name?: string;
		scope?: string | string[];
		settings: {
			foreground?: string;
			background?: string;
			fontStyle?: string;
		};
	}>;
}

/**
 * Built-in Monaco themes
 */
export const BUILT_IN_THEMES = [
	{ id: "vs", name: "Visual Studio Light" },
	{ id: "vs-dark", name: "Visual Studio Dark" },
	{ id: "hc-black", name: "High Contrast Dark" },
	{ id: "hc-light", name: "High Contrast Light" },
];

/**
 * Popular theme presets (these will be defined programmatically)
 */
export const THEME_PRESETS: Record<string, VSCodeTheme> = {
	"github-dark": {
		name: "GitHub Dark",
		type: "dark",
		colors: {
			"editor.background": "#0d1117",
			"editor.foreground": "#c9d1d9",
			"editor.lineHighlightBackground": "#161b22",
			"editor.selectionBackground": "#264f78",
			"editorCursor.foreground": "#58a6ff",
		},
		tokenColors: [
			{ scope: "comment", settings: { foreground: "#8b949e", fontStyle: "italic" } },
			{ scope: "keyword", settings: { foreground: "#ff7b72" } },
			{ scope: "string", settings: { foreground: "#a5d6ff" } },
			{ scope: "function", settings: { foreground: "#d2a8ff" } },
			{ scope: "variable", settings: { foreground: "#ffa657" } },
			{ scope: "number", settings: { foreground: "#79c0ff" } },
		],
	},
	"monokai": {
		name: "Monokai",
		type: "dark",
		colors: {
			"editor.background": "#272822",
			"editor.foreground": "#f8f8f2",
			"editor.lineHighlightBackground": "#3e3d32",
			"editor.selectionBackground": "#49483e",
			"editorCursor.foreground": "#f8f8f0",
		},
		tokenColors: [
			{ scope: "comment", settings: { foreground: "#75715e", fontStyle: "italic" } },
			{ scope: "keyword", settings: { foreground: "#f92672" } },
			{ scope: "string", settings: { foreground: "#e6db74" } },
			{ scope: "function", settings: { foreground: "#a6e22e" } },
			{ scope: "variable", settings: { foreground: "#f8f8f2" } },
			{ scope: "number", settings: { foreground: "#ae81ff" } },
		],
	},
	"dracula": {
		name: "Dracula",
		type: "dark",
		colors: {
			"editor.background": "#282a36",
			"editor.foreground": "#f8f8f2",
			"editor.lineHighlightBackground": "#44475a",
			"editor.selectionBackground": "#44475a",
			"editorCursor.foreground": "#f8f8f0",
		},
		tokenColors: [
			{ scope: "comment", settings: { foreground: "#6272a4", fontStyle: "italic" } },
			{ scope: "keyword", settings: { foreground: "#ff79c6" } },
			{ scope: "string", settings: { foreground: "#f1fa8c" } },
			{ scope: "function", settings: { foreground: "#50fa7b" } },
			{ scope: "variable", settings: { foreground: "#8be9fd" } },
			{ scope: "number", settings: { foreground: "#bd93f9" } },
		],
	},
	"solarized-dark": {
		name: "Solarized Dark",
		type: "dark",
		colors: {
			"editor.background": "#002b36",
			"editor.foreground": "#839496",
			"editor.lineHighlightBackground": "#073642",
			"editor.selectionBackground": "#073642",
			"editorCursor.foreground": "#839496",
		},
		tokenColors: [
			{ scope: "comment", settings: { foreground: "#586e75", fontStyle: "italic" } },
			{ scope: "keyword", settings: { foreground: "#859900" } },
			{ scope: "string", settings: { foreground: "#2aa198" } },
			{ scope: "function", settings: { foreground: "#268bd2" } },
			{ scope: "variable", settings: { foreground: "#b58900" } },
			{ scope: "number", settings: { foreground: "#d33682" } },
		],
	},
	"nord": {
		name: "Nord",
		type: "dark",
		colors: {
			"editor.background": "#2e3440",
			"editor.foreground": "#d8dee9",
			"editor.lineHighlightBackground": "#3b4252",
			"editor.selectionBackground": "#434c5e",
			"editorCursor.foreground": "#d8dee9",
		},
		tokenColors: [
			{ scope: "comment", settings: { foreground: "#616e88", fontStyle: "italic" } },
			{ scope: "keyword", settings: { foreground: "#81a1c1" } },
			{ scope: "string", settings: { foreground: "#a3be8c" } },
			{ scope: "function", settings: { foreground: "#88c0d0" } },
			{ scope: "variable", settings: { foreground: "#d8dee9" } },
			{ scope: "number", settings: { foreground: "#b48ead" } },
		],
	},
};

/**
 * Theme Manager for loading and applying Monaco Editor themes
 */
export class ThemeManager {
	private app: App;
	private customThemes: Map<string, VSCodeTheme> = new Map();
	private vsixLoader: VSIXThemeLoader;

	constructor(app: App) {
		this.app = app;
		this.vsixLoader = new VSIXThemeLoader(app);
	}

	/**
	 * Get all available theme IDs
	 */
	getAvailableThemes(): Array<{ id: string; name: string; type: "builtin" | "preset" | "custom" }> {
		const themes: Array<{ id: string; name: string; type: "builtin" | "preset" | "custom" }> = [];

		// Built-in Monaco themes
		BUILT_IN_THEMES.forEach((theme) => {
			themes.push({ id: theme.id, name: theme.name, type: "builtin" });
		});

		// Preset themes
		Object.entries(THEME_PRESETS).forEach(([id, theme]) => {
			themes.push({ id, name: theme.name || id, type: "preset" });
		});

		// Custom imported themes
		this.customThemes.forEach((theme, id) => {
			themes.push({ id, name: theme.name || id, type: "custom" });
		});

		return themes;
	}

	/**
	 * Load a custom VS Code theme from JSON file
	 */
	async loadThemeFromFile(filePath: string): Promise<string | null> {
		try {
			const normalizedPath = normalizePath(filePath);
			const file = this.app.vault.getAbstractFileByPath(normalizedPath);

			if (!(file instanceof TFile)) {
				new Notice(`Theme file not found: ${filePath}`);
				console.error("Theme file not found:", filePath);
				return null;
			}

			new Notice(`Loading theme from ${file.name}...`);
			const content = await this.app.vault.read(file);
			const themeData = JSON.parse(content) as VSCodeTheme;

			// Generate theme ID from file name
			const themeId = file.basename.toLowerCase().replace(/[^a-z0-9]/g, "-");

			// Store custom theme
			this.customThemes.set(themeId, themeData);

			// Define theme in Monaco
			this.defineTheme(themeId, themeData);

			new Notice(`Loaded theme: ${themeData.name || themeId}`);
			return themeId;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to load theme: ${errorMsg}`);
			console.error("Failed to load theme:", error);
			return null;
		}
	}

	/**
	 * Load themes from VS Code Marketplace by extension ID
	 */
	async loadThemesFromMarketplace(extensionId: string): Promise<string[]> {
		try {
			const themes = await this.vsixLoader.loadFromMarketplace(extensionId);
			if (!themes || themes.size === 0) {
				console.error("No themes loaded from marketplace");
				return [];
			}

			const loadedThemeIds: string[] = [];
			themes.forEach((themeData, themeId) => {
				try {
					this.customThemes.set(themeId, themeData);
					this.defineTheme(themeId, themeData);
					loadedThemeIds.push(themeId);
					console.log(`Loaded theme: ${themeId}`);
				} catch (error) {
					console.error(`Failed to load theme ${themeId}:`, error);
				}
			});

			return loadedThemeIds;
		} catch (error) {
			console.error("Error loading themes from marketplace:", error);
			return [];
		}
	}

	/**
	 * Load themes from marketplace URL
	 */
	async loadThemesFromMarketplaceURL(url: string): Promise<string[]> {
		try {
			const themes = await this.vsixLoader.loadFromMarketplaceURL(url);
			if (!themes || themes.size === 0) {
				console.error("No themes loaded from marketplace URL");
				return [];
			}

			const loadedThemeIds: string[] = [];
			themes.forEach((themeData, themeId) => {
				try {
					this.customThemes.set(themeId, themeData);
					this.defineTheme(themeId, themeData);
					loadedThemeIds.push(themeId);
					console.log(`Loaded theme: ${themeId}`);
				} catch (error) {
					console.error(`Failed to load theme ${themeId}:`, error);
				}
			});

			return loadedThemeIds;
		} catch (error) {
			console.error("Error loading themes from marketplace URL:", error);
			return [];
		}
	}

	/**
	 * Load themes from local VSIX file
	 */
	async loadThemesFromVSIX(filePath: string): Promise<string[]> {
		try {
			const themes = await this.vsixLoader.loadFromLocalVSIX(filePath);
			if (!themes || themes.size === 0) {
				console.error("No themes loaded from VSIX file");
				return [];
			}

			const loadedThemeIds: string[] = [];
			themes.forEach((themeData, themeId) => {
				try {
					this.customThemes.set(themeId, themeData);
					this.defineTheme(themeId, themeData);
					loadedThemeIds.push(themeId);
					console.log(`Loaded theme: ${themeId}`);
				} catch (error) {
					console.error(`Failed to load theme ${themeId}:`, error);
				}
			});

			return loadedThemeIds;
		} catch (error) {
			console.error("Error loading themes from VSIX:", error);
			return [];
		}
	}

	/**
	 * Apply a theme to Monaco
	 */
	applyTheme(themeId: string): void {
		// Check if it's a built-in theme
		if (BUILT_IN_THEMES.some((t) => t.id === themeId)) {
			monaco.editor.setTheme(themeId);
			return;
		}

		// Check if it's a preset theme
		if (THEME_PRESETS[themeId]) {
			this.defineTheme(themeId, THEME_PRESETS[themeId]);
			monaco.editor.setTheme(themeId);
			return;
		}

		// Check if it's a custom theme
		const customTheme = this.customThemes.get(themeId);
		if (customTheme) {
			this.defineTheme(themeId, customTheme);
			monaco.editor.setTheme(themeId);
			return;
		}

		// Fallback to vs-dark
		console.warn(`Theme "${themeId}" not found, falling back to vs-dark`);
		monaco.editor.setTheme("vs-dark");
	}

	/**
	 * Define a theme in Monaco from VS Code theme data
	 */
	private defineTheme(themeId: string, themeData: VSCodeTheme): void {
		const base = themeData.type === "light" ? "vs" : "vs-dark";

		// Convert token colors to Monaco rules
		const rules: monaco.editor.ITokenThemeRule[] = [];
		if (themeData.tokenColors) {
			themeData.tokenColors.forEach((tokenColor) => {
				if (!tokenColor.scope || !tokenColor.settings) return;

				const scopes = Array.isArray(tokenColor.scope)
					? tokenColor.scope
					: [tokenColor.scope];

				scopes.forEach((scope) => {
					const rule: monaco.editor.ITokenThemeRule = { token: scope };

					if (tokenColor.settings.foreground) {
						rule.foreground = tokenColor.settings.foreground.replace("#", "");
					}
					if (tokenColor.settings.background) {
						rule.background = tokenColor.settings.background.replace("#", "");
					}
					if (tokenColor.settings.fontStyle) {
						rule.fontStyle = tokenColor.settings.fontStyle;
					}

					rules.push(rule);
				});
			});
		}

		// Convert colors
		const colors: { [colorId: string]: string } = {};
		if (themeData.colors) {
			Object.entries(themeData.colors).forEach(([key, value]) => {
				colors[key] = value;
			});
		}

		// Define the theme
		monaco.editor.defineTheme(themeId, {
			base: base as "vs" | "vs-dark" | "hc-black" | "hc-light",
			inherit: true,
			rules,
			colors,
		});
	}

	/**
	 * Create transparent version of any theme
	 */
	createTransparentTheme(baseThemeId: string): string {
		const transparentId = `${baseThemeId}-transparent`;

		monaco.editor.defineTheme(transparentId, {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: {
				"editor.background": "#00000000",
			},
		});

		return transparentId;
	}

	/**
	 * Initialize preset themes
	 */
	initializePresetThemes(): void {
		Object.entries(THEME_PRESETS).forEach(([id, theme]) => {
			this.defineTheme(id, theme);
		});
	}

	/**
	 * Get theme type (dark/light)
	 */
	getThemeType(themeId: string): "dark" | "light" {
		// Built-in themes
		if (themeId === "vs" || themeId === "hc-light") return "light";
		if (themeId === "vs-dark" || themeId === "hc-black") return "dark";

		// Preset themes
		const preset = THEME_PRESETS[themeId];
		if (preset) return preset.type || "dark";

		// Custom themes
		const custom = this.customThemes.get(themeId);
		if (custom) return custom.type || "dark";

		return "dark"; // Default
	}
}
