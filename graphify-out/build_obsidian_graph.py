#!/usr/bin/env python3
"""
Build interactive Obsidian graph from graphify output.
Generates a self-contained HTML file for embedding in Obsidian.
"""

import json
import html
from pathlib import Path

GRAPHIFY_OUT = Path("graphify-out")

# Load data
with open(GRAPHIFY_OUT / "graph.json", "r", encoding="utf-8") as f:
    graph = json.load(f)

with open(GRAPHIFY_OUT / ".graphify_analysis.json", "r", encoding="utf-8") as f:
    analysis = json.load(f)

nodes = graph["nodes"]
edges = graph["links"] if "links" in graph else graph["edges"]
communities = analysis.get("communities", {})
# Hyperedges are in graph["graph"]["hyperedges"]
hyperedges_raw = graph.get("graph", {}).get("hyperedges", [])

# Compute node degrees for sizing
from collections import Counter
degree = Counter()
for e in edges:
    src = e.get("source") or e.get("source_id") or e.get("source_id")
    tgt = e.get("target") or e.get("target_id") or e.get("target_id")
    if src: degree[src] += 1
    if tgt: degree[tgt] += 1

# Add degree to nodes
for n in nodes:
    n["degree"] = degree.get(n["id"], 0)

# Community colors (distinct palette)
COMMUNITY_COLORS = [
    "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00",
    "#ffff33", "#a65628", "#f781bf", "#999999", "#66c2a5",
    "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f",
    "#e5c494", "#b3b3b3", "#1b9e77", "#d95f02", "#7570b3",
]

# Build Sigma.js compatible data
sigma_nodes = []
for n in nodes:
    comm_id = n.get("community", 0)
    color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)]
    size = max(4, min(20, 4 + n["degree"] * 0.5))

    # Determine if god node (top 10 by degree)
    sorted_degrees = sorted([x["degree"] for x in nodes], reverse=True)
    god_threshold = sorted_degrees[min(9, len(nodes)-1)]
    is_god = n["degree"] >= god_threshold

    label = n.get("label") or n.get("id", "")[:50]

    sigma_nodes.append({
        "id": n["id"],
        "label": label,
        "x": (hash(n["id"]) % 1000) / 1000,
        "y": ((hash(n["id"]) // 1000) % 1000) / 1000,
        "size": size,
        "color": color,
        "original_color": color,
        "community": comm_id,
        "degree": n["degree"],
        "is_god": is_god,
        "file_type": n.get("file_type", "unknown"),
        "source_file": n.get("source_file", ""),
        "rationale": n.get("rationale", ""),
        "file_path": n.get("source_file", ""),
    })

sigma_edges = []
for i, e in enumerate(edges):
    src = e.get("source") or e.get("source_id") or e.get("source_id")
    tgt = e.get("target") or e.get("target_id") or e.get("target_id")
    if not src or not tgt:
        continue
    conf = float(e.get("confidence_score", 1.0))
    edge_type = e.get("confidence", "EXTRACTED")

    sigma_edges.append({
        "id": f"e{i}",
        "source": src,
        "target": tgt,
        "size": 1 + conf * 2,
        "color": "#666666" if conf >= 0.95 else "#aaaaaa",
        "confidence": conf,
        "edge_type": edge_type,
        "hidden": False,
    })

# Build hyperedge data
hyperedge_list = []
for h in hyperedges_raw:
    if isinstance(h, dict):
        name = h.get("id") or h.get("label") or "Unknown"
        members = h.get("nodes") or h.get("members") or h.get("member_ids") or []
        confidence = float(h.get("confidence_score", 1.0))
        edge_type = h.get("confidence") or h.get("type", "EXTRACTED")
    else:
        continue
    hyperedge_list.append({
        "name": name,
        "members": members,
        "confidence": confidence,
        "type": edge_type,
        "color": COMMUNITY_COLORS[len(hyperedge_list) % len(COMMUNITY_COLORS)],
    })

# Prepare communities for dropdown
community_info = {}
for cid, members in communities.items():
    community_info[str(cid)] = {
        "id": int(cid),
        "name": f"Community {cid}",
        "count": len(members) if isinstance(members, list) else 0,
    }

# JSON encode for embedding
nodes_json = json.dumps(sigma_nodes, ensure_ascii=False)
edges_json = json.dumps(sigma_edges, ensure_ascii=False)
hyperedges_json = json.dumps(hyperedge_list, ensure_ascii=False)
communities_json = json.dumps(community_info, ensure_ascii=False)
colors_json = json.dumps(COMMUNITY_COLORS, ensure_ascii=False)

# HTML template parts
html_head = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZapTI Knowledge Graph</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg, #1a1a2e); color: var(--fg, #eee); }
        :root {
            --bg: #1a1a2e; --fg: #eee; --panel: #16213e; --border: #0f3460;
            --accent: #e94560; --accent-hover: #ff6b6b; --muted: #888;
        }
        @media (prefers-color-scheme: light) {
            :root { --bg: #f5f5f5; --fg: #222; --panel: #fff; --border: #ddd; --accent: #c0392b; --accent-hover: #e74c3c; --muted: #666; }
        }
        .container { display: flex; height: 100vh; overflow: hidden; }
        #graph-container { flex: 1; position: relative; }
        #sigma-container { width: 100%; height: 100%; }
        .panel { width: 320px; background: var(--panel); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; }
        .panel-header { padding: 16px; border-bottom: 1px solid var(--border); font-weight: 600; }
        .panel-section { padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .panel-section h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: var(--muted); }
        .search-box { width: 100%; padding: 8px 12px; border: 1px solid var(--border); background: var(--bg); color: var(--fg); border-radius: 6px; font-size: 14px; }
        .search-box:focus { outline: none; border-color: var(--accent); }
        .filter-group { margin-top: 12px; }
        .filter-group label { display: block; margin-bottom: 6px; font-size: 12px; color: var(--muted); }
        select { width: 100%; padding: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--fg); border-radius: 6px; font-size: 13px; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer; font-size: 13px; }
        .checkbox-label input { width: 16px; height: 16px; accent-color: var(--accent); }
        .legend-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; font-size: 12px; }
        .legend-color { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .node-detail { padding: 12px; background: var(--bg); border-radius: 6px; margin-top: 12px; font-size: 12px; line-height: 1.6; }
        .node-detail h4 { margin: 0 0 8px; color: var(--accent); }
        .node-detail .meta { color: var(--muted); font-size: 11px; margin-bottom: 8px; }
        .node-detail .rationale { white-space: pre-wrap; font-style: italic; }
        .stats { display: flex; gap: 16px; font-size: 12px; color: var(--muted); padding: 8px 0; }
        .stat { display: flex; align-items: center; gap: 4px; }
        .stat strong { color: var(--fg); }
        .god-badge { display: inline-block; background: var(--accent); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 8px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--accent); } 50% { box-shadow: 0 0 0 8px transparent; } }
        .hidden { display: none !important; }
        .hyperedge-legend { max-height: 200px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div id="graph-container">
            <div id="sigma-container"></div>
        </div>
        <div class="panel">
            <div class="panel-header">
                ZapTI Knowledge Graph
                <div class="stats">
                    <span class="stat"><strong>""" + str(len(sigma_nodes)) + """</strong> nodes</span>
                    <span class="stat"><strong>""" + str(len(sigma_edges)) + """</strong> edges</span>
                    <span class="stat"><strong>""" + str(len(community_info)) + """</strong> communities</span>
                </div>
            </div>

            <div class="panel-section">
                <h4>Search</h4>
                <input type="text" class="search-box" id="search" placeholder="Filter nodes by name...">
            </div>

            <div class="panel-section">
                <h4>Community Filter</h4>
                <div class="filter-group">
                    <label>Show community:</label>
                    <select id="community-filter">
                        <option value="">All Communities</option>
"""

# Community options
comm_options = ""
for cid, info in sorted(community_info.items(), key=lambda x: int(x[0])):
    comm_options += f'                        <option value="{cid}">{html.escape(info["name"])} ({info["count"]})</option>\n'

html_middle = """                    </select>
                </div>
            </div>

            <div class="panel-section">
                <h4>Hyperedge Groups</h4>
                <div class="hyperedge-legend" id="hyperedge-legend">
"""

# Hyperedge legend items
he_legend = ""
for h in hyperedge_list:
    he_legend += f'''                    <label class="legend-item">
                        <input type="checkbox" class="hyperedge-toggle" data-name="{html.escape(h['name'])}" checked>
                        <span class="legend-color" style="background:{h['color']}"></span>
                        <span>{html.escape(h['name'])} ({len(h['members'])})</span>
                    </label>\n'''

html_tail = """                </div>
            </div>

            <div class="panel-section">
                <h4>Display Options</h4>
                <label class="checkbox-label">
                    <input type="checkbox" id="show-god-nodes" checked> Highlight God Nodes
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="show-edge-types" checked> Show Edge Confidence
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="show-labels" checked> Show Labels
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="physics-enabled" checked> Enable Physics
                </label>
            </div>

            <div class="panel-section">
                <h4>Node Details</h4>
                <div class="node-detail" id="node-detail">
                    Click a node to see details
                </div>
            </div>
        </div>
    </div>

    <script>
    // Data embedded as JSON
    const nodesData = """ + nodes_json + """;
    const edgesData = """ + edges_json + """;
    const hyperedgesData = """ + hyperedges_json + """;
    const communitiesData = """ + communities_json + """;
    const COMMUNITY_COLORS = """ + colors_json + """;
    </script>

    <script>
    // Main graph logic
    (function() {
        const container = document.getElementById('sigma-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio;

        // State
        let nodes = nodesData.map(n => ({...n, vx: 0, vy: 0, fx: null, fy: null, hidden: false, highlight: false}));
        let edges = edgesData.map(e => ({...e, hidden: false}));
        let hyperedges = hyperedgesData;
        let selectedNode = null;
        let hoveredNode = null;
        let animationId = null;
        let physicsEnabled = true;

        // Layout: ForceAtlas2-inspired
        function applyForces() {
            if (!physicsEnabled) return;

            const k = 30000; // repulsion strength
            const gravity = 0.01;
            const damping = 0.9;
            const maxForce = 1000;

            // Repulsion
            for (let i = 0; i < nodes.length; i++) {
                const ni = nodes[i];
                if (ni.hidden || ni.fx !== null) continue;
                let fx = 0, fy = 0;

                for (let j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    const nj = nodes[j];
                    if (nj.hidden) continue;
                    const dx = ni.x - nj.x;
                    const dy = ni.y - nj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    const force = k / (dist * dist);
                    fx += (dx / dist) * force;
                    fy += (dy / dist) * force;
                }

                // Gravity to center
                fx -= ni.x * gravity * 1000;
                fy -= ni.y * gravity * 1000;

                ni.vx = (ni.vx + fx) * damping;
                ni.vy = (ni.vy + fy) * damping;

                // Clamp velocity
                const vmag = Math.sqrt(ni.vx * ni.vx + ni.vy * ni.vy);
                if (vmag > maxForce) {
                    ni.vx = (ni.vx / vmag) * maxForce;
                    ni.vy = (ni.vy / vmag) * maxForce;
                }
            }

            // Edge attraction
            for (const e of edges) {
                if (e.hidden) continue;
                const ni = nodes.find(n => n.id === e.source);
                const nj = nodes.find(n => n.id === e.target);
                if (!ni || !nj || ni.hidden || nj.hidden) continue;
                const dx = nj.x - ni.x;
                const dy = nj.y - ni.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const force = dist * dist / 50000 * e.size;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                if (ni.fx === null) { ni.vx += fx; ni.vy += fy; }
                if (nj.fx === null) { nj.vx -= fx; nj.vy -= fy; }
            }

            // Apply velocities
            for (const n of nodes) {
                if (n.hidden || n.fx !== null) continue;
                n.x += n.vx * 0.016;
                n.y += n.vy * 0.016;
            }
        }

        // Render
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Transform
            const scale = Math.min(width, height) * 0.4 * dpr;
            const tx = width * dpr / 2;
            const ty = height * dpr / 2;

            // Draw edges
            ctx.lineWidth = 1 * dpr;
            for (const e of edges) {
                if (e.hidden) continue;
                const ni = nodes.find(n => n.id === e.source);
                const nj = nodes.find(n => n.id === e.target);
                if (!ni || !nj || ni.hidden || nj.hidden) continue;

                const x1 = ni.x * scale + tx;
                const y1 = ni.y * scale + ty;
                const x2 = nj.x * scale + tx;
                const y2 = nj.y * scale + ty;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);

                if (e.confidence < 0.95 && document.getElementById('show-edge-types').checked) {
                    ctx.setLineDash([5 * dpr, 5 * dpr]);
                } else {
                    ctx.setLineDash([]);
                }

                // Highlight if connected to selected/hovered
                const highlight = (selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id)) ||
                                 (hoveredNode && (e.source === hoveredNode.id || e.target === hoveredNode.id));
                ctx.strokeStyle = highlight ? '#e94560' : e.color;
                ctx.globalAlpha = highlight ? 0.8 : 0.3;
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.setLineDash([]);
            }

            // Draw nodes
            for (const n of nodes) {
                if (n.hidden) continue;

                const x = n.x * scale + tx;
                const y = n.y * scale + ty;
                const size = n.size * dpr;

                // God node pulse ring
                if (n.is_god && document.getElementById('show-god-nodes').checked) {
                    const time = Date.now() / 1000;
                    const pulseSize = size + Math.sin(time * 3) * 4 * dpr;
                    ctx.beginPath();
                    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
                    ctx.strokeStyle = '#e94560';
                    ctx.lineWidth = 2 * dpr;
                    ctx.globalAlpha = 0.5;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // Node circle
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.fill();

                // Selected/hovered ring
                if (n === selectedNode || n === hoveredNode) {
                    ctx.beginPath();
                    ctx.arc(x, y, size + 3 * dpr, 0, Math.PI * 2);
                    ctx.strokeStyle = '#e94560';
                    ctx.lineWidth = 3 * dpr;
                    ctx.stroke();
                }

                // Label
                if (document.getElementById('show-labels').checked && (n.degree > 5 || n.is_god || n === hoveredNode || n === selectedNode)) {
                    ctx.font = `${12 * dpr}px sans-serif`;
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.fillText(n.label, x, y - size - 4 * dpr);
                }
            }
        }

        // Animation loop
        function animate() {
            applyForces();
            render();
            animationId = requestAnimationFrame(animate);
        }

        // Interaction
        function getNodeAt(x, y) {
            const scale = Math.min(width, height) * 0.4 * dpr;
            const tx = width * dpr / 2;
            const ty = height * dpr / 2;

            for (const n of nodes) {
                if (n.hidden) continue;
                const nx = n.x * scale + tx;
                const ny = n.y * scale + ty;
                const dx = x - nx;
                const dy = y - ny;
                if (dx * dx + dy * dy <= (n.size + 10) * (n.size + 10) * dpr * dpr) {
                    return n;
                }
            }
            return null;
        }

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * dpr;
            const y = (e.clientY - rect.top) * dpr;
            hoveredNode = getNodeAt(x, y);
            updateNodeDetail();
            canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
        });

        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * dpr;
            const y = (e.clientY - rect.top) * dpr;
            const node = getNodeAt(x, y);
            if (node) {
                selectedNode = node;
                // Copy file path to clipboard
                if (node.file_path) {
                    navigator.clipboard.writeText(node.file_path).then(() => {
                        showToast('Copied: ' + node.file_path);
                    });
                }
            } else {
                selectedNode = null;
            }
            updateNodeDetail();
        });

        canvas.addEventListener('mousedown', e => {
            if (hoveredNode) {
                hoveredNode.fx = hoveredNode.x;
                hoveredNode.fy = hoveredNode.y;
                canvas.style.cursor = 'grabbing';
            }
        });

        canvas.addEventListener('mouseup', () => {
            if (hoveredNode) {
                hoveredNode.fx = null;
                hoveredNode.fy = null;
                canvas.style.cursor = 'pointer';
            }
        });

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            // Zoom not implemented in this simple version
        }, { passive: false });

        // Search filter
        document.getElementById('search').addEventListener('input', e => {
            const query = e.target.value.toLowerCase();
            for (const n of nodes) {
                n.hidden = query && !n.label.toLowerCase().includes(query) && !n.id.toLowerCase().includes(query);
            }
            updateNodeDetail();
        });

        // Community filter
        document.getElementById('community-filter').addEventListener('change', e => {
            const comm = e.target.value;
            for (const n of nodes) {
                n.hidden = comm !== '' && n.community !== parseInt(comm);
            }
            updateNodeDetail();
        });

        // Hyperedge toggles
        document.querySelectorAll('.hyperedge-toggle').forEach(cb => {
            cb.addEventListener('change', e => {
                const name = e.target.dataset.name;
                const he = hyperedges.find(h => h.name === name);
                if (he) {
                    for (const n of nodes) {
                        if (he.members.includes(n.id)) {
                            n.highlight = e.target.checked;
                            if (!e.target.checked && !n.hidden) n.color = n.original_color;
                            else if (e.target.checked) n.color = he.color;
                        }
                    }
                }
            });
        });

        // Display options
        document.getElementById('show-god-nodes').addEventListener('change', render);
        document.getElementById('show-edge-types').addEventListener('change', render);
        document.getElementById('show-labels').addEventListener('change', render);
        document.getElementById('physics-enabled').addEventListener('change', e => {
            physicsEnabled = e.target.checked;
        });

        // Node detail panel
        function updateNodeDetail() {
            const detail = document.getElementById('node-detail');
            const node = selectedNode || hoveredNode;
            if (!node) {
                detail.innerHTML = 'Click a node to see details';
                return;
            }
            let html = '<h4>' + escapeHtml(node.label) + (node.is_god ? '<span class="god-badge">GOD NODE</span>' : '') + '</h4>';
            html += '<div class="meta">ID: ' + escapeHtml(node.id) + '<br>Community: ' + node.community + '<br>Degree: ' + node.degree + '<br>Type: ' + escapeHtml(node.file_type) + '</div>';
            if (node.source_file) {
                html += '<div class="meta">File: ' + escapeHtml(node.source_file) + '</div>';
            }
            if (node.rationale) {
                html += '<div class="rationale">' + escapeHtml(node.rationale) + '</div>';
            }
            if (node.file_path) {
                html += '<div class="meta">Path: ' + escapeHtml(node.file_path) + ' (copied on click)</div>';
            }
            detail.innerHTML = html;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showToast(msg) {
            const toast = document.createElement('div');
            toast.textContent = msg;
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--accent);color:white;padding:10px 20px;border-radius:6px;z-index:1000;font-size:13px;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

        // Handle resize
        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
        });

        // Start animation
        animate();
    })();
    </script>
</body>
</html>"""

# Write HTML output
html_output = html_head + comm_options + html_middle + he_legend + html_tail
output_path = GRAPHIFY_OUT / "obsidian-graph.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_output)

print(f"Generated: {output_path}")
print(f"Nodes: {len(sigma_nodes)}, Edges: {len(sigma_edges)}, Hyperedges: {len(hyperedge_list)}")

# Also create Obsidian Canvas file
canvas_data = {
    "nodes": [],
    "edges": []
}

# Position nodes in a grid for canvas
cols = int(len(sigma_nodes) ** 0.5) + 1
for i, n in enumerate(sigma_nodes):
    x = (i % cols) * 300
    y = (i // cols) * 200
    canvas_data["nodes"].append({
        "id": n["id"],
        "type": "text",
        "x": x,
        "y": y,
        "width": 200,
        "height": 100,
        "text": f"**{n['label']}**\n\nCommunity: {n['community']}\nDegree: {n['degree']}\nType: {n['file_type']}\nFile: {n['source_file']}",
        "color": COMMUNITY_COLORS[n["community"] % len(COMMUNITY_COLORS)]
    })

for e in sigma_edges:
    canvas_data["edges"].append({
        "id": e["id"],
        "from": e["source"],
        "to": e["target"],
        "label": f"{e['edge_type']} ({e['confidence']:.2f})",
        "color": e["color"]
    })

canvas_path = GRAPHIFY_OUT / "obsidian-graph.canvas"
with open(canvas_path, "w", encoding="utf-8") as f:
    json.dump(canvas_data, f, indent=2, ensure_ascii=False)

print(f"Generated: {canvas_path}")

# Create setup instructions
import datetime
setup_md = f"""# Obsidian Graph Setup

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

Graph generated from {len(sigma_nodes)} nodes, {len(sigma_edges)} edges, {len(community_info)} communities.
Last updated: {datetime.datetime.now().isoformat()}
"""

setup_path = GRAPHIFY_OUT / "OBSIDIAN_SETUP.md"
with open(setup_path, "w", encoding="utf-8") as f:
    f.write(setup_md)

print(f"Generated: {setup_path}")

# Create git hook template
hook_dir = GRAPHIFY_OUT / ".git-hooks"
hook_dir.mkdir(exist_ok=True)
hook_content = """#!/bin/bash
# Git post-merge hook: regenerate graphify and Obsidian graph
# Install: cp graphify-out/.git-hooks/post-merge .git/hooks/post-merge && chmod +x .git/hooks/post-merge

echo "🔄 Post-merge: Regenerating knowledge graph..."

# Run graphify extraction (adjust path as needed)
cd "$(git rev-parse --show-toplevel)"
python -m graphify --root . --out graphify-out

# Update Obsidian graph
python graphify-out/build_obsidian_graph.py

echo "✅ Knowledge graph updated: graphify-out/obsidian-graph.html"
"""

hook_path = hook_dir / "post-merge"
with open(hook_path, "w", encoding="utf-8") as f:
    f.write(hook_content)

print(f"Generated: {hook_path}")
print("\n✅ All files generated!")
print(f"  - {output_path} (interactive HTML)")
print(f"  - {canvas_path} (Obsidian Canvas)")
print(f"  - {setup_path} (instructions)")
print(f"  - {hook_path} (git hook template)")