(function () {
  const section = document.getElementById('comments');
  const form = document.getElementById('comment-form');
  if (!section || !form) return;

  const commentsList = document.getElementById('comments-list');
  const countEl = document.getElementById('comment-count');
  const messageEl = document.getElementById('comment-message');
  const articleId = section.dataset.articleId;

  // --- Helpers ---

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('he-IL', {
      timeZone: 'Asia/Jerusalem',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function buildCommentEl(comment) {
    const name =
      comment.author?.displayName ||
      comment.author?.username ||
      comment.guestName ||
      'אורח';
    const isoDate = comment.createdAt
      ? new Date(comment.createdAt).toISOString()
      : '';
    const dateStr = formatDate(comment.createdAt);

    const article = document.createElement('article');
    article.className = 'comment';
    article.id = `comment-${comment._id}`;
    article.innerHTML = `
      <p class="comment-meta">
        <strong>${escapeHtml(name)}</strong>
        ${isoDate ? ` · <time datetime="${isoDate}">${escapeHtml(dateStr)}</time>` : ''}
      </p>
      <p>${escapeHtml(comment.body)}</p>
    `;
    return article;
  }

  // --- Submit handler ---

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const bodyInput = form.querySelector('[name="body"]');
    const guestNameInput = form.querySelector('[name="guestName"]');

    const payload = { body: bodyInput.value.trim() };
    if (guestNameInput) payload.guestName = guestNameInput.value.trim();

    submitBtn.disabled = true;
    messageEl.textContent = 'שולח…';

    try {
      const response = await fetch(`/api/public/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      // Spam block — show clear message, do not throw
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        messageEl.textContent = data.error || 'שלחת יותר מדי תגובות. המתן דקה ונסה שוב.';
        return;
      }

      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        messageEl.textContent = data.error || 'תגובה לא תקינה. בדוק את השדות.';
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { comment } = await response.json();

      // Remove "be the first to comment" placeholder if present
      document.getElementById('no-comments-msg')?.remove();

      // Append the new comment and scroll it into view
      const commentEl = buildCommentEl(comment);
      if (commentsList) {
        commentsList.appendChild(commentEl);
        commentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Update visible count
      if (countEl) countEl.textContent = Number(countEl.textContent) + 1;

      // Reset form and confirm to the user
      form.reset();
      if (messageEl) messageEl.textContent = 'תגובתך נוספה בהצלחה!';
    } catch (err) {
      messageEl.textContent =
        err instanceof TypeError
          ? 'אין חיבור לשרת. נסה שוב.'
          : 'שגיאה בשליחת התגובה. נסה שוב.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}());
