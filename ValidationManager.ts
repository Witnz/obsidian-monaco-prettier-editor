import * as monaco from "monaco-editor";
import { TreeSitterManager } from "./TreeSitterManager";
import type { MonacoPrettierSettings } from "./settings";

/**
 * Store for inline error decorations per editor
 */
const inlineErrorDecorations = new WeakMap<monaco.editor.IStandaloneCodeEditor, string[]>();

/**
 * Lightweight syntax validation for non-TypeScript/JavaScript languages
 * Provides syntax error detection without full language servers
 * Supports tree-sitter for advanced parsing when enabled
 */

export interface ValidationError {
	line: number;
	column: number;
	message: string;
	severity: "error" | "warning";
}

export class ValidationManager {
	/**
	 * Validate JSON syntax
	 */
	static validateJSON(code: string): ValidationError[] {
		const errors: ValidationError[] = [];
		
		try {
			JSON.parse(code);
		} catch (error: any) {
			// Parse JSON.parse error message to extract line/column
			// Example: "Unexpected token } in JSON at position 45"
			const match = error.message.match(/at position (\d+)/);
			
			if (match) {
				const position = parseInt(match[1]);
				const lines = code.substring(0, position).split('\n');
				const line = lines.length;
				const column = lines[lines.length - 1].length + 1;
				
				errors.push({
					line,
					column,
					message: error.message.split(' at position')[0],
					severity: "error"
				});
			} else {
				// Fallback if we can't parse position
				errors.push({
					line: 1,
					column: 1,
					message: error.message,
					severity: "error"
				});
			}
		}
		
		return errors;
	}

	/**
	 * Validate YAML syntax using js-yaml
	 */
	static async validateYAML(code: string): Promise<ValidationError[]> {
		const errors: ValidationError[] = [];
		
		try {
			// Dynamic import to avoid bundling if not needed
			const yaml = await import('js-yaml');
			yaml.load(code);
		} catch (error: any) {
			// js-yaml provides line and column in the error
			const line = error.mark?.line ? error.mark.line + 1 : 1;
			const column = error.mark?.column ? error.mark.column + 1 : 1;
			
			errors.push({
				line,
				column,
				message: error.reason || error.message,
				severity: "error"
			});
		}
		
		return errors;
	}

	/**
	 * Basic Python syntax validation
	 * Uses pattern matching to detect common syntax errors
	 */
	static validatePython(code: string): ValidationError[] {
		const errors: ValidationError[] = [];
		const lines = code.split('\n');
		
		// Track indentation levels
		const indentStack: number[] = [0];
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNum = i + 1;
			
			// Skip empty lines and comments
			if (line.trim() === '' || line.trim().startsWith('#')) {
				continue;
			}
			
			// Check for unclosed strings
			const singleQuotes = (line.match(/(?<!\\)'/g) || []).length;
			const doubleQuotes = (line.match(/(?<!\\)"/g) || []).length;
			const tripleQuotes = (line.match(/"""|'''/g) || []).length;
			
			if (tripleQuotes % 2 !== 0) {
				errors.push({
					line: lineNum,
					column: line.indexOf('"""') >= 0 ? line.indexOf('"""') + 1 : line.indexOf("'''") + 1,
					message: "Unclosed triple-quoted string",
					severity: "error"
				});
			} else if (singleQuotes % 2 !== 0) {
				errors.push({
					line: lineNum,
					column: line.lastIndexOf("'") + 1,
					message: "Unclosed string (single quote)",
					severity: "error"
				});
			} else if (doubleQuotes % 2 !== 0) {
				errors.push({
					line: lineNum,
					column: line.lastIndexOf('"') + 1,
					message: "Unclosed string (double quote)",
					severity: "error"
				});
			}
			
			// Check for unmatched brackets/parentheses
			let parenDepth = 0;
			let bracketDepth = 0;
			let braceDepth = 0;
			
			for (let j = 0; j < line.length; j++) {
				const char = line[j];
				if (char === '(') parenDepth++;
				if (char === ')') parenDepth--;
				if (char === '[') bracketDepth++;
				if (char === ']') bracketDepth--;
				if (char === '{') braceDepth++;
				if (char === '}') braceDepth--;
			}
			
			if (parenDepth !== 0) {
				errors.push({
					line: lineNum,
					column: parenDepth > 0 ? line.lastIndexOf('(') + 1 : line.lastIndexOf(')') + 1,
					message: parenDepth > 0 ? "Unclosed parenthesis" : "Unmatched closing parenthesis",
					severity: "error"
				});
			}
			
			if (bracketDepth !== 0) {
				errors.push({
					line: lineNum,
					column: bracketDepth > 0 ? line.lastIndexOf('[') + 1 : line.lastIndexOf(']') + 1,
					message: bracketDepth > 0 ? "Unclosed bracket" : "Unmatched closing bracket",
					severity: "error"
				});
			}
			
			if (braceDepth !== 0) {
				errors.push({
					line: lineNum,
					column: braceDepth > 0 ? line.lastIndexOf('{') + 1 : line.lastIndexOf('}') + 1,
					message: braceDepth > 0 ? "Unclosed brace" : "Unmatched closing brace",
					severity: "error"
				});
			}
			
			// Check for invalid indentation
			const indent = line.search(/\S/);
			if (indent > 0 && indent % 4 !== 0) {
				errors.push({
					line: lineNum,
					column: 1,
					message: "Indentation should be a multiple of 4 spaces",
					severity: "warning"
				});
			}
			
			// Check for missing colons after control structures
			const controlStructures = /^\s*(if|elif|else|for|while|def|class|with|try|except|finally)\b/;
			if (controlStructures.test(line) && !line.trim().endsWith(':')) {
				errors.push({
					line: lineNum,
					column: line.length,
					message: "Missing colon at end of statement",
					severity: "error"
				});
			}
			
			// Check for invalid syntax patterns
			if (/\bdef\s+\w+\s*\([^)]*\)\s*[^:]/g.test(line) && !line.includes('->')) {
				errors.push({
					line: lineNum,
					column: line.indexOf('def') + 1,
					message: "Function definition missing colon",
					severity: "error"
				});
			}
		}
		
		return errors;
	}

	/**
	 * Basic CSS syntax validation
	 */
	static validateCSS(code: string): ValidationError[] {
		const errors: ValidationError[] = [];
		const lines = code.split('\n');
		
		let braceDepth = 0;
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNum = i + 1;
			
			// Count braces
			for (const char of line) {
				if (char === '{') braceDepth++;
				if (char === '}') braceDepth--;
			}
			
			// Check for unmatched braces
			if (braceDepth < 0) {
				errors.push({
					line: lineNum,
					column: line.lastIndexOf('}') + 1,
					message: "Unmatched closing brace",
					severity: "error"
				});
				braceDepth = 0; // Reset to prevent cascade
			}
			
			// Check for missing semicolons in property declarations
			const trimmed = line.trim();
			if (trimmed && braceDepth > 0 && !trimmed.startsWith('/*') && !trimmed.endsWith('*/') &&
				!trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') &&
				trimmed.includes(':') && !trimmed.startsWith('@')) {
				errors.push({
					line: lineNum,
					column: line.length,
					message: "Missing semicolon at end of declaration",
					severity: "warning"
				});
			}
		}
		
		if (braceDepth > 0) {
			errors.push({
				line: lines.length,
				column: 1,
				message: `${braceDepth} unclosed brace(s)`,
				severity: "error"
			});
		}
		
		return errors;
	}

	/**
	 * Add inline error widgets for existing Monaco markers
	 * Used for languages with built-in Monaco validation (JS/TS)
	 */
	static addInlineErrorsForExistingMarkers(
		editor: monaco.editor.IStandaloneCodeEditor,
		settings?: MonacoPrettierSettings
	): void {
		const model = editor.getModel();
		if (!model) return;

		// Get all markers for this model
		const markers = monaco.editor.getModelMarkers({ resource: model.uri });
		
		if (markers.length === 0) {
			console.log('No markers found for inline errors');
			return;
		}

		console.log(`Found ${markers.length} markers, adding inline errors`);

		// Clear previous content widgets
		const oldWidgets = inlineErrorDecorations.get(editor) || [];
		oldWidgets.forEach(widgetId => {
			const widget = (editor as any)._contentWidgets?.[widgetId];
			if (widget) {
				editor.removeContentWidget(widget);
			}
		});

		// Create new content widgets for each marker
		const widgetIds: string[] = [];
		const inlineFont = settings?.inlineErrorFont || "'Cascadia Code', 'Fira Code', Consolas, monospace";
		const inlineFontSize = settings?.inlineErrorFontSize || 12;

		// Group markers by line (only show one error per line)
		const markersByLine = new Map<number, monaco.editor.IMarker>();
		markers.forEach(marker => {
			if (!markersByLine.has(marker.startLineNumber)) {
				markersByLine.set(marker.startLineNumber, marker);
			}
		});

		markersByLine.forEach((marker, lineNum) => {
			const lineContent = model.getLineContent(lineNum);
			const isError = marker.severity === monaco.MarkerSeverity.Error;
			const widgetId = `monaco-inline-${lineNum}-${Date.now()}`;

			const widget = {
				getId: () => widgetId,
				getDomNode: () => {
					const node = document.createElement('span');
					node.className = isError ? 'monaco-inline-error' : 'monaco-inline-warning';
					node.textContent = ` ⚠️ ${marker.message}`;
					node.style.opacity = '0.7';
					node.style.fontSize = `${inlineFontSize}px`;
					node.style.fontFamily = inlineFont;
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
						lineNumber: lineNum,
						column: lineContent.length + 1
					},
					preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
				})
			};

			editor.addContentWidget(widget);
			widgetIds.push(widgetId);
		});

		inlineErrorDecorations.set(editor, widgetIds);
		console.log(`Created ${widgetIds.length} inline content widgets from Monaco markers`);
	}

	/**
	 * Validate code based on language and display markers in Monaco editor
	 */
	static async validateAndDisplayMarkers(
		editor: monaco.editor.IStandaloneCodeEditor,
		language: string,
		code: string,
		settings?: MonacoPrettierSettings
	): Promise<void> {
		const enableTreeSitter = settings?.enableTreeSitter || false;
		
		console.log('ValidationManager.validateAndDisplayMarkers called:', {
			language,
			codeLength: code.length,
			enableTreeSitter,
			firstLine: code.split('\n')[0]
		});

		// Pass settings to TreeSitterManager if available
		if (settings?.treeSitterParsers) {
			TreeSitterManager.setSettings(settings.treeSitterParsers);
		}
		
		// Try tree-sitter first if enabled and language is supported
		if (enableTreeSitter) {
			const treeSitterLanguages = [
				'javascript', 'javascriptreact', 
				'typescript', 'typescriptreact', 'tsx',
				'python', 'json', 'css', 'scss', 'less',
				'go', 'rust', 'java', 'cpp', 'c',
				'sh', 'bash', 'shell', 'zsh'
			];
			
			if (treeSitterLanguages.includes(language)) {
				console.log('Attempting tree-sitter validation for', language);
				try {
					await TreeSitterManager.validateAndDisplayMarkers(
						editor, 
						language, 
						code,
						settings?.inlineErrorFont,
						settings?.inlineErrorFontSize
					);
					console.log('Tree-sitter validation completed for', language);
					return; // Tree-sitter handled it
				} catch (error) {
					console.warn('Tree-sitter validation failed for', language, ':', error);
					// For languages that ONLY have tree-sitter support, show error message
					const treeSitterOnlyLanguages = ['go', 'rust', 'java', 'cpp', 'c', 'sh', 'bash', 'shell', 'zsh'];
					if (treeSitterOnlyLanguages.includes(language)) {
						console.error(`No fallback validator for ${language}. Enable tree-sitter and install parser.`);
						return;
					}
					// Fall through to other validators for languages with Monaco/lightweight fallback
				}
			}
		}
		
		// For JavaScript/TypeScript/JSON/CSS/HTML, Monaco has built-in validation as fallback
		// We need to read the markers and add inline error messages
		const monacoValidatedLanguages = [
			'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
			'json', 'css', 'scss', 'less', 'html'
		];
		
		if (monacoValidatedLanguages.includes(language)) {
			console.log('Using Monaco built-in validation for', language);
			// Set up listener for Monaco's markers and add inline errors immediately
			const model = editor.getModel();
			if (model) {
				// Add inline errors for any existing markers
				this.addInlineErrorsForExistingMarkers(editor, settings);
				
				// Listen for marker changes to update inline errors
				const disposable = monaco.editor.onDidChangeMarkers((uris) => {
					if (uris.some(uri => uri.toString() === model.uri.toString())) {
						this.addInlineErrorsForExistingMarkers(editor, settings);
					}
				});
				
				// Clean up listener when model changes
				model.onWillDispose(() => {
					disposable.dispose();
				});
			}
			return;
		}
		
		// Use lightweight validators as fallback or for unsupported languages
		let errors: ValidationError[] = [];
		
		console.log('Using lightweight validator for', language);
		
		switch (language) {
			case 'json':
				errors = this.validateJSON(code);
				break;
			case 'yaml':
			case 'yml':
				errors = await this.validateYAML(code);
				break;
			case 'python':
				errors = this.validatePython(code);
				break;
			case 'css':
			case 'scss':
			case 'less':
				errors = this.validateCSS(code);
				break;
			case 'sql':
				// SQL validation not currently supported
				console.log('SQL validation not supported. Consider enabling tree-sitter if a parser becomes available.');
				return;
			default:
				// No validation for other languages
				console.log('No validator available for language:', language);
				return;
		}
		
		console.log('Validation found', errors.length, 'errors for', language);
		
		// Convert errors to Monaco markers
		const model = editor.getModel();
		if (!model) return;
		
		const inlineFont = settings?.inlineErrorFont || "'Cascadia Code', 'Fira Code', Consolas, monospace";
		const inlineFontSize = settings?.inlineErrorFontSize || 12;
		
		const markers: monaco.editor.IMarkerData[] = errors.map(error => {
			// Get the line content to calculate better error span
			const lineContent = model.getLineContent(error.line);
			const lineLength = lineContent.length;
			
			// Calculate end column - underline rest of line or at least 5 characters
			let endColumn = Math.max(error.column + 5, lineLength + 1);
			
			return {
				severity: error.severity === "error" 
					? monaco.MarkerSeverity.Error 
					: monaco.MarkerSeverity.Warning,
				startLineNumber: error.line,
				startColumn: error.column,
				endLineNumber: error.line,
				endColumn: endColumn,
				message: error.message,
				source: 'Monaco Prettier Editor'
			};
		});
		
		console.log('Setting', markers.length, 'markers for', language, ':', markers);
		
		monaco.editor.setModelMarkers(model, 'syntax-validator', markers);
		
		// Add inline error messages using content widgets (Monaco 0.45.0 doesn't support `after.content`)
		// First, clear previous content widgets
		const oldWidgets = inlineErrorDecorations.get(editor) || [];
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
			const widgetId = `validation-inline-${index}-${Date.now()}`;
			
			const widget = {
				getId: () => widgetId,
				getDomNode: () => {
					const node = document.createElement('span');
					node.className = isError ? 'monaco-inline-error' : 'monaco-inline-warning';
					node.textContent = ` ⚠️ ${error.message}`;
					node.style.opacity = '0.7';
					node.style.fontSize = `${inlineFontSize}px`;
					node.style.fontFamily = inlineFont;
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
		
		inlineErrorDecorations.set(editor, widgetIds);
		
		console.log(`Created ${widgetIds.length} inline content widgets`);
	}

	/**
	 * Clear validation markers
	 */
	static clearMarkers(editor: monaco.editor.IStandaloneCodeEditor): void {
		const model = editor.getModel();
		if (!model) return;
		
		monaco.editor.setModelMarkers(model, 'syntax-validator', []);
		
		// Clear inline error content widgets
		const oldWidgets = inlineErrorDecorations.get(editor) || [];
		oldWidgets.forEach(widgetId => {
			const widget = (editor as any)._contentWidgets?.[widgetId];
			if (widget) {
				editor.removeContentWidget(widget);
			}
		});
		inlineErrorDecorations.set(editor, []);
	}
}
