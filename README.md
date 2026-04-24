# Sukuna vs Mahoraga Goofy Arena

## Run locally (uses the existing project files)

### Option 1: Python (recommended)
1. Open a terminal in this folder:
   ```bash
   cd /workspace/testinglua
   ```
2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open in your browser:
   ```
   http://localhost:8000
   ```

### Option 2: Node
If you have `npx`:
```bash
cd /workspace/testinglua
npx serve .
```
Then open the URL shown in terminal.

---

## Important: keep assets working
The game already loads local files from `assets/` in `script.js`:
- `assets/sukuna.svg`
- `assets/mahoraga.svg`
- `assets/shrine.svg`
- `assets/handsign.svg`

So to keep it using the files:
- Keep the folder name exactly `assets`
- Keep those filenames unchanged (or update paths in `script.js`)
- Run through a local server (not `file://...`) so browser loading behavior is consistent

## Restarting battles
Click **New Battle** to randomize movement/ability patterns and get a different winner over multiple runs.
