// Auto-save for the reporter article form.
// The server copy is the source of truth, so work continues from any computer.
// A localStorage backup covers the moments when the server cannot be reached.

const SAVE_DELAY_MS = 1500;
const RETRY_DELAY_MS = 5000;
const FIELDS = ['title', 'summary', 'body', 'imageUrl', 'category'];

const form = document.querySelector('[data-autosave-form]');
if (form && !form.hasAttribute('data-locked')) initAutosave(form);

function initAutosave(form) {
  const saveStatus = form.querySelector('[data-save-status]');
  const formMessage = form.querySelector('[data-form-message]');
  const statusLabel = document.querySelector('[data-status-label]');
  const submitButton = form.querySelector('[data-submit-review]');
  const statusLabels = JSON.parse(form.dataset.statusLabels || '{}');

  let articleId = form.dataset.articleId || null;
  let serverUpdatedAt = form.dataset.updatedAt || null;
  let lastSaved = serialize(readContent());   // what the server currently holds
  let saveTimer = null;
  let saveQueue = Promise.resolve(true);      // saves run one after another, never in parallel

  function readContent() {
    const data = new FormData(form);
    return Object.fromEntries(FIELDS.map((field) => [field, data.get(field) ?? '']));
  }

  function serialize(content) {
    return JSON.stringify(content);
  }

  function hasUnsavedChanges() {
    return serialize(readContent()) !== lastSaved;
  }

  function setSaveStatus(text, state = '') {
    saveStatus.textContent = text;
    saveStatus.dataset.state = state;
  }

  function articleUrl() {
    return articleId ? `/api/reporter/articles/${articleId}` : '/api/reporter/articles';
  }

  // ---- Local backup ----
  function backupKey() {
    return `daily-web:article-backup:${articleId}`;
  }

  function writeBackup() {
    if (!articleId) return;
    try {
      localStorage.setItem(backupKey(), JSON.stringify({ content: readContent(), baseUpdatedAt: serverUpdatedAt }));
    } catch { /* storage may be full or blocked; the server save still runs */ }
  }

  function clearBackup() {
    if (!articleId) return;
    try { localStorage.removeItem(backupKey()); } catch { /* ignore */ }
  }

  // A backup is only trusted if the server copy did not change after it was written,
  // otherwise the newer server version (for example from another computer) wins.
  function restoreBackup() {
    if (!articleId) return;
    let backup = null;
    try { backup = JSON.parse(localStorage.getItem(backupKey())); } catch { /* ignore */ }
    if (!backup?.content) return;
    if (backup.baseUpdatedAt !== serverUpdatedAt || serialize(backup.content) === lastSaved) {
      clearBackup();
      return;
    }
    for (const field of FIELDS) {
      if (form.elements[field]) form.elements[field].value = backup.content[field] ?? '';
    }
    setSaveStatus('שוחזרו שינויים שלא נשמרו בפעם הקודמת. שומר…');
    scheduleSave(0);
  }

  // ---- Saving ----
  function applyServerArticle(article) {
    serverUpdatedAt = article.updatedAt;
    if (!articleId) {
      // The first save created the article: from now on the page edits it.
      articleId = article._id;
      form.action = articleUrl();
      history.replaceState(null, '', `/reporter/articles/${articleId}`);
    }
    if (statusLabel) statusLabel.textContent = statusLabels[article.status] || article.status;
    if (submitButton) submitButton.hidden = !['draft', 'changes_requested'].includes(article.status);
  }

  function scheduleSave(delay = SAVE_DELAY_MS) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, delay);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    saveQueue = saveQueue.then(performSave, performSave);
    return saveQueue;
  }

  async function performSave() {
    const content = readContent();
    const serialized = serialize(content);
    if (serialized === lastSaved) return true;
    // Do not create an empty article just because the page was opened.
    if (!articleId && FIELDS.every((field) => !content[field].trim())) return true;

    setSaveStatus('שומר…', 'saving');
    try {
      const response = await fetch(articleUrl(), {
        method: articleId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: serialized
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return handleSaveError(response.status, data);

      lastSaved = serialized;
      applyServerArticle(data.article);
      if (!hasUnsavedChanges()) clearBackup();
      formMessage.textContent = '';
      const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      setSaveStatus(`נשמר אוטומטית ב-${time}`, 'saved');
      return true;
    } catch {
      setSaveStatus('אין חיבור לשרת. השינויים שמורים בדפדפן וננסה שוב בעוד כמה שניות.', 'error');
      scheduleSave(RETRY_DELAY_MS);
      return false;
    }
  }

  function handleSaveError(status, data) {
    const messages = {
      400: data.details?.length ? `לא ניתן לשמור: ${data.details.join(', ')}` : 'לא ניתן לשמור: אחד השדות אינו תקין.',
      401: 'ההתחברות פגה. התחברו מחדש בלשונית אחרת; השינויים שמורים בדפדפן.',
      403: 'אין לך הרשאה לערוך כתבה זו.',
      404: 'הכתבה לא נמצאה. ייתכן שנמחקה.',
      409: 'הכתבה נשלחה לאישור עורך ולא ניתן לערוך אותה כעת. רעננו את העמוד.'
    };
    setSaveStatus('השמירה נכשלה', 'error');
    formMessage.textContent = messages[status] || 'שגיאת שרת. ננסה לשמור שוב בעוד כמה שניות.';
    // Server errors are usually temporary; client errors repeat until the input changes.
    if (status >= 500) scheduleSave(RETRY_DELAY_MS);
    return false;
  }

  // Sends the last changes while the page is closing. keepalive lets the request
  // finish after the tab is gone.
  function flushOnLeave() {
    if (!articleId || !hasUnsavedChanges()) return;
    writeBackup();
    fetch(articleUrl(), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: serialize(readContent()),
      keepalive: true
    }).catch(() => { /* the local backup is restored next time */ });
  }

  // ---- Submit for review ----
  async function submitForReview(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!window.confirm('לשלוח את הכתבה לאישור עורך? עד לתשובת העורך לא ניתן יהיה לערוך אותה.')) return;

    submitButton.disabled = true;
    formMessage.textContent = '';
    try {
      // Make sure the editor receives exactly what is on the screen.
      if (!(await saveNow()) || hasUnsavedChanges()) throw new Error('השמירה נכשלה, ולכן הכתבה לא נשלחה. נסו שוב.');
      const response = await fetch(`${articleUrl()}/submit`, {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(response.status === 400 && data.error ? data.error : 'השליחה לאישור נכשלה. רעננו את העמוד ונסו שוב.');
      }
      clearBackup();
      window.location.assign('/reporter');
    } catch (error) {
      formMessage.textContent = error instanceof TypeError ? 'אין חיבור לשרת. נסו שוב.' : error.message;
      submitButton.disabled = false;
    }
  }

  form.addEventListener('input', () => {
    writeBackup();
    setSaveStatus('יש שינויים שטרם נשמרו…', 'pending');
    scheduleSave();
  });
  form.addEventListener('submit', submitForReview);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnLeave();
  });
  window.addEventListener('pagehide', flushOnLeave);
  window.addEventListener('beforeunload', (event) => {
    // A new article without an id cannot be saved with keepalive safely, so ask first.
    if (!articleId && hasUnsavedChanges()) event.preventDefault();
  });

  restoreBackup();
}
