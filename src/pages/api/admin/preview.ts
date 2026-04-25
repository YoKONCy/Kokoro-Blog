import type { APIRoute } from 'astro';
import { renderMarkdown } from '@/lib/markdown';
import { previewSchema, validateInput } from '@/lib/validation';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const data = validateInput(previewSchema, body);
    if (data instanceof Response) return data;

    const { html } = await renderMarkdown(data.markdown);

    return Response.json({ success: true, data: html });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

