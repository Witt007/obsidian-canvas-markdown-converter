# Canvas Markdown Converter (Canvas 思维导图转换器)


一个 Obsidian 插件，提供 **Canvas 思维导图**与 **Markdown** 内容（剪贴板）之间的双向转换，并保留层级结构。

## 主要功能

- **Markdown 转思维导图**：将剪贴板中的 Markdown（标题、列表或纯文本）直接粘贴到 Canvas 中，生成水平布局的思维导图。
    - **层级支持**：自动解析 H1-H6 标题和嵌套列表，建立父子节点关系。
    - **思维导图布局**：节点从左向右水平排列，父节点相对于子节点自动垂直居中。
- **思维导图转 Markdown**：将选中的 Canvas 节点导出为 Markdown 层级结构。
    - **基于连线的层级**：根据节点间的连线（Edge）生成嵌套的 Markdown 列表或标题。
    - **内容提取**：使用第一行/段落作为标题，并保留节点内部的 Markdown 格式。
- **多语言支持**：根据 Obsidian 系统语言自动切换中英文界面。

## 使用方法

### 将 Markdown 粘贴为思维导图
1. 打开一个 **Canvas** 文件。
2. 复制具有层级结构的 Markdown 文本到剪贴板。
3. 在命令面板执行 `将剪贴板 Markdown 粘贴为思维导图`。
4. 插件将根据 Markdown 的缩进和标题级别生成水平思维导图。

### 将思维导图复制为 Markdown
1. 在 **Canvas** 中选中要导出的节点。
2. 在命令面板执行 `将 Canvas 思维导图导出为 Markdown`。
3. 节点间的层级结构（基于连线）将以 Markdown 标题和列表的形式复制到剪贴板。

## 安装方式

1. 将插件文件夹复制到库的 `.obsidian/plugins/` 目录下。
2. 在 **设置 -> 社区插件** 中启用 **Canvas Mindmap Converter**。

## 开发相关

```bash
npm install
npm run build    # 生成 main.js
npm run dev      # 监听源码变更并自动构建
```

## 致谢

本插件致力于让 Obsidian Canvas 中的脑暴过程与 Markdown 工作流无缝衔接。

# Canvas Markdown Converter


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
