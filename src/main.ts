import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { t } from "./lang";
import type {
	AllCanvasNodeData,
	CanvasData,
	CanvasEdgeData,
	CanvasTextData,
	CanvasFileData,
	CanvasLinkData,
	CanvasGroupData,
} from "obsidian/canvas";

const DEFAULT_SEPARATOR = "\\n\\n";
const NODE_WIDTH = 260;
const NODE_HEIGHT = 60;
const NODE_GAP_X = 100;
const NODE_GAP_Y = 40;
const START_X = 100;
const START_Y = 100;
const COLS = 3;

export interface FormatClipboardSettings {
	splitSeparator: string;
}

const DEFAULT_SETTINGS: FormatClipboardSettings = {
	splitSeparator: DEFAULT_SEPARATOR,
};

/** Canvas view type: active leaf view for canvas has .canvas with createTextNode/addNode */
type CanvasView = { getViewType: () => string; canvas: CanvasLike };
type CanvasLike = {
	getData(): CanvasData;
	createTextNode(opts: {
		text: string;
		pos: { x: number; y: number };
		size: { width: number; height: number };
		save: boolean;
		focus: boolean;
	}): CanvasNodeLike;
	addNode(node: CanvasNodeLike): void;
	addEdge(edge: any): void;
	setData(data: CanvasData): void;
	importData(data: CanvasData): void;
	requestSave?: (flag?: boolean) => void;
	/** Set of selected canvas elements (nodes and edges). Obsidian runtime API. */
	selection?: Set<{ id: string; getData(): unknown }>;
};
type CanvasNodeLike = { id: string; attach?: () => void; render?: () => void };
type CanvasEdgeLike = { id: string; attach?: () => void; render?: () => void };

interface HierarchicalNode {
	text: string;
	level: number;
	children: HierarchicalNode[];
	id?: string;
	nodeObj?: CanvasNodeLike;
	x: number;
	y: number;
}

export default class CanvasMindmapConverterPlugin extends Plugin {
	settings: FormatClipboardSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: "paste-clipboard-as-nodes",
			name: t("command-paste-name"),
			callback: () => this.pasteClipboardAsNodes(),
		});
		this.addCommand({
			id: "copy-selected-canvas-nodes-as-markdown",
			name: t("command-copy-name"),
			callback: () => this.copySelectedCanvasNodesAsMarkdown(),
		});
		this.addSettingTab(new CanvasMindmapConverterSettingTab(this.app, this));
	}

	onunload() { }

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** Resolve separator: "\\n\\n" -> "\n\n", "\\n" -> "\n", etc. */
	resolveSeparator(raw: string): string {
		if (!raw || raw === DEFAULT_SEPARATOR) return "\n\n";
		return raw
			.replace(/\\n/g, "\n")
			.replace(/\\t/g, "\t")
			.replace(/\\r/g, "\r");
	}

	async pasteClipboardAsNodes() {
		const leaf = this.app.workspace.getLeaf(false);
		if (!leaf?.view) {
			this.showNotice(t("notice-open-canvas"));
			return;
		}
		const v = leaf.view as unknown as CanvasView;
		if (v.getViewType?.() !== "canvas" || !v.canvas) {
			this.showNotice(t("notice-not-canvas"));
			return;
		}

		let text: string;
		try {
			text = await navigator.clipboard.readText();
		} catch (e) {
			this.showNotice(t("notice-read-fail"));
			return;
		}
		if (!text?.trim()) {
			this.showNotice(t("notice-empty-clipboard"));
			return;
		}

		const roots = this.parseMarkdownToHierarchy(text);
		if (roots.length === 0) {
			this.showNotice(t("notice-parse-fail"));
			return;
		}

		const canvas = v.canvas as CanvasLike;
		this.calculateLayout(roots, START_X, START_Y);

		const newNodes: AllCanvasNodeData[] = [];
		const newEdges: CanvasEdgeData[] = [];

		const generateId = () => Math.random().toString(16).slice(2, 10);

		const processHierarchy = (nodes: HierarchicalNode[], parentId: string | null) => {
			for (const hNode of nodes) {
				const nodeId = generateId();
				hNode.id = nodeId;

				newNodes.push({
					id: nodeId,
					type: "text",
					text: hNode.text,
					x: hNode.x,
					y: hNode.y,
					width: NODE_WIDTH,
					height: NODE_HEIGHT,
				} as CanvasTextData);

				if (parentId) {
					newEdges.push({
						id: generateId(),
						fromNode: parentId,
						fromSide: "right",
						toNode: nodeId,
						toSide: "left",
					});
				}

				processHierarchy(hNode.children, nodeId);
			}
		};

		processHierarchy(roots, null);

		try {
			// 使用 importData (如果可用)，否则回退到 setData
			if (typeof canvas.importData === "function") {
				canvas.importData({ nodes: newNodes, edges: newEdges });
			} else {
				const data = canvas.getData();
				canvas.setData({
					nodes: [...data.nodes, ...newNodes],
					edges: [...data.edges, ...newEdges],
				});
			}
			this.showNotice(t("notice-create-success", String(newNodes.length), String(newEdges.length)));
		} catch (e) {
			console.error("Failed to import canvas data:", e);
			this.showNotice(t("notice-create-fail"));
		}
	}

	/** 解析 Markdown 层级（标题 H1-H6 及无序列表） */
	parseMarkdownToHierarchy(text: string): HierarchicalNode[] {
		// 按标题或列表项分割，将随后的普通文本合并到该标题/列表项节点中
		const chunks = text.split(/\r?\n(?=#{1,6}\s+|(?:\s*[-*+]|\s*\d+\.)\s+)/);
		const roots: HierarchicalNode[] = [];
		const stack: { node: HierarchicalNode; level: number }[] = [];

		for (const chunk of chunks) {
			const trimmedChunk = chunk.trim();
			if (!trimmedChunk) continue;

			// 第一行决定层级和类型
			const firstLineEnd = chunk.indexOf("\n");
			const firstLine = firstLineEnd === -1 ? chunk : chunk.slice(0, firstLineEnd);
			const firstLineTrimmed = firstLine.trim();

			let level = 0;
			let content = trimmedChunk;

			const headerMatch = firstLineTrimmed.match(/^(#{1,6})\s+(.*)$/);
			if (headerMatch) {
				level = headerMatch[1].length;
				// 提取标题内容并保留块内后续文本
				const restOfChunk = firstLineEnd === -1 ? "" : chunk.slice(firstLineEnd);
				content = headerMatch[2] + restOfChunk.trimEnd();
			} else {
				const listMatch = firstLine.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
				if (listMatch) {
					const indent = listMatch[1].contains('\t') ? listMatch[1].length * 4 : listMatch[1].length;
					level = 7 + Math.floor(indent / 4);
					const restOfChunk = firstLineEnd === -1 ? "" : chunk.slice(firstLineEnd);
					content = listMatch[3] + restOfChunk.trimEnd();
				} else {
					level = stack.length > 0 ? stack[stack.length - 1].level + 1 : 1;
					content = trimmedChunk;
				}
			}

			const newNode: HierarchicalNode = {
				text: content.trim(),
				level: level,
				children: [],
				x: 0,
				y: 0
			};

			while (stack.length > 0 && stack[stack.length - 1].level >= level) {
				stack.pop();
			}

			if (stack.length === 0) {
				roots.push(newNode);
			} else {
				stack[stack.length - 1].node.children.push(newNode);
			}
			stack.push({ node: newNode, level: level });
		}
		return roots;
	}

	/** Mind map layout (horizontal tree) */
	calculateLayout(nodes: HierarchicalNode[], startX: number, startY: number): number {
		let currentY = startY;
		for (const node of nodes) {
			node.x = startX;
			const totalHeightForChildren = node.children.length > 0
				? this.calculateLayout(node.children, startX + NODE_WIDTH + NODE_GAP_X, currentY)
				: NODE_HEIGHT;

			node.y = currentY + (totalHeightForChildren - NODE_HEIGHT) / 2;
			currentY += Math.max(NODE_HEIGHT, totalHeightForChildren) + NODE_GAP_Y;
		}
		return currentY - startY - NODE_GAP_Y;
	}

	/**
	 * 将当前 Canvas 中选中的节点按边的层级关系导出为 Markdown 并复制到剪贴板。
	 */
	async copySelectedCanvasNodesAsMarkdown() {
		const leaf = this.app.workspace.getLeaf(false); debugger;
		if (!leaf?.view) {
			this.showNotice("请先打开一个 Canvas。");
			return;
		}
		const v = leaf.view as unknown as CanvasView;

		if (v.getViewType?.() !== "canvas" || !v.canvas) {
			this.showNotice(t("notice-not-canvas")); // "请先打开一个 Canvas 并选中要导出的节点。" - reusing not-canvas generic message or creating new? The old message was slightly different "and select nodes".
			// Let's use generic one or create specific if needed. The original English key for notice-not-canvas says "Current view is not a Canvas...".
			// I'll stick to 'notice-not-canvas' for simplicity as the next check handles selection.
			return;
		}

		const canvas = v.canvas as CanvasLike;
		const data = canvas.getData();
		const { nodes, edges } = data;
		if (!nodes?.length) {
			this.showNotice(t("notice-no-nodes"));
			return;
		}

		const nodeMap = new Map<string, AllCanvasNodeData>();
		for (const n of nodes) nodeMap.set(n.id, n);

		let selectedIds: Set<string>;
		const sel = canvas.selection;
		if (sel?.size) {
			selectedIds = new Set<string>();
			for (const el of sel) {
				const d = el.getData() as Record<string, unknown>;
				if (d && !("fromNode" in d && "toNode" in d)) {
					selectedIds.add(el.id);
				}
			}
		} else {
			selectedIds = new Set(nodeMap.keys());
		}

		if (selectedIds.size === 0) {
			this.showNotice(t("notice-select-at-least-one"));
			return;
		}

		const selectedEdges = (edges ?? []).filter(
			(e: CanvasEdgeData) => selectedIds.has(e.fromNode) && selectedIds.has(e.toNode)
		);
		const childrenMap = new Map<string, string[]>();
		const hasIncoming = new Set<string>();
		for (const e of selectedEdges) {
			if (!childrenMap.has(e.fromNode)) childrenMap.set(e.fromNode, []);
			childrenMap.get(e.fromNode)!.push(e.toNode);
			hasIncoming.add(e.toNode);
		}

		const nodeData = (id: string) => nodeMap.get(id);
		const posSort = (a: string, b: string) => {
			const na = nodeData(a), nb = nodeData(b);
			if (!na || !nb) return 0;
			return na.y !== nb.y ? na.y - nb.y : na.x - nb.x;
		};

		const roots = [...selectedIds].filter((id) => !hasIncoming.has(id));
		roots.sort(posSort);

		const lines: string[] = [];
		const indentUnit = "    ";

		const visit = (id: string, level: number) => {
			const node = nodeMap.get(id);
			if (!node) return;
			const text = this.getCanvasNodeDisplayText(node);
			const { title, rest } = this.getFirstParagraphAndRest(text);

			if (title) {
				if (level <= 6) {
					lines.push("#".repeat(level) + " " + title);
				} else {
					lines.push(indentUnit.repeat(level - 7) + "- " + title);
				}
			}

			if (rest.trim()) {
				// Body content items start at level + 1 conceptually
				const subLines = this.parseMarkdownToBullets(rest, level - 7);
				lines.push(...subLines);
			}

			const children = childrenMap.get(id) ?? [];
			children.sort(posSort);

			for (const cid of children) {
				visit(cid, level + 1);
			}
		};

		for (const id of roots) {
			visit(id, 1);
		}

		const markdown = lines.join("\n");
		try {
			await navigator.clipboard.writeText(markdown);
			this.showNotice(t("notice-export-success", String(selectedIds.size)));
		} catch (e) {
			this.showNotice(t("notice-copy-fail"));
		}
	}


	/** 将文本拆成「第一个段落」和「其余内容」。第一个段落为第一个非空行或到第一个换行前的块。 */
	getFirstParagraphAndRest(text: string): { title: string; rest: string } {
		if (!text?.trim()) return { title: "", rest: "" };
		const trimmed = text.trim();
		let title = "";
		let rest = "";

		const firstLineEnd = trimmed.indexOf("\n");
		if (firstLineEnd >= 0) {
			title = trimmed.slice(0, firstLineEnd).trim();
			rest = trimmed.slice(firstLineEnd + 1).trim();
		} else {
			title = trimmed;
			rest = "";
		}

		// Strip leading markdown symbols from title since we will assign a new level
		title = title.replace(/^(#{1,6})\s+/, "");
		title = title.replace(/^([-*+]|\d+\.)\s+/, "");

		return { title, rest };
	}


	/**
	 * 将内容中的标题、有序列表、无序列表统一转为无序列表，缩进符合原层级结构（在原层级上增加一级）。
	 */
	parseMarkdownToBullets(text: string, baseLevel: number): string[] {
		const lines = text.split(/\r?\n/);
		const result: string[] = [];
		const indentUnit = "    ";
		let lastLevel = -1, level = 0;
		let isHeaderCaptured = false; // make sure the first line is a header

		if (baseLevel < 0) baseLevel = 0;

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine) continue;

			// Match headers: # Title, ## Title, etc.
			const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
			if (headerMatch) {
				const headerLevel = headerMatch[1].length; // 1-6
				const content = headerMatch[2].trim();
				// H1 and H2 -> indent 0, H3 -> indent 1, etc.
				const relativeLevel = Math.max(0, headerLevel);
				if (relativeLevel - lastLevel == 1) { // represents the current level is deeper than the last level
					++level
				} else {
					level = 0;
				}
				lastLevel = relativeLevel

				const str = (indentUnit.repeat(level + baseLevel) + "- " + content);
				result.push(str);
				!isHeaderCaptured && (isHeaderCaptured = true)
				continue;
			}

			// Match lists: - Item, 1. Item, etc.
			const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
			if (listMatch) { // represents the current list is under a title
				const indentStr = listMatch[1];
				const content = listMatch[3].trim();
				// Extra level for list items to distinguish from title
				const extraLevel = Math.floor(indentStr.length / 4);
				const targetLevel = baseLevel + level + extraLevel;
				const str = (indentUnit.repeat(isHeaderCaptured ? targetLevel + 1 : targetLevel) + "- " + content);
				result.push(str);
				continue;
			}

			// Plain text or other content: treat as level 1 relative to body
			result.push("\n- " + trimmedLine);
		}
		return result;
	}


	getCanvasNodeDisplayText(node: AllCanvasNodeData): string {
		switch (node.type) {
			case "text":
				return (node as CanvasTextData).text?.trim() || "";
			case "file": {
				const f = node as CanvasFileData;
				return f.subpath ? `[[${f.file}${f.subpath}]]` : `[[${f.file}]]`;
			}
			case "link":
				return (node as CanvasLinkData).url ?? "";
			case "group":
				return (node as CanvasGroupData).label?.trim() || "Group";
			default:
				return (node as { text?: string }).text?.trim() ?? "";
		}
	}

	showNotice(msg: string) {
		new Notice(msg);
	}
}

class CanvasMindmapConverterSettingTab extends PluginSettingTab {
	plugin: CanvasMindmapConverterPlugin;

	constructor(app: App, plugin: CanvasMindmapConverterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: t("setting-title") });
		new Setting(containerEl)
			.setName(t("setting-separator-name"))
			.setDesc(
				t("setting-separator-desc")
			)
			.addText((t) =>
				t
					.setPlaceholder("\\n\\n")
					.setValue(this.plugin.settings.splitSeparator)
					.onChange(async (v) => {
						this.plugin.settings.splitSeparator = v || DEFAULT_SEPARATOR;
						await this.plugin.saveSettings();
					})
			);
	}
}
