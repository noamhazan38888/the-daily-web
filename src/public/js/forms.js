document.querySelectorAll('[data-api-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) return;
    let body = Object.fromEntries(new FormData(form));
    if (form.hasAttribute('data-editor-draft')) {
      const { reviewNote, ...draft } = body;
      body = { draft, reviewNote };
    }
    button.disabled = true;
    message.textContent = 'שומר…';
    try {
      const response = await fetch(form.action, {
        method: form.dataset.method || 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const messages = {
          401: 'ההתחברות פגה. יש להתחבר מחדש לפני השמירה.',
          403: 'אין לך הרשאה לבצע פעולה זו.',
          404: 'הכתבה לא נמצאה או שהפעולה אינה זמינה במצב הנוכחי.',
          409: 'הכתבה אינה מוכנה לפרסום במצב הנוכחי.'
        };
        throw new Error(messages[response.status] || 'הפעולה נכשלה. בדקו את השדות ונסו שוב.');
      }
      window.location.assign(form.dataset.redirect);
    } catch (error) {
      message.textContent = error instanceof TypeError ? 'אין חיבור לשרת. התוכן נשמר בטופס; נסו שוב.' : error.message;
      button.disabled = false;
    }
  });
});
