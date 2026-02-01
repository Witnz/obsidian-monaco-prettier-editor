import * as monaco from "monaco-editor";

/**
 * Lightweight syntax validation for non-TypeScript/JavaScript languages
 * Provides syntax error detection without full language servers
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
	 * Validate code based on language and display markers in Monaco editor
	 */
	static async validateAndDisplayMarkers(
		editor: monaco.editor.IStandaloneCodeEditor,
		language: string,
		code: string,
		enableTreeSitter: boolean = false
	): Promise<void> {
		let errors: ValidationError[] = [];
		
		// Tree-sitter is planned for future implementation
		// For now, use lightweight validators
		
		switch (language) {
			case 'json':
				errors = this.validateJSON(code);
				break;
			case 'yaml':
				errors = await this.validateYAML(code);
				break;
			case 'python':
				errors = this.validatePython(code);
				break;
			case 'css':
			case 'scss':
				errors = this.validateCSS(code);
				break;
			default:
				// No validation for other languages
				return;
		}
		
		// Convert errors to Monaco markers
		const model = editor.getModel();
		if (!model) return;
		
		const markers: monaco.editor.IMarkerData[] = errors.map(error => ({
			severity: error.severity === "error" 
				? monaco.MarkerSeverity.Error 
				: monaco.MarkerSeverity.Warning,
			startLineNumber: error.line,
			startColumn: error.column,
			endLineNumber: error.line,
			endColumn: error.column + 1,
			message: error.message,
		}));
		
		monaco.editor.setModelMarkers(model, 'syntax-validator', markers);
	}

	/**
	 * Clear validation markers
	 */
	static clearMarkers(editor: monaco.editor.IStandaloneCodeEditor): void {
		const model = editor.getModel();
		if (!model) return;
		
		monaco.editor.setModelMarkers(model, 'syntax-validator', []);
	}
}
