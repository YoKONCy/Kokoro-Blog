/**
 * remark-callouts — 自定义 remark 插件
 * 将 Markdown 提示框语法转换为带有语义化 class 的 HTML 提示框
 *
 * 支持两种语法：
 *
 * 1. 容器指令语法（原有）：
 *    :::note
 *    这是一条普通提示信息。
 *    :::
 *
 *    :::tip[自定义标题]
 *    这是一条建议。
 *    :::
 *
 * 2. GitHub 风格 blockquote 语法（新增）：
 *    > [!NOTE]
 *    > 这是一条普通提示信息。
 *
 *    > [!TIP]
 *    > 这是一条建议。
 *
 *    > [!IMPORTANT]
 *    > 这是重要信息。
 *
 *    > [!WARNING]
 *    > 这是一条警告。
 *
 *    > [!CAUTION]
 *    > 这是危险操作。
 */
import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = ['note', 'tip', 'warning', 'caution', 'important'];

const DEFAULT_TITLES = {
  note: '📌 注意',
  tip: '💡 提示',
  important: '💎 重要',
  warning: '⚠️ 警告',
  caution: '🚨 危险',
};

/**
 * GitHub 类型映射到 CSS class 类型
 * important 复用 note 的紫色样式但标题不同
 */
const TYPE_TO_CLASS = {
  note: 'note',
  tip: 'tip',
  important: 'important',
  warning: 'warning',
  caution: 'caution',
};

export function remarkCallouts() {
  return (tree) => {
    visit(tree, (node) => {
      // ── 语法 1：容器指令 (:::xxx) ──
      if (node.type === 'containerDirective') {
        const type = node.name;
        if (!CALLOUT_TYPES.includes(type)) return;

        const customTitle = node.children?.[0]?.type === 'paragraph' &&
          node.children[0].data?.directiveLabel
          ? node.children[0].children?.map(c => c.value || '').join('')
          : null;

        const title = customTitle || DEFAULT_TITLES[type];
        const cssClass = TYPE_TO_CLASS[type] || type;

        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = {
          class: `callout callout-${cssClass}`,
        };

        node.children.unshift({
          type: 'paragraph',
          data: {
            hName: 'p',
            hProperties: { class: 'callout-title' },
          },
          children: [{ type: 'text', value: title }],
        });
        return;
      }

      // ── 语法 2：GitHub 风格 blockquote (> [!TYPE]) ──
      if (node.type === 'blockquote') {
        // 获取 blockquote 的第一个子节点（应该是 paragraph）
        const firstChild = node.children?.[0];
        if (!firstChild || firstChild.type !== 'paragraph') return;

        // 获取 paragraph 的第一个文本节点
        const firstText = firstChild.children?.[0];
        if (!firstText || firstText.type !== 'text') return;

        // 匹配 [!TYPE] 或 [!TYPE] 后跟换行/内容
        const match = firstText.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
        if (!match) return;

        const type = match[1].toLowerCase();
        const cssClass = TYPE_TO_CLASS[type] || type;
        const title = DEFAULT_TITLES[type] || match[1];

        // 将 blockquote 转换为 callout div
        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = {
          class: `callout callout-${cssClass}`,
        };

        // 移除 [!TYPE] 标记文本
        const remainingText = firstText.value.slice(match[0].length);

        // 构造标题节点
        const titleNode = {
          type: 'paragraph',
          data: {
            hName: 'p',
            hProperties: { class: 'callout-title' },
          },
          children: [{ type: 'text', value: title }],
        };

        if (remainingText.trim()) {
          // [!TYPE] 后面有内容在同一行，保留为段落的剩余部分
          firstText.value = remainingText;
          node.children.unshift(titleNode);
        } else {
          // [!TYPE] 独占一行
          if (firstChild.children.length === 1) {
            // paragraph 只有 [!TYPE]，直接替换为标题
            node.children[0] = titleNode;
          } else {
            // paragraph 有更多内容（[!TYPE]\n后续文字），移除 [!TYPE] 部分
            firstChild.children.shift();
            // 移除可能的前导换行
            if (firstChild.children[0]?.type === 'text') {
              firstChild.children[0].value = firstChild.children[0].value.replace(/^\n/, '');
            }
            node.children.unshift(titleNode);
          }
        }
      }
    });
  };
}
