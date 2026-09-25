(function () {
  const feed = document.getElementById('article-feed');
  const pagination = document.getElementById('feed-pagination');
  const filtersForm = document.getElementById('feed-filters');
  const totalDisplay = document.getElementById('feed-total');
  if (!feed) return;

  // JS is active — hide server-rendered pagination and take over with scroll
  if (pagination) pagination.hidden = true;

  const spinner = document.createElement('p');
  spinner.className = 'feed-spinner meta';
  spinner.textContent = 'טוען כתבות…';
  spinner.hidden = true;
  feed.after(spinner);

  const endMsg = document.createElement('p');
  endMsg.className = 'feed-end meta';
  endMsg.textContent = 'סיום — אין עוד כתבות להצגה.';
  endMsg.hidden = true;
  spinner.after(endMsg);

  // Sentinel: invisible element placed below the feed.
  // IntersectionObserver fires when it enters the viewport, triggering the next fetch.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  endMsg.after(sentinel);

  let loading = false;
  let abortController = null;

  // --- Helpers ---

  function getActiveFilters() {
    if (!filtersForm) return {};
    const params = {};
    for (const [key, value] of new FormData(filtersForm)) {
      if (value) params[key] = value;
    }
    return params;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function imageSource(value) {
    if (typeof value !== 'string' || !value) return '';
    return /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) ? value : '';
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('he-IL', {
      timeZone: 'Asia/Jerusalem',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function buildCard(article) {
    const content = article.published;
    if (!content) return null;

    const src = imageSource(content.imageUrl);
    const reporter =
      article.reporter?.displayName ||
      article.reporter?.username ||
      'מערכת האתר';
    const dateStr = formatDate(article.publishedAt);
    const isoDate = article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : '';

    const card = document.createElement('article');
    card.className = 'panel article-card';
    card.dataset.articleId = article._id;

    card.innerHTML = `
      ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(content.title)}" loading="lazy">` : ''}
      <div class="card-content">
        <p class="category">${escapeHtml(content.category)}</p>
        <h2><a href="/articles/${escapeHtml(article._id)}">${escapeHtml(content.title)}</a></h2>
        <p>${escapeHtml(content.summary)}</p>
        <p class="meta">
          ${escapeHtml(reporter)}
          ${isoDate ? ` · <time datetime="${isoDate}">${escapeHtml(dateStr)}</time>` : ''}
        </p>
        <a href="/articles/${escapeHtml(article._id)}"
           aria-label="לכתבה המלאה: ${escapeHtml(content.title)}">לכתבה המלאה ←</a>
      </div>
    `;
    return card;
  }

  // --- Core fetch ---

  async function loadNextPage() {
    if (loading || feed.dataset.hasMore !== 'true') return;
    loading = true;
    spinner.hidden = false;

    abortController = new AbortController();
    const nextPage = Number(feed.dataset.page) + 1;
    const params = new URLSearchParams({
      ...getActiveFilters(),
      page: nextPage,
      limit: 20,
    });

    try {
      const response = await fetch(`${feed.dataset.apiUrl}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: abortController.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { articles, hasMore, total } = await response.json();

      for (const article of articles) {
        const card = buildCard(article);
        if (card) feed.appendChild(card);
      }

      feed.dataset.page = nextPage;
      feed.dataset.hasMore = hasMore;

      // Update count only on first page (after a filter reset)
      if (totalDisplay && nextPage === 1) {
        totalDisplay.textContent = `${total} כתבות נמצאו`;
      }

      if (!hasMore) {
        observer.disconnect();
        if (nextPage === 1 && articles.length === 0) {
          // First page returned zero results — show "not found" instead of "end of feed"
          const noResults = document.createElement('p');
          noResults.className = 'panel';
          noResults.id = 'feed-no-results';
          noResults.textContent = 'לא נמצאו כתבות. נסו לשנות את החיפוש או לחזור מאוחר יותר.';
          feed.appendChild(noResults);
        } else {
          endMsg.hidden = false;
        }
      }

      loading = false;
      spinner.hidden = true;
    } catch (err) {
      // AbortError means applyFilters cancelled this request — state is already reset there
      if (err.name === 'AbortError') return;
      console.error('Feed fetch failed:', err);
      loading = false;
      spinner.hidden = true;
      if (pagination) pagination.hidden = false;
    }
  }

  // --- Filter logic ---

  function applyFilters() {
    // Cancel any in-flight request
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    // Sync URL so reload / share preserves the active filters
    const filterParams = new URLSearchParams(getActiveFilters());
    history.replaceState(null, '', filterParams.toString() ? `/?${filterParams}` : '/');

    // Reset feed state for a fresh first-page load
    observer.disconnect();
    loading = false;
    spinner.hidden = true;
    feed.innerHTML = '';
    feed.dataset.page = '0';
    feed.dataset.hasMore = 'true';
    endMsg.hidden = true;
    document.getElementById('feed-no-results')?.remove();

    loadNextPage();
    observer.observe(sentinel);
  }

  // --- IntersectionObserver ---

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadNextPage();
    },
    { rootMargin: '300px' }
  );

  // --- Filter form event listeners ---

  if (filtersForm) {
    // Intercept submit so it does not trigger a full-page reload
    filtersForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });

    const debouncedApply = debounce(applyFilters, 400);

    // Live search as user types (debounced)
    filtersForm.querySelector('input[name="search"]')
      ?.addEventListener('input', debouncedApply);

    // Live category filter as user types (debounced)
    filtersForm.querySelector('input[name="category"]')
      ?.addEventListener('input', debouncedApply);

    // Sort select — apply immediately on change, no debounce needed
    filtersForm.querySelector('select[name="sort"]')
      ?.addEventListener('change', applyFilters);
  }

  // --- Initial setup ---

  if (feed.dataset.hasMore === 'true') {
    observer.observe(sentinel);
  } else {
    endMsg.hidden = false;
  }
}());
