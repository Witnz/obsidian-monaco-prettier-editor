import { App, TFile, normalizePath, requestUrl, Notice } from "obsidian";
import JSZip from "jszip";
import { VSCodeTheme } from "./ThemeManager";

/**
 * VSIX Package structure
 */
interface VSIXPackage {
	name: string;
	displayName?: string;
	publisher: string;
	version: string;
	contributes?: {
		themes?: Array<{
			label: string;
			uiTheme: "vs" | "vs-dark" | "hc-black" | "hc-light";
			path: string;
		}>;
	};
}

/**
 * VS Code Marketplace API response
 */
interface MarketplaceExtension {
	extensionId: string;
	extensionName: string;
	displayName: string;
	versions: Array<{
		version: string;
		files: Array<{
			assetType: string;
			source: string;
		}>;
	}>;
}

/**
 * Loader for VSIX theme packages
 */
export class VSIXThemeLoader {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Load themes from VS Code Marketplace by extension ID
	 * @param extensionId - Extension ID in format "publisher.name" (e.g., "Avetis.tokyo-night")
	 */
	async loadFromMarketplace(extensionId: string): Promise<Map<string, VSCodeTheme> | null> {
		try {
			new Notice(`Downloading extension: ${extensionId}...`);

			// Fetch extension metadata from marketplace
			const metadata = await this.fetchExtensionMetadata(extensionId);
			if (!metadata) {
				new Notice(`Extension ${extensionId} not found in marketplace`);
				return null;
			}

			// Get VSIX download URL
			const vsixUrl = this.getVSIXUrl(metadata);
			if (!vsixUrl) {
				new Notice("Could not find VSIX download URL");
				return null;
			}

			// Download VSIX file
			const vsixData = await this.downloadVSIX(vsixUrl);
			if (!vsixData) {
				new Notice("Failed to download VSIX file");
				return null;
			}

			// Parse and extract themes
			const themes = await this.parseVSIX(vsixData);
			new Notice(`Loaded ${themes.size} theme(s) from ${extensionId}`);
			return themes;
		} catch (error) {
			console.error("Failed to load from marketplace:", error);
			new Notice(`Error loading extension: ${error.message}`);
			return null;
		}
	}

	/**
	 * Load themes from marketplace URL
	 * @param url - Marketplace URL (e.g., "https://marketplace.visualstudio.com/items?itemName=Avetis.tokyo-night")
	 */
	async loadFromMarketplaceURL(url: string): Promise<Map<string, VSCodeTheme> | null> {
		// Extract extension ID from URL
		const match = url.match(/itemName=([^&]+)/);
		if (!match) {
			new Notice("Invalid marketplace URL");
			return null;
		}

		return this.loadFromMarketplace(match[1]);
	}

	/**
	 * Load themes from local VSIX file in vault
	 * @param filePath - Path to VSIX file in vault
	 */
	async loadFromLocalVSIX(filePath: string): Promise<Map<string, VSCodeTheme> | null> {
		try {
			const normalizedPath = normalizePath(filePath);
			const file = this.app.vault.getAbstractFileByPath(normalizedPath);

			if (!(file instanceof TFile)) {
				new Notice(`File not found: ${filePath}`);
				return null;
			}

			new Notice(`Loading VSIX: ${file.name}...`);

			// Read VSIX file as binary
			const vsixData = await this.app.vault.readBinary(file);

			// Parse and extract themes
			const themes = await this.parseVSIX(vsixData);
			new Notice(`Loaded ${themes.size} theme(s) from ${file.name}`);
			return themes;
		} catch (error) {
			console.error("Failed to load local VSIX:", error);
			new Notice(`Error loading VSIX: ${error.message}`);
			return null;
		}
	}

	/**
	 * Fetch extension metadata from VS Code Marketplace API
	 */
	private async fetchExtensionMetadata(extensionId: string): Promise<MarketplaceExtension | null> {
		const [publisher, name] = extensionId.split(".");
		if (!publisher || !name) {
			throw new Error("Invalid extension ID format. Use 'publisher.name'");
		}

		const response = await requestUrl({
			url: "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json;api-version=7.1-preview.1",
				"User-Agent": "Obsidian-Monaco-Editor/1.0.0",
			},
			body: JSON.stringify({
				filters: [
					{
						criteria: [
							{ filterType: 7, value: `${publisher}.${name}` }
						],
					},
				],
				flags: 914,
			}),
		});

		const data = JSON.parse(response.text);
		const extensions = data.results?.[0]?.extensions;

		if (!extensions || extensions.length === 0) {
			return null;
		}

		return extensions[0];
	}

	/**
	 * Get VSIX download URL from extension metadata
	 */
	private getVSIXUrl(metadata: MarketplaceExtension): string | null {
		const latestVersion = metadata.versions?.[0];
		if (!latestVersion) return null;

		const vsixFile = latestVersion.files.find(
			(f) => f.assetType === "Microsoft.VisualStudio.Services.VSIXPackage"
		);

		return vsixFile?.source || null;
	}

	/**
	 * Download VSIX file from URL
	 */
	private async downloadVSIX(url: string): Promise<ArrayBuffer | null> {
		try {
			const response = await requestUrl({
				url: url,
				method: "GET",
			});

			return response.arrayBuffer;
		} catch (error) {
			console.error("Download failed:", error);
			return null;
		}
	}

	/**
	 * Parse VSIX file (ZIP) and extract themes
	 */
	private async parseVSIX(vsixData: ArrayBuffer): Promise<Map<string, VSCodeTheme>> {
		const themes = new Map<string, VSCodeTheme>();

		try {
			// Load ZIP
			const zip = await JSZip.loadAsync(vsixData);

			// Find and parse package.json
			const packageFile = zip.file("extension/package.json");
			if (!packageFile) {
				throw new Error("package.json not found in VSIX");
			}

			const packageContent = await packageFile.async("string");
			const packageData: VSIXPackage = JSON.parse(packageContent);

			// Check for theme contributions
			if (!packageData.contributes?.themes || packageData.contributes.themes.length === 0) {
				throw new Error("No themes found in extension");
			}

			// Extract each theme
			for (const themeContribution of packageData.contributes.themes) {
				const themePath = `extension/${themeContribution.path}`;
				const themeFile = zip.file(themePath);

				if (!themeFile) {
					console.warn(`Theme file not found: ${themePath}`);
					continue;
				}

				const themeContent = await themeFile.async("string");
				const themeData: VSCodeTheme = JSON.parse(themeContent);

				// Use theme label as name if not specified in JSON
				if (!themeData.name) {
					themeData.name = themeContribution.label;
				}

				// Set type based on uiTheme if not specified
				if (!themeData.type) {
					themeData.type = themeContribution.uiTheme.includes("dark") ? "dark" : "light";
				}

				// Generate unique theme ID
				const themeId = this.generateThemeId(
					packageData.publisher,
					packageData.name,
					themeContribution.label
				);

				themes.set(themeId, themeData);
			}

			return themes;
		} catch (error) {
			console.error("Failed to parse VSIX:", error);
			throw error;
		}
	}

	/**
	 * Generate unique theme ID
	 */
	private generateThemeId(publisher: string, extensionName: string, themeLabel: string): string {
		return `${publisher}-${extensionName}-${themeLabel}`
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-");
	}
}
