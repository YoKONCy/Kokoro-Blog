import type { APIRoute } from 'astro';
import { renderMarkdown } from '@/lib/markdown';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { markdown } = await request.json() as { markdown: string };
    if (typeof markdown !== 'string') {
      return Response.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const { html } = await renderMarkdown(markdown);

    return Response.json({ success: true, data: html });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
