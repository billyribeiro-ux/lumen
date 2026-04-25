# Lumen desktop icons

Drop the following files here before `pnpm tauri build`:

| File | Purpose |
|---|---|
| `32x32.png` | Linux taskbar |
| `128x128.png` | Linux dock |
| `128x128@2x.png` | Linux retina |
| `icon.icns` | macOS bundle |
| `icon.ico` | Windows bundle |
| `icon.png` | macOS tray |
| `tray.png` | macOS tray (template image, monochrome) |

Source the SVG from `static/favicon.svg` and export to all sizes via:

```bash
npx tauri icon static/favicon.svg
```

The CLI will write all the bundled formats. `tray.png` should be a
22×22 monochrome template image with the alpha channel preserved so
macOS dark/light mode tinting works correctly.
