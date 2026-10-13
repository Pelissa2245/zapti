#!/usr/bin/env node --max-old-space-size=8192
/**
 * graph-to-obsidian.mjs
 * Generates an Obsidian vault from graphify output.
 * Reads graph.json (clustered nodes + communities) and .graphify_extract.json (edges).
 * Idempotent: running twice produces the same result; removed nodes disappear.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const GRAPHIFY_OUT = path.join(PROJECT_ROOT, 'graphify-out');
const VAULT_DIR = path.join(PROJECT_ROOT, 'docs', 'vault');
const OBSIDIAN_DIR = path.join(VAULT_DIR, '.obsidian');

// Input files
const GRAPH_JSON = path.join(GRAPHIFY_OUT, 'graph.json');
const EXTRACT_JSON = path.join(GRAPHIFY_OUT, '.graphify_extract.json');
const LABELS_JSON = path.join(GRAPHIFY_OUT, '.graphify_labels.json');

// Output files
const GRAPH_VIEW_JSON = path.join(OBSIDIAN_DIR, 'graph.json');
const CANVAS_FILE = path.join(VAULT_DIR, 'graph.canvas');
const MANIFEST_FILE = path.join(GRAPHIFY_OUT, '.graphify_obsidian_manifest.json');

/** Sanitize filename for Windows */
function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Generate stable note filename from node */
function nodeFilename(node) {
  const base = sanitizeFilename(node.id);
  // Use label as suffix for readability if different from id
  // Strip .md extension from label if present (it's added when writing the file)
  const rawLabel = node.label || node.id;
  const label = sanitizeFilename(rawLabel.replace(/\.md$/i, ''));
  if (label !== base && label.length > 0) {
    return `${base}-${label}`.substring(0, 200);
  }
  return base.substring(0, 200);
}

/** Build wikilink target from node */
function wikilinkTarget(node) {
  return nodeFilename(node);
}

/** Load JSON with error handling */
function loadJson(filepath, defaultValue = null) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    if (defaultValue !== null) return defaultValue;
    throw new Error(`Failed to load ${filepath}: ${e.message}`);
  }
}

/** Load community labels */
function loadLabels() {
  const labels = loadJson(LABELS_JSON, {});
  // Normalize: keys are community IDs as strings, values are names
  const normalized = {};
  for (const [k, v] of Object.entries(labels)) {
    normalized[parseInt(k, 10)] = v;
  }
  return normalized;
}

/** Build community name map from graph nodes (fallback) */
function buildCommunityNames(graphNodes) {
  const map = {};
  for (const node of graphNodes) {
    if (node.community !== undefined && node.community_name) {
      map[node.community] = node.community_name;
    }
  }
  return map;
}

/** Merge labels from LLM and graph */
function getCommunityNames(graphNodes) {
  const llmLabels = loadLabels();
  const graphNames = buildCommunityNames(graphNodes);
  const merged = { ...graphNames };
  for (const [id, name] of Object.entries(llmLabels)) {
    merged[id] = name;
  }
  return merged;
}

/** Filter out legacy communities that shouldn't generate notes */
function filterLegacyCommunities(communityNames) {
  const filtered = { ...communityNames };
  // Remove "Vault Index & Navigation" - legacy community from old format
  delete filtered[27];
  return filtered;
}

/** Build edge index from extract graph */
function buildEdgeIndex(extractData) {
  const outEdges = new Map(); // source -> [{target, relation, confidence, ...}]
  const inEdges = new Map();  // target -> [{source, relation, confidence, ...}]

  for (const edge of extractData.edges || []) {
    const { source, target, relation, confidence, source_file, source_location, weight } = edge;
    if (!outEdges.has(source)) outEdges.set(source, []);
    if (!inEdges.has(target)) inEdges.set(target, []);
    outEdges.get(source).push({ target, relation, confidence, source_file, source_location, weight });
    inEdges.get(target).push({ source, relation, confidence, source_file, source_location, weight });
  }
  return { outEdges, inEdges };
}

/** Generate frontmatter for a node note */
function generateFrontmatter(node, communityNames) {
  const communityId = node.community;
  const communityName = communityNames[communityId] || `Community ${communityId}`;
  const tags = ['graphify/code'];
  if (node.file_type) tags.push(`graphify/${node.file_type}`);
  tags.push(`community/${communityName.replace(/[^a-zA-Z0-9]/g, '_')}`);

  const aliases = [node.label].filter(Boolean);

  return {
    tipo: node.file_type || 'concept',
    caminho: node.source_file || '',
    comunidade: communityName,
    community_id: communityId,
    tags,
    aliases: [...new Set(aliases)],
    source_location: node.source_location || '',
    graphify_node_id: node.id
  };
}

/** Format frontmatter as YAML string */
function formatFrontmatter(fm) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const v of value) {
        lines.push(`  - ${JSON.stringify(v)}`);
      }
    } else if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/** Generate node note content */
function generateNodeNote(node, communityNames, edgeIndex, nodeMap) {
  const fm = generateFrontmatter(node, communityNames);
  const frontmatter = formatFrontmatter(fm);

  const lines = [frontmatter, '', `# ${node.label || node.id}`, ''];

  // Description from available data
  if (node.source_file) {
    lines.push(`**Arquivo:** \`${node.source_file}\`${node.source_location ? ` (${node.source_location})` : ''}`);
  }
  if (communityNames[node.community]) {
    lines.push(`**Comunidade:** [[_COMMUNITY_${sanitizeFilename(communityNames[node.community])}]]`);
  }
  lines.push('');

  // Outgoing edges (Depende de)
  const out = edgeIndex.outEdges.get(node.id) || [];
  if (out.length > 0) {
    lines.push('## Depende de');
    for (const e of out) {
      const targetNode = nodeMap.get(e.target);
      if (targetNode) {
        const rel = e.relation ? ` — ${e.relation}` : '';
        const conf = e.confidence && e.confidence !== 'EXTRACTED' ? ` [${e.confidence}]` : '';
        lines.push(`- [[${wikilinkTarget(targetNode)}]]${rel}${conf}`);
      }
    }
    lines.push('');
  }

  // Incoming edges (Usado por)
  const inn = edgeIndex.inEdges.get(node.id) || [];
  if (inn.length > 0) {
    lines.push('## Usado por');
    for (const e of inn) {
      const sourceNode = nodeMap.get(e.source);
      if (sourceNode) {
        const rel = e.relation ? ` — ${e.relation}` : '';
        const conf = e.confidence && e.confidence !== 'EXTRACTED' ? ` [${e.confidence}]` : '';
        lines.push(`- [[${wikilinkTarget(sourceNode)}]]${rel}${conf}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Generate community hub note */
function generateCommunityNote(communityId, communityName, memberNodes, communityNames) {
  const safeName = sanitizeFilename(communityName);
  const filename = `_COMMUNITY_${safeName}.md`;

  const fm = {
    tipo: 'community',
    comunidade: communityName,
    community_id: communityId,
    cohesion: 0, // Could be computed if available
    members: memberNodes.length,
    tags: ['graphify/community', `community/${safeName}`]
  };

  const lines = [
    formatFrontmatter(fm),
    '',
    `# ${communityName}`,
    '',
    `**Cohesion:** ${fm.cohesion} - loosely connected`,
    `**Members:** ${memberNodes.length} nodes`,
    '',
    '## Members'
  ];

  // Sort by label
  const sorted = [...memberNodes].sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id));
  for (const node of sorted) {
    const type = node.file_type || 'concept';
    lines.push(`- [[${wikilinkTarget(node)}]] - ${type} - ${node.source_file || ''}`);
  }
  lines.push('');

  return { filename, content: lines.join('\n') };
}

/** Generate layer hub notes (API, Web, Shared, Prisma/Database) */
function generateLayerNotes(nodeMap, communityNames) {
  const layers = {
    'API': [],
    'Web': [],
    'Shared': [],
    'Database': []
  };

  for (const node of nodeMap.values()) {
    const file = node.source_file || '';
    if (file.startsWith('apps/api/')) layers.API.push(node);
    else if (file.startsWith('apps/web/')) layers.Web.push(node);
    else if (file.startsWith('packages/shared/')) layers.Shared.push(node);
    else if (file.startsWith('packages/database/')) layers.Database.push(node);
  }

  const notes = [];
  for (const [layerName, nodes] of Object.entries(layers)) {
    if (nodes.length === 0) continue;
    const safeName = sanitizeFilename(layerName);
    const filename = `_LAYER_${safeName}.md`;

    const fm = {
      tipo: 'layer',
      layer: layerName,
      tags: ['graphify/layer', `layer/${safeName}`]
    };

    const lines = [
      formatFrontmatter(fm),
      '',
      `# Camada: ${layerName}`,
      '',
      `**Nodes:** ${nodes.length}`,
      '',
      '## Nodes'
    ];

    const sorted = [...nodes].sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id));
    for (const node of sorted) {
      const commName = communityNames[node.community] || `Community ${node.community}`;
      lines.push(`- [[${wikilinkTarget(node)}]] (${commName})`);
    }
    lines.push('');

    notes.push({ filename, content: lines.join('\n') });
  }
  return notes;
}

/** Generate Pontos centrais (god nodes + surprising connections) */
function generatePontosCentraisNote(graphData, nodeMap, communityNames) {
  // Calculate edge counts to find god nodes
  const edgeCount = {};
  for (const link of graphData.links) {
    edgeCount[link.source] = (edgeCount[link.source] || 0) + 1;
    edgeCount[link.target] = (edgeCount[link.target] || 0) + 1;
  }

  // Get top 15 god nodes
  const sortedNodes = Object.entries(edgeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Find surprising connections: cross-community edges
  const crossCommunityEdges = [];
  for (const link of graphData.links) {
    const sourceNode = nodeMap.get(link.source);
    const targetNode = nodeMap.get(link.target);
    if (sourceNode && targetNode && sourceNode.community !== targetNode.community) {
      crossCommunityEdges.push({
        source: link.source,
        target: link.target,
        relation: link.relation,
        sourceNode,
        targetNode
      });
    }
  }

  // Sort by edge weight/importance
  crossCommunityEdges.sort((a, b) => (b.targetNode.edges?.length || 1) - (a.targetNode.edges?.length || 1));
  const topCrossCommunity = crossCommunityEdges.slice(0, 20);

  // Helper to convert node ID to vault filename using same logic as nodeFilename
  const toVaultLink = (id) => {
    const node = nodeMap.get(id);
    if (node) {
      return nodeFilename(node) + '.md';
    }
    // Fallback for nodes not in map (like concept nodes)
    return id.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.md';
  };

  const lines = [
    formatFrontmatter({
      tipo: 'hub',
      tags: ['graphify/pontos-centrais', 'hub']
    }),
    '',
    '# Pontos Centrais do Grafo ZapTI',
    '',
    '> Nos mais conectados ("god nodes") e conexoes surpreendentes entre comunidades.',
    '',
    '## God Nodes (Nos Mais Conectados)',
    ''
  ];

  for (const [id, count] of sortedNodes) {
    const node = nodeMap.get(id);
    if (node) {
      const commName = communityNames[node.community] || `Community ${node.community}`;
      const vaultLink = toVaultLink(id);
      lines.push(`- [[${vaultLink}]] -- **${count} edges** -- ${node.label || id} (\`${node.file_type || 'unknown'}\`) -- *Comunidade: ${commName}*`);
    }
  }

  lines.push('', '## Conexoes Surpreendentes (Cross-Community)', '');
  lines.push('*Arestas que conectam comunidades diferentes -- indicam acoplamento arquitetural:*', '');

  for (const edge of topCrossCommunity) {
    const sourceComm = communityNames[edge.sourceNode.community] || `Community ${edge.sourceNode.community}`;
    const targetComm = communityNames[edge.targetNode.community] || `Community ${edge.targetNode.community}`;
    const sourceLink = toVaultLink(edge.source);
    const targetLink = toVaultLink(edge.target);
    lines.push(`- [[${sourceLink}]] -> [[${targetLink}]] -- **${edge.relation || 'connects'}** -- *${sourceComm} -> ${targetComm}*`);
  }

  lines.push('', '---', '*Gerado automaticamente por `npm run graph:obsidian`*');

  return { filename: 'Pontos centrais.md', content: lines.join('\n') };
}

/** Generate index note */
function generateIndexNote(communityNames, layerNotes, communityNotes) {
  const lines = [
    formatFrontmatter({
      tipo: 'index',
      tags: ['graphify/index']
    }),
    '',
    '# Índice do Grafo ZapTI',
    '',
    '## Pontos Centrais',
    '- [[Pontos centrais]]',
    '',
    '## Comunidades'
  ];

  for (const [id, name] of Object.entries(communityNames).sort((a, b) => a[0] - b[0])) {
    const safeName = sanitizeFilename(name);
    lines.push(`- [[_COMMUNITY_${safeName}]]`);
  }

  lines.push('', '## Camadas');
  for (const layer of layerNotes) {
    lines.push(`- [[${layer.filename.replace('.md', '')}]]`);
  }

  lines.push('', '---', '*Gerado automaticamente por `npm run graph:obsidian`*');

  return { filename: '00-Indice.md', content: lines.join('\n') };
}

/** Generate graph view JSON with color groups */
function generateGraphViewJson(communityNames) {
  // Distinct colors for communities (HSV space)
  const colors = [
    0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFEAA7,
    0xDDA0DD, 0x98D8C8, 0xF7DC6F, 0xBB8FCE, 0x85C1E9,
    0xF8B500, 0x00CED1, 0xFF69B4, 0x32CD32, 0xFF8C00,
    0x8A2BE2, 0x00FA9A, 0xFF4500, 0x1E90FF, 0xFF1493,
    0x00BFFF, 0xADFF2F, 0xFFD700, 0xDC143C, 0x00FFFF,
    0x8A2BE2, 0x7FFF00, 0xFF6347, 0x40E0D0, 0xEE82EE,
    0xF0E68C, 0x98FB98, 0xAFEEEE, 0xD8BFD8, 0xF5DEB3,
    0xFFA07A, 0x20B2AA, 0x87CEEB, 0xFFA500, 0xDB7093,
    0x90EE90, 0xFFB6C1, 0x87CEFA, 0xDDA0DD, 0xF0E68C,
    0xE6E6FA, 0xFFF0F5, 0xF5F5DC
  ];

  const colorGroups = [];
  let colorIdx = 0;
  for (const [id, name] of Object.entries(communityNames).sort((a, b) => a[0] - b[0])) {
    const color = colors[colorIdx % colors.length];
    colorIdx++;
    colorGroups.push({
      query: `tag:#community/${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      color: { a: 1, rgb: color }
    });
  }

  return { colorGroups };
}

/** Generate canvas file - simplified to only community groups to save memory */
function generateCanvas(communityNames, nodeMap) {
  const nodes = [];
  const edges = [];

  // Group nodes by community for positioning
  const byCommunity = new Map();
  for (const node of nodeMap.values()) {
    const cid = node.community;
    if (!byCommunity.has(cid)) byCommunity.set(cid, []);
    byCommunity.get(cid).push(node);
  }

  // Create community groups only (no individual nodes to save memory)
  let groupX = 0;
  const GROUP_SPACING = 2600;

  for (const [cid, members] of byCommunity.entries()) {
    const communityName = communityNames[cid] || `Community ${cid}`;
    const groupId = `g${cid}`;

    // Community group node - size based on member count
    const size = Math.min(1000 + members.length * 2, 3000);
    nodes.push({
      id: groupId,
      type: 'group',
      label: `${communityName} (${members.length})`,
      x: groupX,
      y: 0,
      width: size,
      height: size,
      color: String((cid % 6) + 1)
    });

    groupX += GROUP_SPACING;
  }

  return { nodes, edges };
}

/** Main generation function */
async function main() {
  console.log('🔄 Loading graphify data...');

  const graphData = loadJson(GRAPH_JSON);
  const extractData = loadJson(EXTRACT_JSON);

  const graphNodes = graphData.nodes || [];
  const communityNames = getCommunityNames(graphNodes);

  // Filter out legacy communities
  const filteredCommunityNames = filterLegacyCommunities(communityNames);

  console.log(`📊 Graph: ${graphNodes.length} nodes, ${(extractData.edges || []).length} edges, ${Object.keys(filteredCommunityNames).length} communities (filtered from ${Object.keys(communityNames).length})`);

  // Build node map for quick lookup
  const nodeMap = new Map();
  for (const node of graphNodes) {
    nodeMap.set(node.id, node);
  }

  // Build edge index from extract data
  const edgeIndex = buildEdgeIndex(extractData);

  // Ensure vault directory exists
  fs.mkdirSync(VAULT_DIR, { recursive: true });
  fs.mkdirSync(OBSIDIAN_DIR, { recursive: true });

  // Track generated files for cleanup
  const generatedFiles = new Set();
  const manifest = { notes: {}, communities: {}, layers: [], index: '', canvas: 'graph.canvas', generatedAt: new Date().toISOString() };

  console.log('📝 Generating node notes...');
  let nodeCount = 0;
  for (const node of graphNodes) {
    const filename = `${wikilinkTarget(node)}.md`;
    const content = generateNodeNote(node, filteredCommunityNames, edgeIndex, nodeMap);
    const filepath = path.join(VAULT_DIR, filename);

    fs.writeFileSync(filepath, content, 'utf-8');
    generatedFiles.add(filename);
    manifest.notes[node.id] = filename;
    nodeCount++;
  }
  console.log(`   ${nodeCount} node notes created`);

  console.log('📚 Generating community hubs...');
  const byCommunity = new Map();
  for (const node of graphNodes) {
    const cid = node.community;
    // Skip legacy community 27
    if (cid === 27) continue;
    if (!byCommunity.has(cid)) byCommunity.set(cid, []);
    byCommunity.get(cid).push(node);
  }

  for (const [cid, members] of byCommunity.entries()) {
    const name = filteredCommunityNames[cid] || `Community ${cid}`;
    const { filename, content } = generateCommunityNote(cid, name, members, filteredCommunityNames);
    const filepath = path.join(VAULT_DIR, filename);
    fs.writeFileSync(filepath, content, 'utf-8');
    generatedFiles.add(filename);
    manifest.communities[cid] = { name, file: filename, memberCount: members.length };
  }
  console.log(`   ${byCommunity.size} community notes created`);

  console.log('🏗️ Generating layer hubs...');
  const layerNotes = generateLayerNotes(nodeMap, filteredCommunityNames);
  for (const note of layerNotes) {
    const filepath = path.join(VAULT_DIR, note.filename);
    fs.writeFileSync(filepath, note.content, 'utf-8');
    generatedFiles.add(note.filename);
    manifest.layers.push({ name: note.filename.replace('_LAYER_', '').replace('.md', ''), file: note.filename });
  }
  console.log(`   ${layerNotes.length} layer notes created`);

  console.log('🎯 Generating Pontos centrais...');
  const pontosCentraisNote = generatePontosCentraisNote(graphData, nodeMap, filteredCommunityNames);
  const pcPath = path.join(VAULT_DIR, pontosCentraisNote.filename);
  fs.writeFileSync(pcPath, pontosCentraisNote.content, 'utf-8');
  generatedFiles.add(pontosCentraisNote.filename);
  console.log(`   Pontos centrais created`);

  console.log('📋 Generating index...');
  const indexNote = generateIndexNote(filteredCommunityNames, layerNotes, manifest.communities);
  const indexPath = path.join(VAULT_DIR, indexNote.filename);
  fs.writeFileSync(indexPath, indexNote.content, 'utf-8');
  generatedFiles.add(indexNote.filename);
  manifest.index = indexNote.filename;
  console.log(`   Index created`);

  console.log('🎨 Generating graph view JSON...');
  const graphViewJson = generateGraphViewJson(filteredCommunityNames);
  fs.writeFileSync(GRAPH_VIEW_JSON, JSON.stringify(graphViewJson, null, 2), 'utf-8');
  console.log(`   ${graphViewJson.colorGroups.length} color groups`);

  console.log('🖼️ Generating canvas...');
  const canvas = generateCanvas(filteredCommunityNames, nodeMap);
  fs.writeFileSync(CANVAS_FILE, JSON.stringify(canvas, null, 2), 'utf-8');
  console.log(`   ${canvas.nodes.length} canvas nodes`);

  // Clean up orphaned notes (notes that exist but weren't generated this run)
  console.log('🧹 Cleaning up orphaned notes...');
  const existingNotes = fs.readdirSync(VAULT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('.'));

  // Keep original vault files (not graphify-generated)
  const protectedFiles = new Set([
    'Indice.md', 'Visao-Geral.md', 'Arquitetura.md', 'Tarefas.md',
    'Problemas-e-Solucoes.md', 'CLAUDE.md',
    'ADR ↔ Tarefas Mapping Table.md', 'Arquitetura Link.md',
    'Problemas Vinculados a TarefasADRs Table.md', 'Problemas-e-Solucoes Link.md',
    'Tarefas Link.md', 'Visao-Geral Link.md'
  ]);

  // Old-style generated files to delete (legacy format from previous runs)
  const legacyFiles = new Set([
    '_COMMUNITY_Vault-Index-&-Navigation.md',
    '_COMMUNITY_Vault Index & Navigation.md',  // community 27
    'docs_vault_indice_arquitetura_link-[[Arquitetura]]-Link.md',
    'docs_vault_indice_claude_link-[[CLAUDE]]-Link.md',
    'docs_vault_indice_problemas_link-[[Problemas-e-Solucoes]]-Link.md',
    'docs_vault_indice_tarefas_link-[[Tarefas]]-Link.md',
    'docs_vault_indice_visao_geral_link-[[Visao-Geral]]-Link.md',
    'docs_vault_indice_vault_index-Vault-Index-(Índice.md).md',
    'docs_vault_indice_adr_links-ADR-Links-(001-005).md'
  ]);

  let cleaned = 0;
  for (const note of existingNotes) {
    if (!generatedFiles.has(note) && !protectedFiles.has(note)) {
      // Check if it looks like a graphify note (has graphify frontmatter)
      const filepath = path.join(VAULT_DIR, note);
      const content = fs.readFileSync(filepath, 'utf-8');
      if (content.includes('graphify/') || content.startsWith('---\ntipo:')) {
        fs.unlinkSync(filepath);
        cleaned++;
      }
    }
  }

  // Also delete known legacy files
  for (const legacyFile of legacyFiles) {
    const filepath = path.join(VAULT_DIR, legacyFile);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      cleaned++;
    }
  }
  console.log(`   ${cleaned} orphaned notes removed`);

  // Save manifest
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

  // Re-read vault after cleanup for validation
  const allVaultNotes = fs.readdirSync(VAULT_DIR).filter(f => f.endsWith('.md'));
  const allVaultNoteFiles = new Set(allVaultNotes);

  // Filter generatedFiles to only those that still exist (after legacy cleanup)
  const generatedNoteFiles = Array.from(generatedFiles).filter(f => allVaultNoteFiles.has(f));

  // Validation - only check graphify-generated notes
  console.log('✅ Validating...');

  // Check all wikilinks in generated notes resolve to ANY vault note (generated or original)
  let brokenLinks = 0;
  let totalLinks = 0;
  for (const note of generatedNoteFiles) {
    const content = fs.readFileSync(path.join(VAULT_DIR, note), 'utf-8');
    const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
    for (const link of links) {
      totalLinks++;
      const target = link.slice(2, -2).split('|')[0]; // Handle [[target|alias]]
      // Don't add .md if target already ends with .md
      const targetFile = target.endsWith('.md') ? target : `${target}.md`;
      if (!allVaultNoteFiles.has(targetFile)) {
        console.warn(`   ⚠️ Broken link: ${note} -> ${target}`);
        brokenLinks++;
      }
    }
  }

  // Check for orphaned generated notes (no in/out links within generated set, except index)
  let orphans = 0;
  const linkedTo = new Set();
  for (const note of generatedNoteFiles) {
    const content = fs.readFileSync(path.join(VAULT_DIR, note), 'utf-8');
    const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
    for (const link of links) {
      const target = link.slice(2, -2).split('|')[0];
      linkedTo.add(`${target}.md`);
    }
  }

  for (const note of generatedNoteFiles) {
    if (note === '00-Indice.md') continue;
    if (!linkedTo.has(note)) {
      const content = fs.readFileSync(path.join(VAULT_DIR, note), 'utf-8');
      const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
      if (links.length === 0) {
        console.warn(`   ⚠️ Orphan note: ${note}`);
        orphans++;
      }
    }
  }

  console.log('');
  console.log('📊 Validation Results:');
  console.log(`   Total notes in vault: ${allVaultNotes.length}`);
  console.log(`   Graphify-generated notes: ${generatedFiles.size}`);
  console.log(`   Total wikilinks checked: ${totalLinks}`);
  console.log(`   Broken links: ${brokenLinks}`);
  console.log(`   Orphan notes: ${orphans}`);

  if (brokenLinks > 0 || orphans > 0) {
    console.log('❌ Validation failed');
    process.exit(1);
  }

  console.log('✅ All validations passed!');
  console.log(`📁 Vault: ${VAULT_DIR}`);
  console.log(`🎨 Graph view: ${GRAPH_VIEW_JSON}`);
  console.log(`🖼️ Canvas: ${CANVAS_FILE}`);
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  console.error(e.stack);
  process.exit(1);
});