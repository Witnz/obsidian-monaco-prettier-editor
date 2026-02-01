# Installation & Setup

## Quick Start

1. **Install dependencies**:
   ```bash
   cd monaco-prettier-editor
   npm install
   ```

2. **Build the plugin**:
   ```bash
   npm run build
   ```

3. **Copy to your Obsidian vault** (if not already there):
   ```bash
   # Windows
   xcopy /E /I . "F:\Obsidian\Vaults\Main\.obsidian\plugins\monaco-prettier-editor"
   
   # Mac/Linux
   cp -r . "/path/to/your/vault/.obsidian/plugins/monaco-prettier-editor"
   ```

4. **Enable in Obsidian**:
   - Open Obsidian Settings
   - Go to Community Plugins
   - Disable Safe Mode if needed
   - Find "Monaco Prettier Editor" and enable it

## Development Setup

For active development with auto-rebuild:

```bash
npm run dev
```

This will watch for file changes and rebuild automatically. You'll need to reload Obsidian to see changes.

## Build for Production

```bash
npm run build
```

This creates a minified build in `main.js`.

## Folder Structure

After building, your plugin folder should contain:

```
monaco-prettier-editor/
├── main.js              # Built plugin (generated)
├── manifest.json        # Plugin metadata
├── styles.css           # Tokyo Night styling
├── data.json            # User settings (generated on first run)
└── README.md           # Documentation
```

## Troubleshooting

### Build Errors

**Error: Cannot find module 'monaco-editor'**
```bash
npm install
```

**Error: TypeScript compilation failed**
```bash
npm install -g typescript
npm run build
```

### Monaco Editor Not Loading

1. Check browser console (Ctrl+Shift+I)
2. Verify `main.js` was created by build process
3. Try disabling other editor plugins
4. Reload Obsidian

### Prettier Not Formatting

1. Check file extension is supported
2. Verify "Format on Save" is enabled in settings
3. Check console for Prettier errors
4. Try manual format command

### Theme Not Applying

1. Verify "Use Tokyo Night Theme" is enabled
2. Check if Tokyo Night theme CSS variables are available
3. Try reloading the editor view

## Updating the Plugin

1. Pull latest changes
2. Run `npm install` (if dependencies changed)
3. Run `npm run build`
4. Reload Obsidian

## Debugging

Enable developer console in Obsidian:
- Windows/Linux: `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

Look for errors prefixed with "Monaco Prettier Plugin".

## Performance Tips

- Disable "Format on Type" for large files
- Reduce minimap size or disable it
- Adjust font size for better performance
- Use "Format on Save" instead of "Format on Type"

## Compatibility Notes

- Requires Obsidian 0.15.0 or higher
- Works on desktop (Windows, Mac, Linux)
- Mobile support available (Monaco has mobile optimization)
- Compatible with Tokyo Night and Minimal themes

## Next Steps

After installation:

1. Open Settings → Monaco Prettier Editor
2. Configure file extensions you want to handle
3. Adjust Prettier formatting preferences
4. Set editor appearance options
5. Try opening a code file!

## Support

For issues, check:
- Console for error messages
- README.md for configuration details
- Obsidian community forums
- GitHub issues (if published)
