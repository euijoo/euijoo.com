function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch ' + path);
  return res.json();
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function renderHome(site, projects, journal) {
  document.getElementById('site-brand-text').textContent = site.brand;
  document.getElementById('footer-brand').textContent = site.brand;
  document.getElementById('footer-tagline').textContent = site.tagline;

  document.getElementById('hero-eyebrow').textContent = site.hero.eyebrow;
  document.getElementById('hero-title').textContent = site.hero.title;
  document.getElementById('hero-description').textContent = site.hero.description;

  document.getElementById('featured-section-title').textContent = site.featuredSection.title;
  document.getElementById('featured-section-description')?.remove();

  const featured = projects.find(p => p.featured) || projects[0];
  if (featured) {
    document.getElementById('featured-meta').textContent = [featured.type, featured.category, featured.location].filter(Boolean).join(' / ');
    document.getElementById('featured-title').textContent = featured.title;
    document.getElementById('featured-summary').textContent = featured.summary;
    const link = document.getElementById('featured-link');
    link.href = featured.url || 'project/index.html';

    const media = document.getElementById('featured-media');
    media.style.backgroundImage = `url('${featured.cover}')`;
  }

  const worksGrid = document.getElementById('works-grid');
  if (worksGrid) {
    worksGrid.innerHTML = projects.slice(0, 3).map(p => `
      <article class="archive-card">
        <div class="archive-thumb">
          <img src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.alt || p.title)}" width="900" height="1100" loading="lazy" />
        </div>
        <div class="home-featured-meta">${escapeHTML([p.type, p.category].filter(Boolean).join(' / '))}</div>
        <h3>${escapeHTML(p.title)}</h3>
        <p>${escapeHTML(p.summary)}</p>
      </article>
    `).join('');
  }

  const journalList = document.getElementById('journal-list');
  if (journalList) {
    journalList.innerHTML = journal.slice(0, 3).map(j => `
      <article class="journal-item">
        <div class="journal-date">${escapeHTML(j.dateLabel)}</div>
        <div>
          <h3>${escapeHTML(j.title)}</h3>
          <p>${escapeHTML(j.summary)}</p>
        </div>
        <div class="journal-type">${escapeHTML(j.type)}</div>
      </article>
    `).join('');
  }

  const contactLinks = document.getElementById('contact-links');
  if (contactLinks && site.contactPreview?.links) {
    contactLinks.innerHTML = site.contactPreview.links.map(link => {
      const external = link.href.startsWith('http');
      const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHTML(link.href)}"${target}>${escapeHTML(link.label)}</a>`;
    }).join('');
  }
}

function renderArchive(projects) {
  const grid = document.getElementById('archive-grid');
  if (!grid) return;
  grid.innerHTML = projects.map(p => `
    <article class="archive-card">
      <div class="archive-thumb">
        <img src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.alt || p.title)}" width="900" height="1100" loading="lazy" />
      </div>
      <div class="home-featured-meta">${escapeHTML([p.type, p.category, p.location].filter(Boolean).join(' / '))}</div>
      <h3>${escapeHTML(p.title)}</h3>
      <p>${escapeHTML(p.summary)}</p>
    </article>
  `).join('');
}

function renderJournalIndex(journal) {
  const list = document.getElementById('journal-index-list');
  if (!list) return;
  list.innerHTML = journal.map(j => `
    <article class="journal-item journal-index-entry">
      <div class="journal-date">${escapeHTML(j.dateLabel)}</div>
      <div>
        <div class="home-featured-meta">${escapeHTML([j.type, j.readingTime].filter(Boolean).join(' / '))}</div>
        <h3>${escapeHTML(j.title)}</h3>
        <p>${escapeHTML(j.summary)}</p>
      </div>
      <div class="journal-type">${escapeHTML(j.type)}</div>
    </article>
  `).join('');
}

function renderProjectDetail(projects) {
  const slug = getQueryParam('slug');
  const project = projects.find(p => p.slug === slug) || projects[0];
  if (!project) return;
  document.getElementById('project-title').textContent = project.title;
  document.getElementById('project-lede').textContent = project.summary;
  document.getElementById('project-meta-type').textContent = project.type;
  const hero = document.getElementById('project-hero-image');
  if (hero && project.heroImage) {
    hero.src = project.heroImage;
    hero.alt = project.alt || project.title;
  }
  const body = document.getElementById('project-body');
  if (body && project.body) {
    body.innerHTML = project.body.map(p => `<p>${escapeHTML(p)}</p>`).join('');
  }
}

function renderPostDetail(journal) {
  const slug = getQueryParam('slug');
  const post = journal.find(p => p.slug === slug) || journal[0];
  if (!post) return;
  document.getElementById('post-type').textContent = post.type;
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-deck').textContent = post.deck || post.summary;
  const body = document.getElementById('post-body');
  if (body && post.body) {
    body.innerHTML = post.body.map(p => `<p>${escapeHTML(p)}</p>`).join('');
  }
}

async function init() {
  try {
    const [site, projects, journal] = await Promise.all([
      fetchJSON('data/site.json').catch(() => fetchJSON('../data/site.json')),
      fetchJSON('data/projects.json').catch(() => fetchJSON('../data/projects.json')),
      fetchJSON('data/journal.json').catch(() => fetchJSON('../data/journal.json'))
    ]);

    const page = document.body.dataset.page;

    if (page === 'home') renderHome(site, projects, journal);
    else if (page === 'archive') renderArchive(projects);
    else if (page === 'journal') renderJournalIndex(journal);
    else if (page === 'project-detail') renderProjectDetail(projects);
    else if (page === 'post-detail') renderPostDetail(journal);
  } catch (e) {
    console.error(e);
  }
}

init();
