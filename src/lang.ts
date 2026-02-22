import { moment } from "obsidian";

const en = {
    "command-paste-name": "Paste Markdown as Canvas Mindmap",
    "command-copy-name": "Copy Canvas Mindmap as Markdown",
    "setting-title": "Canvas Mindmap Converter Settings",
    "setting-separator-name": "Separator",
    "setting-separator-desc": "Separator to split clipboard content into multiple nodes. Supports \\n (newline), \\n\\n (double newline), \\t, etc. Example: \\n\\n or ---",
    "notice-open-canvas": "Please open a Canvas first.",
    "notice-not-canvas": "Current view is not a Canvas, please open a Canvas before running this command.",
    "notice-read-fail": "Unable to read clipboard, please check permissions.",
    "notice-empty-clipboard": "Clipboard is empty or contains only whitespace.",
    "notice-parse-fail": "Failed to parse valid hierarchical content from clipboard.",
    "notice-create-success": "Created {0} nodes and established {1} connections in Canvas.",
    "notice-create-fail": "Failed to create Canvas nodes, check console for details.",
    "notice-no-nodes": "Canvas has no nodes.",
    // Re-reading main.ts:
    // ... if (sel?.size) ... else { selectedIds = all } ... if (selectedIds.size === 0) return ...
    // So if canvas is not empty, selectedIds will have items (all).
    // The only case it hits size 0 is if canvas is empty? But lines 278 checks if nodes.length.
    // Actually, if filter excludes all (e.g. edge cases).
    // Let's just translate it.
    "notice-select-at-least-one": "Please select at least one node.",
    "notice-export-success": "Exported {0} nodes to Markdown and copied to clipboard.",
    "notice-copy-fail": "Failed to copy to clipboard, please check permissions."
};

const zh = {
    "command-paste-name": "将剪贴板 Markdown 粘贴为思维导图",
    "command-copy-name": "将 Canvas 思维导图导出为 Markdown",
    "setting-title": "Canvas 思维导图转换器设置",
    "setting-separator-name": "分隔符",
    "setting-separator-desc": "用于将剪贴板拆成多个节点的分隔符。支持 \\n（换行）、\\n\\n（双换行）、\\t 等。例如：\\n\\n 或 ---",
    "notice-open-canvas": "请先打开一个 Canvas。",
    "notice-not-canvas": "当前标签页不是 Canvas，请先打开一个 Canvas 再执行此命令。",
    "notice-read-fail": "无法读取剪贴板，请检查权限。",
    "notice-empty-clipboard": "剪贴板为空或只有空白。",
    "notice-parse-fail": "未能从剪贴板解析出有效的层级内容。",
    "notice-create-success": "已在 Canvas 中创建 {0} 个节点并建立了 {1} 条连接。",
    "notice-create-fail": "创建 Canvas 节点失败，详见控制台。",
    "notice-no-nodes": "当前画布没有节点。",
    "notice-select-at-least-one": "请先选中至少一个节点。",
    "notice-export-success": "已导出 {0} 个节点为 Markdown 并已复制到剪贴板。",
    "notice-copy-fail": "复制到剪贴板失败，请检查权限。"
};

type LangKey = keyof typeof en;

export function t(key: LangKey, ...args: any[]): string {
    const locale = moment.locale();
    const isZh = locale.startsWith("zh");
    const dict = isZh ? zh : en;
    let text = dict[key] || en[key] || key;

    if (args.length > 0) {
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
    }
    return text;
}
