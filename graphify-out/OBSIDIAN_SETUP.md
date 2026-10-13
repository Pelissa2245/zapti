# Obsidian Graph Setup

## Quick Start

1. **Open `graphify-out/obsidian-graph.html` in Obsidian:**
   - Use "Open with" → "Obsidian" (if associated)
   - Or embed in a note: `![[graphify-out/obsidian-graph.html]]`
   - Or use the "Canvas" feature: drag `graphify-out/obsidian-graph.canvas` into a canvas

2. **For live updates, run this script after graphify regenerates:**
   ```bash
   python graphify-out/build_obsidian_graph.py
   ```

## Features

- **Search**: Filter nodes by name in real-time
- **Community Filter**: Dropdown to show/hide communities
- **Hyperedge Groups**: Click legend items to highlight architectural groups
- **God Nodes**: Top 10 most connected nodes pulse with a ring
- **Edge Confidence**: Dashed lines = INFERRED (0.85), Solid = EXTRACTED (1.0)
- **Click Node**: Copies file path to clipboard for quick Obsidian linking
- **Hover**: Shows details in side panel
- **Dark/Light Theme**: Auto-detects system preference

## Auto-Update Setup

### Option 1: Git Hook (Recommended)
Copy `graphify-out/.git-hooks/post-merge` to `.git/hooks/post-merge` and make executable:
```bash
cp graphify-out/.git-hooks/post-merge .git/hooks/post-merge
chmod +x .git/hooks/post-merge
```
This runs graphify and updates the graph after every `git pull`/`git merge`.

### Option 2: Manual
Run `python graphify-out/build_obsidian_graph.py` anytime.

### Option 3: Obsidian Plugin (Advanced)
The `obsidian-graph.canvas` file can be opened directly in Obsidian Canvas for a native feel.

## Data Source

Graph generated from 944 nodes, 1456 edges, 45 communities.
Last updated: 2026-10-12T12:25:15.916811
