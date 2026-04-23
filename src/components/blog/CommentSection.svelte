<script lang="ts">
  /**
   * CommentSection — 评论区组件
   */
  import { onMount } from 'svelte';

  interface Comment {
    id: string;
    author: string;
    content: string;
    parent_id: string | null;
    created_at: string;
  }

  let { postSlug }: { postSlug: string } = $props();

  let comments = $state<Comment[]>([]);
  let commentCount = $state(0);
  let loading = $state(true);
  let submitting = $state(false);
  let submitted = $state(false);
  let error = $state('');

  let author = $state('');
  let email = $state('');
  let content = $state('');

  onMount(async () => {
    try {
      const res = await fetch(`/api/comments/${postSlug}`);
      const json = await res.json();
      if (json.success) {
        comments = json.data.comments;
        commentCount = json.data.count;
      }
    } catch {
      // 本地开发无 D1 时静默失败
    } finally {
      loading = false;
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch(`/api/comments/${postSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: author.trim(), email: email.trim(), content: content.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        submitted = true;
        author = ''; email = ''; content = '';
      } else {
        error = json.error || '提交失败';
      }
    } catch {
      error = '网络错误，请稍后重试';
    } finally {
      submitting = false;
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
</script>

<section class="cs-section" id="comments">
  <h3 class="cs-heading">💬 评论 {commentCount > 0 ? `(${commentCount})` : ''}</h3>

  {#if loading}
    <div class="cs-loading">
      <span class="cs-dot"></span><span class="cs-dot"></span><span class="cs-dot"></span>
    </div>
  {:else if comments.length > 0}
    <div class="cs-list">
      {#each comments as c (c.id)}
        <div class="cs-item">
          <div class="cs-avatar">{c.author.charAt(0).toUpperCase()}</div>
          <div class="cs-body">
            <div class="cs-meta">
              <span class="cs-author">{c.author}</span>
              <time class="cs-time">{formatTime(c.created_at)}</time>
            </div>
            <p class="cs-text">{c.content}</p>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="cs-empty">还没有评论，来抢沙发吧 ✨</p>
  {/if}

  {#if submitted}
    <div class="cs-success">✅ 评论已提交，审核通过后将显示。感谢你的留言！</div>
  {:else}
    <form class="cs-form" onsubmit={handleSubmit}>
      <div class="cs-form-row">
        <input type="text" placeholder="你的名字 *" bind:value={author} required maxlength="50" class="cs-input" />
        <input type="email" placeholder="邮箱（可选）" bind:value={email} class="cs-input" />
      </div>
      <textarea placeholder="说点什么吧..." bind:value={content} required maxlength="2000" rows="4" class="cs-textarea"></textarea>
      {#if error}
        <p class="cs-error">{error}</p>
      {/if}
      <button type="submit" class="cs-submit" disabled={submitting || !author.trim() || !content.trim()}>
        {submitting ? '提交中...' : '发表评论'}
      </button>
    </form>
  {/if}
</section>
