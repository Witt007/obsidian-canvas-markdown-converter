# Canvas Mindmap Converter

[English](./README.md) | [简体中文](./README_zh.md)

An Obsidian plugin that provides bi-directional conversion between **Canvas Mindmaps** and **Markdown** content (clipboard), preserving hierarchical structures.

## Key Features

- **Markdown to Mindmap**: Paste Markdown from your clipboard (headings, lists, or plain text) directly into a Canvas as a horizontal mindmap.
    - **Hierarchy Support**: Automatically parses H1-H6 headings and nested lists to create parent-child relationships.
    - **Mind Map Layout**: Arranges nodes horizontally (left-to-right) with automatic vertical centering for parents.
- **Mindmap to Markdown**: Export selected Canvas nodes to a Markdown hierarchy.
    - **Edge-based Hierarchy**: Follows the connections (edges) between nodes to generate nested Markdown lists or headings.
    - **Content Extraction**: Uses the first line/paragraph as the title and respects internal Markdown formatting.
- **Localization**: Full support for English and Chinese based on Obsidian's system language.

## Usage

### Paste Markdown as Mindmap
1. Open a **Canvas** file.
2. Copy hierarchical Markdown text to your clipboard.
3. Use the command `Paste Markdown as Canvas Mindmap` (via Command Palette).
4. The plugin will generate a horizontal mindmap structure based on your Markdown indentation and heading levels.

### Copy Mindmap as Markdown
1. Select the nodes in your **Canvas** that you want to export.
2. Use the command `Copy Canvas Mindmap as Markdown`.
3. The hierarchical structure (based on edges) will be copied to your clipboard as Markdown headings and lists.

## Installation

1. Copy the plugin folder to your vault's `.obsidian/plugins/` directory.
2. Enable **Canvas Mindmap Converter** in **Settings -> Community Plugins**.

## Development

```bash
npm install
npm run build    # Generate main.js
npm run dev      # Watch for changes and auto-build
```

## Credits

This plugin is dedicated to making brain-storming in Obsidian Canvas more seamless with Markdown workflows.
