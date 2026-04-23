/**
 * remark-callouts — 自定义 remark 插件
 * 将 Markdown 容器指令 (:::note, :::tip, :::warning, :::caution)
 * 转换为带有语义化 class 的 HTML 提示框
 *
 * 用法示例（在 .md / .mdx 中）：
 *   :::note
 *   这是一条普通提示信息。
 *   :::
 *
 *   :::tip[自定义标题]
 *   这是一条建议。
 *   :::
 */
import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = ['note', 'tip', 'warning', 'caution'];

const DEFAULT_TITLES = {
  note: '📌 注意',
  tip: '💡 提示',
  warning: '⚠️ 警告',
  caution: '🚨 危险',
};

export function remarkCallouts() {
  return (tree) => {
    visit(tree, (node) => {
      // 只处理容器指令 (:::xxx)
      if (node.type !== 'containerDirective') return;

      const type = node.name;
      if (!CALLOUT_TYPES.includes(type)) return;

      // 获取自定义标题或使用默认标题
      const customTitle = node.children?.[0]?.type === 'paragraph' &&
        node.children[0].data?.directiveLabel
        ? node.children[0].children?.map(c => c.value || '').join('')
        : null;

      const title = customTitle || DEFAULT_TITLES[type];

      // 将节点转换为 HTML div
      const data = node.data || (node.data = {});
      data.hName = 'div';
      data.hProperties = {
        class: `callout callout-${type}`,
      };

      // 在子节点最前面插入标题元素
      node.children.unshift({
        type: 'paragraph',
        data: {
          hName: 'p',
          hProperties: { class: 'callout-title' },
        },
        children: [{ type: 'text', value: title }],
      });
    });
  };
}
