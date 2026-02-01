# Monaco Prettier Editor for Obsidian

A powerful Obsidian plugin that integrates the full Monaco Editor (VS Code's editor) with Prettier auto-formatting and extensive theme support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)
![Monaco Editor](https://img.shields.io/badge/Monaco-0.45.0-green.svg)

## ✨ Features

### 🎯 Core Capabilities
- **Full Monaco Editor** - The complete VS Code editor experience in Obsidian
- **60+ File Types** - JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more
- **Prettier Integration** - Auto-format on save with full configuration support
- **Custom Themes** - Import VS Code themes (JSON/VSIX) or use built-in presets
- **YAML Validation** - Built-in validation for YAML files
- **Code Folding** - Collapse/expand code blocks
- **Multi-cursor Editing** - VS Code-style multiple cursors
- **IntelliSense** - Auto-completion and syntax checking

### 🎨 Theming
- **10+ Built-in Themes**: GitHub Dark, Monokai, Dracula, Solarized, Nord, Tokyo Night, and more
- **VS Code Marketplace Integration**: Download themes directly from VS Code Marketplace
- **Custom Theme Import**: Load `.json` theme files or `.vsix` extensions
- **Transparent Background**: Blend seamlessly with your Obsidian theme

### ⚡ Developer Experience
- **Create Code Files**: Ribbon icon, command palette, or file menu
- **Edit Code Blocks**: Right-click any markdown code block to edit in full Monaco editor
- **Link Previews**: Hover over code file links to see previews
- **Font Ligatures**: Support for programming fonts like Fira Code
- **Tabbed Settings**: Organized settings UI (General, Editor, Formatting, Theme)
- **Live Updates**: 10+ settings apply instantly without reopening files

## 📦 Installation

### From Obsidian Community Plugins
1. Open Obsidian Settings
2. Go to Community Plugins → Browse
3. Search for "Monaco Prettier Editor"
4. Click Install, then Enable

### Manual Installation
1. Download the latest release from [Releases](../../releases)
2. Extract files to `YOUR_VAULT/.obsidian/plugins/monaco-prettier-editor/`
3. Reload Obsidian
4. Enable plugin in Settings → Community Plugins

### Build from Source
```bash
cd YOUR_VAULT/.obsidian/plugins
git clone https://github.com/YOUR_USERNAME/obsidian-monaco-prettier-editor.git monaco-prettier-editor
cd monaco-prettier-editor
npm install
npm run build
```

## 🚀 Usage

### Supported File Extensions

The plugin automatically handles these file types:

| Language | Extensions |
|----------|------------|
| **JavaScript/TypeScript** | `.js`, `.jsx`, `.ts`, `.tsx`, `.json` |
| **Web** | `.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less`, `.xml` |
| **Python** | `.py`, `.pyw` |
| **Java/JVM** | `.java`, `.kt`, `.kts`, `.scala` |
| **C/C++/C#** | `.c`, `.cpp`, `.cc`, `.h`, `.hpp`, `.cs` |
| **Systems** | `.go`, `.rs`, `.swift`, `.dart` |
| **Scripting** | `.php`, `.rb`, `.lua`, `.pl`, `.r`, `.sh`, `.bash`, `.zsh`, `.ps1` |
| **Config/Data** | `.yaml`, `.yml`, `.toml`, `.ini`, `.conf`, `.sql` |
| **Functional** | `.ex`, `.exs`, `.erl`, `.clj`, `.hs`, `.ml`, `.fs` |
| **Other** | `.vb` |

### Creating New Files

**Ribbon Icon**: Click the code file icon in left sidebar  
**Command Palette**: `Ctrl/Cmd+P` → "Create new code file"  
**File Menu**: Right-click folder → "Create code file"

### Editing Code Blocks

Place cursor in any markdown code block, then:
- Right-click → "Edit code block in Monaco"
- Or use Command Palette → "Edit code block"

A full Monaco editor modal opens - changes sync back automatically.

### Importing Themes

**From VS Code Marketplace**:
```
Settings → Monaco Prettier Editor → Themes → Load from Marketplace
Enter extension ID (e.g., "GitHub.github-vscode-theme")
```

**From VSIX File**:
```
Settings → Monaco Prettier Editor → Themes → Load from VSIX
Select your .vsix theme file
```

**From JSON File**:
```
Settings → Monaco Prettier Editor → Themes → Load from File
Select your theme.json file
```

## ⚙️ Settings

Settings are organized into 4 tabs for easy navigation:

### General Tab
- **File Extensions**: Configure which extensions open in Monaco
- **Validation Options**: Semantic, syntax, and lightweight validation
- **Link Previews**: Enable/disable code file link previews
- **Auto-detect Language**: Automatically detect programming language

### Editor Tab (Live Updates ✨)
These settings apply instantly to all open editors:
- **Font Family**: Customize editor font (supports ligatures)
- **Font Size**: Adjustable text size (also `Ctrl+Scroll`) ⚡
- **Font Ligatures**: Enable programming font ligatures ⚡
- **Line Numbers**: Show/hide line numbers ⚡
- **Minimap**: Code overview sidebar ⚡
- **Word Wrap**: Wrap long lines ⚡
- **Code Folding**: Collapse code blocks ⚡

### Formatting Tab
- **Format on Save**: Auto-format when saving
- **Format on Type**: Real-time formatting (debounced)
- **Tab Width**: Spaces per indentation level ⚡
- **Use Tabs**: Use tabs instead of spaces
- **Print Width**: Maximum line length
- **Semi-colons**: Add/remove semicolons
- **Single Quotes**: Use single vs double quotes
- **Trailing Commas**: Add trailing commas in arrays/objects
- **Bracket Spacing**: Spacing in object literals
- **Arrow Parens**: Parentheses in arrow functions

### Theme Tab (Live Updates ✨)
- **Selected Theme**: Choose active theme ⚡
- **Transparent Background**: Blend with Obsidian theme ⚡
- **Custom Theme Import**: Load JSON/VSIX themes from vault or marketplace
- **Theme Persistence**: Imported themes saved across sessions

## 🎨 Available Themes

**Built-in Themes**:
- GitHub Dark/Light
- VS Code Dark+/Light+
- Monokai
- Dracula
- Solarized Dark/Light
- Nord
- Tokyo Night
- One Dark Pro
- Ayu Dark
- Night Owl

**Import Your Own**: Any VS Code theme available on the marketplace or as a standalone file.

## 🔧 Development

### Project Structure
```
monaco-prettier-editor/
├── MonacoView.ts          # Main editor view
├── ThemeManager.ts        # Theme loading and management
├── ValidationManager.ts   # YAML/code validation
├── SettingsTab.ts         # Settings UI
├── main.ts                # Plugin entry point
├── esbuild.config.mjs     # Build configuration
└── styles.css             # Monaco CSS bundle
```

### Building
```bash
npm install        # Install dependencies
npm run build     # Production build
npm run dev       # Development mode (watch)
```

### Technologies
- **Monaco Editor**: 0.45.0
- **Prettier**: 3.2.4
- **js-yaml**: 4.1.1 (YAML validation)
- **JSZip**: 3.10.1 (VSIX theme loading)
- **TypeScript**: 4.7.4
- **esbuild**: 0.17.3

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Credits

- **Monaco Editor** by Microsoft - The core editor engine
- **Prettier** - Code formatting
- **Obsidian** - The extensible knowledge base
- **VS Code Community** - Theme ecosystem

## 🐛 Known Issues & Limitations

- **Monaco Features**: Some VS Code features (debugging, extensions, terminal) are not available
- **Large Files**: Files >5MB may experience performance degradation
- **Validation Scope**: Semantic/syntax validation is limited to TypeScript/JavaScript
- **Markdown Conflict**: `.md` files excluded by default to avoid conflicts with Obsidian's native editor

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history

## 💬 Support

- [GitHub Issues](../../issues) - Bug reports and feature requests
- [Obsidian Forum](https://forum.obsidian.md/) - Community discussion

---

**Made with ❤️ for the Obsidian community**
