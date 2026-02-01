import {
	ButtonComponent,
	DropdownComponent,
	Modal,
	normalizePath,
	Notice,
	TAbstractFile,
	TextComponent,
	TFile,
	TFolder,
} from "obsidian";
import MonacoPrettierPlugin from "./main";

export class CreateCodeFileModal extends Modal {
	fileName = "MyCodeFile";
	fileExtension = this.plugin.settings.fileExtensions[0];
	parent: TAbstractFile;

	constructor(private plugin: MonacoPrettierPlugin, parent?: TAbstractFile) {
		super(plugin.app);
		this.parent = parent ?? this.plugin.app.vault.getRoot();
	}

	onOpen() {
		const { contentEl } = this;
		
		// Set title
		this.titleEl.setText("Create Code File");
		
		// Style the modal content
		contentEl.style.display = "flex";
		contentEl.style.flexDirection = "column";
		contentEl.style.gap = "12px";
		contentEl.style.padding = "16px";

		// Create input row container
		const inputRow = contentEl.createDiv();
		inputRow.style.display = "flex";
		inputRow.style.alignItems = "center";
		inputRow.style.gap = "8px";

		// File name input
		const fileNameInput = new TextComponent(inputRow);
		fileNameInput.inputEl.style.flexGrow = "1";
		fileNameInput.setPlaceholder("Enter file name");
		fileNameInput.setValue(this.fileName);
		fileNameInput.inputEl.addEventListener("keypress", (e) => {
			if (e.key === "Enter") {
				this.complete();
			}
		});
		fileNameInput.onChange((value) => {
			this.fileName = value;
		});

		// Extension dropdown
		const fileExtensionInput = new DropdownComponent(inputRow);
		const extensions = this.plugin.settings.fileExtensions;
		fileExtensionInput.addOptions(
			extensions.reduce((acc, ext) => {
				acc[ext] = ext;
				return acc;
			}, {} as Record<string, string>)
		);
		fileExtensionInput.setValue(this.fileExtension);
		fileExtensionInput.onChange((value) => {
			this.fileExtension = value;
		});
		fileExtensionInput.selectEl.addEventListener("keypress", (e) => {
			if (e.key === "Enter") {
				this.complete();
			}
		});

		// Button row
		const buttonRow = contentEl.createDiv();
		buttonRow.style.display = "flex";
		buttonRow.style.justifyContent = "flex-end";
		buttonRow.style.gap = "8px";
		buttonRow.style.marginTop = "8px";

		// Cancel button
		const cancelButton = new ButtonComponent(buttonRow);
		cancelButton.setButtonText("Cancel");
		cancelButton.onClick(() => this.close());

		// Create button
		const submitButton = new ButtonComponent(buttonRow);
		submitButton.setCta();
		submitButton.setButtonText("Create");
		submitButton.onClick(() => this.complete());

		// Focus on file name input
		fileNameInput.inputEl.focus();
		fileNameInput.inputEl.select();
	}

	async complete() {
		// Validate file name
		if (!this.fileName || this.fileName.trim() === "") {
			new Notice("Please enter a file name");
			return;
		}

		this.close();

		const parent = (
			this.parent instanceof TFile ? this.parent.parent : this.parent
		) as TFolder;
		
		const newPath = normalizePath(`${parent.path}/${this.fileName}.${this.fileExtension}`);
		
		// Check if file already exists
		const existingFile = this.app.vault.getAbstractFileByPath(newPath);
		if (existingFile && existingFile instanceof TFile) {
			new Notice("File already exists - opening it instead");
			const leaf = this.app.workspace.getLeaf(true);
			await leaf.openFile(existingFile);
			return;
		}

		try {
			// Create the new file
			const newFile = await this.app.vault.create(newPath, "");
			
			// Open the file in a new leaf
			const leaf = this.app.workspace.getLeaf(true);
			await leaf.openFile(newFile);
			
			new Notice(`Created ${this.fileName}.${this.fileExtension}`);
		} catch (error) {
			new Notice(`Failed to create file: ${error.message}`);
			console.error("Error creating file:", error);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
