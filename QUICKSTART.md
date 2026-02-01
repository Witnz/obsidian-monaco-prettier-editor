# 🚀 Quick Start Guide

## ✅ Build Complete!

Your Monaco Prettier Editor plugin has been successfully built!

**File size**: ~3.8 MB (includes Monaco Editor + Prettier)
**Location**: `F:\Obsidian\Vaults\Main\Vault Lab\NewMonaco\monaco-prettier-editor`

---

## 📋 Enable the Plugin

### Option 1: Copy to Your Vault (Recommended)

If this folder isn't already in your vault's plugins directory:

```powershell
# Copy the plugin to your vault
xcopy /E /I "F:\Obsidian\Vaults\Main\Vault Lab\NewMonaco\monaco-prettier-editor" "F:\Obsidian\Vaults\Main\.obsidian\plugins\monaco-prettier-editor"
```

### Option 2: Already in Vault?

If you built it directly in your vault's plugins folder, you're ready to go!

---

## 🔌 Activate in Obsidian

1. **Open Obsidian**
2. **Go to Settings** (⚙️ icon or `Ctrl+,`)
3. **Navigate to**: Community Plugins
4. **Disable Safe Mode** (if prompted)
5. **Refresh** the plugin list
6. **Find**: "Monaco Prettier Editor"
7. **Toggle ON** ✅

---

## ⚙️ Configure Settings

1. **Settings → Monaco Prettier Editor**
2. **Configure**:
   - ✅ File extensions (default: ts, js, json, css, html, md, py, yaml)
   - ✅ Font size (14px default)
   - ✅ Format on save (enabled)
   - ✅ Tokyo Night theme (enabled)
   - ✅ Prettier preferences (tabs, quotes, semicolons, etc.)

---

## 🎮 Try It Out!

### Open a Code File

1. **Create or open** a `.ts`, `.js`, `.json`, or `.css` file
2. **The file should open** in Monaco Editor automatically
3. **You'll see**:
   - Tokyo Night colors 🎨
   - Line numbers and minimap 📊
   - Syntax highlighting ✨

### Test Formatting

1. **Write some messy code**:
   ```javascript
   const x={a:1,b:2,c:3};function test(  ){return   x;}
   ```

2. **Save the file** (`Ctrl+S`)
3. **Watch it auto-format** to:
   ```javascript
   const x = { a: 1, b: 2, c: 3 };
   function test() {
     return x;
   }
   ```

### Manual Format Command

- **Press**: `Ctrl+P` (Command Palette)
- **Type**: "Format current file with Prettier"
- **Press**: Enter

---

## 🎨 Theme Verification

Your editor should display:

**Dark Mode** (Tokyo Night):
- Background: Deep blue-gray `#1a1b26`
- Text: Light gray-blue `#c0caf5`
- Keywords: Magenta `#bb9af7`
- Strings: Green `#9ece6a`
- Functions: Blue `#7aa2f7`
- Accents: Cyan `#7dcfff`

**Light Mode** (Tokyo Night Day):
- Background: Light gray `#d5d6db`
- Text: Dark blue `#343b58`
- Muted earth tones

---

## 🛠️ Troubleshooting

### Plugin Not Appearing?

1. **Check folder structure**:
   ```
   .obsidian/
   └── plugins/
       └── monaco-prettier-editor/
           ├── main.js ✅
           ├── manifest.json ✅
           └── styles.css ✅
   ```

2. **Reload Obsidian**: `Ctrl+R` or restart

### Monaco Not Loading?

1. **Open Console**: `Ctrl+Shift+I`
2. **Look for errors** mentioning "Monaco" or "prettier"
3. **Check** if `main.js` exists and is ~3.8 MB

### Formatting Not Working?

1. **Check Settings**: Format on Save enabled?
2. **Check File Type**: Is extension in supported list?
3. **Console Errors**: Any Prettier errors?
4. **Try Manual Format**: Command palette → "Format current file"

### Theme Not Applied?

1. **Settings**: "Use Tokyo Night Theme" toggled ON?
2. **Reload Editor**: Close and reopen the file
3. **Check Theme**: Is Tokyo Night theme active in Obsidian?

---

## 🎯 Supported File Types

✅ TypeScript (`.ts`, `.tsx`)
✅ JavaScript (`.js`, `.jsx`)
✅ JSON (`.json`)
✅ CSS/SCSS/Less
✅ HTML
✅ Markdown (`.md`)
✅ Python (`.py`)
✅ YAML/YML

---

## 📚 Advanced Usage

### Custom Keyboard Shortcuts

**Settings → Hotkeys → Search: "Monaco"**

Assign shortcuts for:
- Open in Monaco Editor
- Format with Prettier

### Format on Type

Enable in settings for real-time formatting (1-second delay).

### Custom File Extensions

Add/remove extensions in settings:
```
ts,tsx,js,jsx,json,css,scss,html,md,py,yaml,yml
```

---

## 🆘 Getting Help

### Developer Console

Always check console first:
1. `Ctrl+Shift+I` to open DevTools
2. Look at Console tab
3. Filter for "Monaco Prettier"

### Common Issues

**"Cannot read property of undefined"**
→ Monaco not fully loaded, try reopening file

**"Prettier parser not found"**
→ File extension not mapped to Prettier parser

**"Theme colors not applying"**
→ Tokyo Night CSS variables not available

---

## ✨ What's Next?

### Customize Your Experience

1. **Adjust font size** for readability
2. **Toggle minimap** based on preference
3. **Configure Prettier** rules to your style
4. **Try format-on-type** for live formatting

### Explore Features

- Multi-cursor editing (`Alt+Click`)
- Code folding (click arrows in gutter)
- Find and replace (`Ctrl+F`, `Ctrl+H`)
- IntelliSense (`Ctrl+Space`)
- Bracket pair colorization

---

## 🎉 Success Checklist

- [ ] Plugin enabled in Obsidian
- [ ] Settings configured
- [ ] Opened a code file
- [ ] Monaco editor displayed
- [ ] Tokyo Night colors visible
- [ ] Auto-formatting works on save
- [ ] Manual format command works

---

## 📊 Plugin Stats

**Lines of Code**: ~1000+ lines
**Bundle Size**: 3.8 MB
**Dependencies**: Monaco Editor, Prettier
**Supported Languages**: 10+
**Theme Modes**: Dark + Light
**Settings Options**: 20+

---

**You're all set!** 🎊

Enjoy coding with Monaco Editor, Prettier auto-formatting, and your beautiful Tokyo Night theme!

---

*Need more help? Check README.md or INSTALL.md for detailed documentation.*
