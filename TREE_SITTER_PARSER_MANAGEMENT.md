# Tree-sitter Parser Management

## Overview

This document describes the tree-sitter language parser management system scaffolded for the Monaco Prettier Editor plugin. Users can now download, install, and manage language-specific parsers directly from the plugin settings.

## Architecture

### Settings Structure

**TreeSitterLanguageParser Interface** (settings.ts):
```typescript
interface TreeSitterLanguageParser {
    language: string;        // Internal language ID (e.g., 'python')
    displayName: string;     // User-friendly name (e.g., 'Python')
    version: string;         // Parser version (e.g., '0.25.0')
    installed: boolean;      // Installation status
    installedVersion?: string; // Version currently installed
    cdnUrl: string;          // CDN URL for downloading WASM
    localPath?: string;      // Local file path after installation
    size?: number;           // File size in bytes
    lastUpdated?: number;    // Timestamp of last update
}
```

**Supported Languages**:
- JavaScript (0.25.0)
- TypeScript (0.23.2)
- TSX/JSX (0.23.2)
- Python (0.25.0)
- JSON (0.24.8)
- CSS (0.25.0)
- Go (0.25.0)
- Rust (0.24.0)

### Settings UI

**Location**: Settings → Editor → Advanced → Tree-sitter Language Parsers

**Features**:
1. **Parser List**: Displays all available parsers with:
   - Status badge (✓ Installed / ○ Not installed)
   - Display name and version
   - File size (when installed)
   - Download/Remove button
   - Info button with detailed information

2. **Bulk Actions**:
   - "Download All" - Downloads all uninstalled parsers
   - "Remove All" - Removes all installed parsers

3. **Parser Info Modal**:
   - Language details
   - Version information
   - Installation status
   - File size and last updated timestamp
   - CDN URL and local path

### Backend Implementation

**TreeSitterManager Updates** (TreeSitterManager.ts):
- `setSettings()` - Receives parser configuration from settings
- `getParser()` - Modified to load parsers from local vault files instead of CDN
- Checks installation status before attempting to load
- Provides helpful error messages when parsers are missing

**Parser Loading Flow**:
1. Check if parser is installed via settings
2. If not installed, return null with helpful message
3. If installed, read WASM file from `.obsidian/plugins/monaco-prettier-editor/wasm/`
4. Load language grammar using `Parser.Language.load()`
5. Cache parser for subsequent use

**ValidationManager Updates** (ValidationManager.ts):
- Receives full settings object instead of just `enableTreeSitter` boolean
- Passes parser configuration to TreeSitterManager
- Maintains backward compatibility

**MonacoView & FenceEditModal Updates**:
- Pass full settings object to ValidationManager
- Ensures parser configuration is available during validation

### File Management

**Download Process** (SettingsTab.ts):
1. Fetch WASM file from jsDelivr CDN
2. Verify HTTP 200 response
3. Create wasm directory if needed
4. Save file to `.obsidian/plugins/monaco-prettier-editor/wasm/tree-sitter-{language}.wasm`
5. Update settings with installation metadata
6. Display success notification

**Removal Process**:
1. Delete WASM file from vault
2. Clear installation metadata from settings
3. Display success notification

**Storage Location**:
```
.obsidian/plugins/monaco-prettier-editor/wasm/
├── tree-sitter.wasm          # Base tree-sitter runtime
├── tree-sitter-javascript.wasm
├── tree-sitter-typescript.wasm
├── tree-sitter-tsx.wasm
├── tree-sitter-python.wasm
├── tree-sitter-json.wasm
├── tree-sitter-css.wasm
├── tree-sitter-go.wasm
└── tree-sitter-rust.wasm
```

## Usage

### For Users

1. **Enable Tree-sitter**:
   - Go to Settings → Monaco Prettier Editor → Editor → Advanced
   - Enable "Enable Tree-sitter" toggle

2. **Download Parsers**:
   - Scroll to "Tree-sitter Language Parsers" section
   - Click "Download" next to desired languages
   - Or click "Download All" for all parsers

3. **Verify Installation**:
   - Status badge changes to "✓ Installed"
   - File size is displayed
   - Parser is now active for validation

4. **Remove Parsers**:
   - Click "Remove" next to installed parsers
   - Or click "Remove All" to clean up

5. **View Details**:
   - Click info button (ℹ) for detailed parser information
   - Shows version, size, paths, and CDN URL

### For Developers

**Adding New Language Parsers**:

1. Add to `DEFAULT_SETTINGS.treeSitterParsers` in settings.ts:
```typescript
'newlang': {
    language: 'newlang',
    displayName: 'New Language',
    version: '0.x.x',
    installed: false,
    cdnUrl: 'https://cdn.jsdelivr.net/npm/tree-sitter-newlang@0.x.x/tree-sitter-newlang.wasm'
}
```

2. Add language mapping in TreeSitterManager.ts:
```typescript
private static languageMap: Record<string, string> = {
    'newlang': 'newlang',
    // ...
};
```

3. No other changes needed - UI and download system work automatically!

**Testing Parser Installation**:
```typescript
// Check if parser is installed
const parser = settings.treeSitterParsers['python'];
console.log(`Python parser installed: ${parser.installed}`);
console.log(`Local path: ${parser.localPath}`);

// TreeSitterManager will automatically use local file
await TreeSitterManager.validateAndDisplayMarkers(editor, 'python', code, settings);
```

## Benefits

1. **User Control**: Users decide which parsers to install
2. **Storage Efficiency**: Only download needed parsers
3. **Offline Support**: Parsers stored locally, no CDN dependency after download
4. **Version Management**: Track installed versions and update capability
5. **Graceful Fallback**: Falls back to lightweight validators if parser unavailable
6. **Transparent**: Clear status indicators and helpful error messages

## Future Enhancements

- [ ] Automatic updates when new parser versions available
- [ ] Download progress indicators for large parsers
- [ ] Validate parser integrity (checksums)
- [ ] Export/import parser configurations
- [ ] Parser performance metrics
- [ ] Custom parser URLs for testing

## Technical Notes

### Why Local Storage?

Electron's security model blocks loading WASM files from CDN (Cross-Origin Resource Sharing restrictions). By downloading and storing parsers locally in the vault, we:
- Bypass CORS restrictions
- Improve loading performance
- Enable offline functionality
- Give users control over downloads

### Parser Loading Performance

- **First Load**: ~200-300ms (reading from disk, parsing WASM)
- **Cached Load**: <1ms (returns cached parser instance)
- **Base Initialization**: ~200ms (one-time, tree-sitter runtime)

### Memory Usage

Each language parser consumes:
- WASM file: 100-300 KB on disk
- Loaded parser: ~1-2 MB in memory (when active)
- Cached parsers persist until plugin unload

## References

- [web-tree-sitter Documentation](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web)
- [Tree-sitter Language Parsers](https://tree-sitter.github.io/tree-sitter/#parsers)
- [jsDelivr CDN](https://www.jsdelivr.com/)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
