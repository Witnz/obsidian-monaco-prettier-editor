import { Editor } from "obsidian";
import MonacoPrettierPlugin from "./main";
import { LanguageDetector } from "./LanguageDetector";

/**
 * Utility class to detect and extract code block information from the current cursor position
 */
export class FenceEditContext {
	private start = 0;
	private end = 0;
	private editor?: Editor;
	private isInValidFence = false;
	private languageDetector = new LanguageDetector();

	private constructor(private plugin: MonacoPrettierPlugin) {
		this.initializeStartAndEnd();
		this.validateFence();
	}

	static create(plugin: MonacoPrettierPlugin) {
		return new FenceEditContext(plugin);
	}

	private initializeStartAndEnd() {
		this.editor = this.plugin.app.workspace.activeEditor?.editor;
		const cursor = this.editor?.getCursor();

		if (!this.editor || !cursor) return;

		this.start = cursor.line;
		this.end = cursor.line;

		// Find the opening ``` by going backwards
		do {
			this.start--;
		} while (
			this.start >= 0 &&
			!this.editor.getLine(this.start).startsWith("```")
		);

		// Find the closing ``` by going forwards
		do {
			this.end++;
		} while (
			this.end < this.editor.lineCount() &&
			!this.editor.getLine(this.end).startsWith("```")
		);
	}

	private validateFence() {
		if (!this.editor) return;

		const startLine = this.editor.getLine(this.start);
		const endLine = this.editor.getLine(this.end);

		// Valid fence must have opening and closing ```
		this.isInValidFence =
			this.start >= 0 &&
			this.end < this.editor.lineCount() &&
			startLine.startsWith("```") &&
			endLine.startsWith("```") &&
			this.start !== this.end;
	}

	isInFence() {
		return this.isInValidFence;
	}

	getFenceData() {
		if (!this.editor || !this.isInValidFence) return null;

		// Extract content between opening and closing ```
		let editorContent = "";
		for (let i = this.start + 1; i < this.end; i++) {
			editorContent += `${this.editor.getLine(i)}\n`;
		}

		const content = editorContent.slice(0, editorContent.length - 1);
		
		// Extract language from opening fence (```language)
		const langKey = this.editor
			.getLine(this.start)
			.slice(3)
			.trim()
			.split(" ")[0];
		
		const language = this.getLanguage(langKey);

		return { content, language };
	}

	getEditor() {
		return this.editor;
	}

	getBounds() {
		return [this.start, this.end];
	}

	replaceFenceContent(value: string) {
		// Replace the content between opening and closing ```
		this.editor?.replaceRange(
			`${value}\n`,
			{ line: this.start + 1, ch: 0 },
			{ line: this.end, ch: 0 }
		);
	}

	/**
	 * Map language keys to Monaco language IDs with auto-detection
	 */
	private getLanguage(langKey: string): string {
		// If auto-detection is enabled and no language specified or generic language
		if (this.plugin.settings.autoDetectLanguage && (!langKey || langKey === "text" || langKey === "plain")) {
			// Get the code content for detection
			let content = "";
			if (this.editor) {
				for (let i = this.start + 1; i < this.end; i++) {
					content += `${this.editor.getLine(i)}\n`;
				}
			}
			if (content.trim()) {
				return this.languageDetector.detectLanguage(content);
			}
		}

		// Use LanguageDetector for extension mapping (without content)
		if (langKey) {
			return this.languageDetector.getLanguageFromExtension(langKey);
		}

		return "plaintext";
	}
}
