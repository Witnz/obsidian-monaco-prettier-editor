# Monaco Prettier Editor

A powerful Obsidian plugin that integrates Monaco Editor (the editor from VS Code) with Prettier auto-formatting and customizable themes.

## Features

✨ **Monaco Editor Integration**
- Full Monaco Editor bundled locally (no external dependencies)
- Powerful code editing with VS Code's editor features
- IntelliSense, syntax highlighting, and code folding
- Multi-cursor support and advanced editing

🎨 **Theme Library**
- 10+ built-in themes (Monaco themes + popular presets)
- Import custom VS Code theme JSON files
- Themes: GitHub Dark, Monokai, Dracula, Solarized Dark, Nord, and more
- Transparent background option to blend with Obsidian themes

⚡ **Prettier Auto-Formatting**
- Format on save
- Format on type (with debouncing)
- Manual format command
- Highly configurable formatting options

🛠️ **Developer Features**
- Create code files with ribbon icon or command
- Quick file creation modal with extension selection
- Edit code blocks inline with Monaco editor modal
- Font ligatures support for programming fonts
- Custom font family configuration
- Transparent background option

🎯 **Minimal Theme Compatibility**
- Integrates with Minimal theme utilities
- Supports cards, full-width, and center classes
- Responsive design for all screen sizes
- Consistent with your vault's design system

## Installation

### Manual Installation

1. Download the latest release
2. Extract the files into `YOUR_VAULT/.obsidian/plugins/monaco-prettier-editor/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

### Building from Source

1. Clone this repository into your vault's plugins folder
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Reload Obsidian

## Usage

### Supported File Types

The plugin automatically registers handlers for **60+ file extensions** across major programming languages:

**JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`  
**Web**: `.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less`, `.xml`  
**Python**: `.py`, `.pyw`  
**Java/JVM**: `.java`, `.kt` (Kotlin), `.kts`, `.scala`  
**C/C++/C#**: `.c`, `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`, `.cs`  
**Systems**: `.go`, `.rs` (Rust), `.swift`, `.dart`  
**Scripting**: `.php`, `.rb` (Ruby), `.lua`, `.pl` (Perl), `.r`  
**Shell**: `.sh`, `.bash`, `.zsh`, `.ps1` (PowerShell)  
**Data/Config**: `.yaml`, `.yml`, `.toml`, `.ini`, `.conf`, `.cfg`, `.sql`  
**Functional**: `.ex`/`.exs` (Elixir), `.erl`/`.hrl` (Erlang), `.clj`/`.cljs` (Clojure), `.hs` (Haskell), `.ml`/`.fs` (F#)  
**Markup**: `.md`, `.markdown`  
**Other**: `.vb` (Visual Basic)

Simply click on any of these files in your vault to open them in Monaco Editor.

### Creating New Code Files

You can create new code files in multiple ways:

- **Ribbon Icon**: Click the file-code icon in the left sidebar
- **Command Palette**: Search for "Create new code file"
- **File Menu**: Right-click on any folder and select "Create code file"

The modal lets you choose:
- File name
- File extension (from your configured extensions)
- Location (when creating from file menu)

### Editing Code Blocks

The plugin supports editing individual code blocks from any Markdown document:

- **Right-click**: Click on any code block in a Markdown document and select "Edit code block in Monaco"
- **Command Palette**: Place your cursor in a code block and search for "Edit code block in Monaco editor"

A modal will open with a Monaco editor instance where you can edit the code block. Changes automatically sync back to your document when you close the modal. The modal inherits all your editor settings (theme, font, validation, etc.).

### Internal Link Previews

When hovering over internal links (`[[link]]`) to code files in Obsidian, the plugin shows a Monaco editor preview in the hover popover:

- Hover over any internal link to a code file (e.g., `[[main.ts]]`)
- A Monaco editor preview will appear showing the file contents
- The preview uses your current theme and editor settings
- Preview is read-only with syntax highlighting enabled
- Works with all supported file extensions

**Note**: You may need to enable "Detect all file extensions" in Obsidian's Settings > Files & Links to ensure code files appear in link suggestions.

You can disable this feature in the plugin settings if you prefer the default Obsidian behavior.

### Automatic Language Detection

The plugin includes intelligent programming language detection that automatically identifies the language from code content:

- **Supports 30+ Languages**: JavaScript, TypeScript, Python, Java, C++, Go, Rust, Ruby, PHP, and many more
- **Pattern Matching**: Uses syntax patterns, keywords, and language-specific constructs for accurate detection
- **Fallback Detection**: Automatically detects language when:
  - File extension is missing or ambiguous
  - Code blocks have no language tag (` ``` ` instead of ` ```javascript `)
  - Code blocks use generic tags like `text` or `plain`
- **Smart Integration**: Works seamlessly with both file editing and code block editing

Enable "Auto-detect programming language" in settings to activate this feature. The detector analyzes your code and provides appropriate syntax highlighting automatically.

### Lightweight Syntax Validation

In addition to full TypeScript/JavaScript validation, the plugin provides **lightweight syntax error detection** for additional languages without requiring language servers:

- **JSON**: Detects malformed JSON, unclosed braces, trailing commas, invalid syntax
- **YAML**: Identifies indentation errors, invalid keys, syntax violations
- **Python**: Catches unclosed strings/brackets, missing colons, indentation issues
- **CSS/SCSS**: Finds unmatched braces, missing semicolons

**Benefits**:
- ✅ **Fast**: No background processes or heavy language servers
- ✅ **Lightweight**: ~50KB total bundle size increase (js-yaml library)
- ✅ **Instant**: Real-time error detection as you type
- ✅ **Zero Configuration**: Works out of the box

Enable "Lightweight syntax validation" in settings. Errors appear with red squiggles just like in TypeScript/JavaScript files.

### Advanced Tree-sitter Validation (Planned Feature)

**Note**: Tree-sitter validation is currently in development. The infrastructure is in place, but WASM parser loading needs additional configuration. Coming in a future update.

### Commands

- **Open current file in Monaco Prettier Editor**: Opens the active file in the Monaco editor
- **Format current file with Prettier**: Manually triggers Prettier formatting
- **Create new code file**: Opens modal to create a new code file
- **Edit code block in Monaco editor**: Opens the code block at cursor in a Monaco editor modal

### Keyboard Shortcuts

Configure these in Obsidian's Hotkeys settings:
- Format document: Trigger Prettier formatting
- Open in Monaco: Open current file in Monaco Editor
- Create code file: Open create code file modal

## Configuration

### Editor Settings

- **Font Size**: Adjust editor font size (10-24px)
- **Font Family**: Customize font (supports Fira Code, Cascadia Code, etc.)
- **Font Ligatures**: Enable programming ligatures (→, ≠, >=, etc.)
- **Line Numbers**: Show/hide line numbers
- **Minimap**: Toggle code minimap
- **Word Wrap**: Enable/disable word wrapping
- **Code Folding**: Toggle code block folding
- **Semantic Validation**: Enable type checking and semantic analysis for TypeScript/JavaScript
- **Syntax Validation**: Enable syntax error detection for TypeScript/JavaScript
- **Lightweight Syntax Validation**: Enable syntax error detection for JSON, YAML, Python, CSS (no language server required)
- **Advanced Tree-sitter Validation**: (Planned feature) Professional-grade parsing for additional languages
- **Internal Link Previews**: Show Monaco editor preview when hovering over internal links to code files
- **Auto-detect Programming Language**: Automatically detect the programming language from code content when file extension is ambiguous or missing
- **Transparent Background**: Make editor background transparent to blend with Obsidian themes

### Prettier Settings

- **Format on Save**: Auto-format when saving files
- **Format on Type**: Auto-format while typing (1s delay)
- **Tab Width**: Spaces per indentation level (2-8)
- **Use Tabs**: Use tabs instead of spaces
- **Semicolons**: Add/remove semicolons
- **Single Quotes**: Use single or double quotes
- **Trailing Commas**: Configure trailing comma behavior
- **Bracket Spacing**: Space in object literals
- **Arrow Function Parens**: Always/avoid parentheses
- **Print Width**: Maximum line length (40-120)

### Theme Settings

- **Editor Theme**: Choose from 10+ built-in themes or import custom VS Code themes
  - Built-in: Visual Studio Light/Dark, High Contrast
  - Presets: GitHub Dark, Monokai, Dracula, Solarized Dark, Nord
- **Import Custom Theme**: Load VS Code theme JSON files from your vault
  - Supports standard VS Code theme format
  - Automatically parses colors and token rules
- **Transparent Background**: Make editor background transparent to blend with Obsidian themes

## Available Themes

**Built-in Monaco Themes:**
- Visual Studio Light (`vs`)
- Visual Studio Dark (`vs-dark`)
- High Contrast Dark (`hc-black`)
- High Contrast Light (`hc-light`)

**Preset Themes:**
- **GitHub Dark**: GitHub's dark theme with blue accents
- **Monokai**: Classic monokai with vibrant colors
- **Dracula**: Purple-themed dark editor
- **Solarized Dark**: Low-contrast dark theme
- **Nord**: Arctic-inspired cool colors

## Importing Custom Themes

Monaco Prettier Editor supports multiple ways to import VS Code themes:

### Method 1: Custom Theme JSON File

1. Download or create a VS Code theme JSON file
2. Place it in your Obsidian vault
3. Open Monaco Prettier Editor settings
4. Enter the path to your theme file (e.g., `themes/my-theme.json`)
5. Click "Load"
6. The theme will appear in the theme dropdown

**VS Code Theme Format:**
```json
{
  "name": "My Theme",
  "type": "dark",
  "colors": {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4"
  },
  "tokenColors": [
    {
      "scope": "comment",
      "settings": {
        "foreground": "#6a9955",
        "fontStyle": "italic"
      }
    }
  ]
}
```

### Method 2: VS Code Marketplace Extension

Load themes directly from the VS Code Marketplace by **Extension ID**:

1. Find the extension ID on marketplace (e.g., `Avetis.tokyo-night`)
2. Open Monaco Prettier Editor settings
3. Enter the extension ID in "Extension ID" field
4. Click "Load"
5. All themes from the extension will be imported

**Or use the Marketplace URL**:

1. Copy the marketplace URL (e.g., `https://marketplace.visualstudio.com/items?itemName=Avetis.tokyo-night`)
2. Paste it in "Marketplace URL" field
3. Click "Load"

**Popular Extensions to Try:**
- `Avetis.tokyo-night` - Tokyo Night theme
- `GitHub.github-vscode-theme` - GitHub themes
- `enkia.tokyo-night` - Tokyo Night variations
- `zhuangtongfa.Material-theme` - Material themes
- `sdras.night-owl` - Night Owl theme

### Method 3: Local VSIX File

If you have a VSIX file (VS Code extension package):

1. Download the `.vsix` file from marketplace or build one
2. Place it in your Obsidian vault
3. Open Monaco Prettier Editor settings
4. Enter the path (e.g., `extensions/theme.vsix`)
5. Click "Load"

**How to download VSIX files:**
- Visit marketplace page
- Click the "Download Extension" link on the right sidebar
- Or use: `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/{publisher}/vsextensions/{name}/{version}/vspackage`

### Notes

- Extensions can contain multiple themes - all will be imported
- Imported themes persist across Obsidian restarts
- You can import as many themes as you want
- Theme dropdown automatically updates after import

## Minimal Theme Integration

The plugin respects Minimal theme utilities when applied to editor containers:

- `.cards` - Card-style layout with hover effects
- `.full-width` - Full width container
- `.center` - Centered container

## Development

### Project Structure

```
monaco-prettier-editor/
├── main.ts              # Plugin entry point
├── MonacoView.ts        # Monaco editor view implementation
├── settings.ts          # Settings interface and defaults
├── SettingsTab.ts       # Settings UI
├── theme.ts             # Tokyo Night theme definition
├── styles.css           # Tokyo Night + Minimal styling
├── manifest.json        # Plugin manifest
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── esbuild.config.mjs   # Build configuration
└── README.md           # This file
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Dependencies

- `monaco-editor` - The Monaco Editor
- `prettier` - Code formatter
- `obsidian` - Obsidian API types
- `esbuild` - Build tool
- `typescript` - TypeScript compiler

## Compatibility

- **Obsidian**: v0.15.0+
- **Themes**: Tokyo Night, Minimal, and compatible themes
- **Platforms**: Desktop and mobile

## Credits

- Monaco Editor by Microsoft
- Prettier by the Prettier team
- Tokyo Night theme colors
- Minimal theme utilities
- Inspired by vscode-editor and code-files plugins

## License

MIT License

## Support

If you encounter issues:
1. Check the console for errors (Ctrl+Shift+I)
2. Verify file extensions are configured correctly
3. Try disabling other code editor plugins
4. Report issues with console output and steps to reproduce

## Changelog

### 1.0.0 (Initial Release)
- Monaco Editor integration with local bundling
- Prettier auto-formatting (on save, on type, manual)
- Tokyo Night theme with dark/light variants
- Minimal theme compatibility
- Comprehensive settings panel
- Support for 10+ programming languages
