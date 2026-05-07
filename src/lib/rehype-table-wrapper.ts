/**
 * rehype-table-wrapper
 *
 * 轻量 rehype 插件：自动将 <table> 包裹在 <div class="table-wrapper"> 中，
 * 为宽表格提供响应式横向滚动能力，配合 prose.css 中的 .table-wrapper 样式使用。
 */
import { visit } from 'unist-util-visit';

export function rehypeTableWrapper() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (
        node.tagName === 'table' &&
        parent &&
        typeof index === 'number' &&
        // 避免重复包裹
        !(parent.tagName === 'div' && parent.properties?.className?.includes('table-wrapper'))
      ) {
        const wrapper = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrapper'] },
          children: [node],
        };
        parent.children[index] = wrapper;
      }
    });
  };
}
