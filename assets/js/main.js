const state = {
  site: null,
  projects: [],
  journal: [],
  activeTag: "all"
};

function initTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  let theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  root.setAttribute("data-theme", theme);

  toggle?.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", theme);
  });
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return response.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

function buildMeta(parts = []) {
  return parts.filter(Boolean).join(" / ");
}

function escapeHTML(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderGlobal(site) {
  setText("site-brand-text", site.brand);
  setText("footer-brand", site.brand);
  setText("footer-tagline", site.tagline);
}

function renderHome(site, projects, journal) {
  setText("hero-eyebrow", site.hero.eyebrow);
  setText("hero-title", site.hero.title);
  setText("hero-description", site.hero.description);

  setText("featured-section-title", site.featuredSection.title);
  setText("featured-section-description", site.featuredSection.description);

  setText("about-preview-text-1", site.about.preview[0]);
  setText("about-preview-text-2", site.about.preview[1]);

  setText("contact-heading", site.contact.heading);
  setText("contact-description", site.contact.description);

  const contactLinks = document.getElementById("contact-links");
  if (contactLinks) {
    contactLinks.innerHTML = site.contact.links.map(link => {
      const external = link.href.startsWith("http");
      const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHTML(link.href)}"${target}>${escapeHTML(link.label)}</a>`;
    }).join("");
  }

  const featured = projects.find(item => item.featured) || projects[0];
  if (featured) {
    setText("featured-meta", buildMeta([featured.type, featured.category, featured.location]));
    setText("featured-title", featured.title);
    setText("featured-summary", featured.summary);

    const featuredLink = document.getElementById("featured-link");
    const featuredMedia = document.getElementById("featured-media");

    if (featuredLink) {
      featuredLink.textContent = featured.cta || "Open story";
      featuredLink.href = featured.url || "project/index.html";
    }

    if (featuredMedia) {
      featuredMedia.style.backgroundImage =
        `linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.22)), url('${featured.cover}')`;
    }
  }

  const worksGrid = document.getElementById("works-grid");
  if (worksGrid) {
    worksGrid.innerHTML = projects.slice(0, 3).map(item => `
      <article class="archive-card">
        <div class="archive-thumb">
          <img
            src="${escapeHTML(item.cover)}"
            alt="${escapeHTML(item.alt || item.title)}"
            width="900"
            height="1100"
            loading="lazy"
          />
        </div>
        <div class="meta">${escapeHTML(buildMeta([item.type, item.category]))}</div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.summary)}</p>
      </article>
    `).join("");
  }

  const journalList = document.getElementById("journal-list");
  if (journalList) {
    journalList.innerHTML = journal.slice(0, 3).map(item => `
      <article class="journal-item">
        <div class="journal-date">${escapeHTML(item.dateLabel)}</div>
        <div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.summary)}</p>
        </div>
        <div class="journal-type">${escapeHTML(item.type)}</div>
      </article>
    `).join("");
  }

  document.title = `${site.brand} — ${site.tagline}`;
}

function getUniqueValues(items, key) {
  return [...new Set(items.map(item => item[key]).filter(Boolean))];
}

function getUniqueTags(items) {
  return [...new Set(items.flatMap(item => item.tags || []))];
}

function populateSelect(selectId, values) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const existing = select.value || "all";
  select.innerHTML = `<option value="all">All</option>` + values.map(value => {
    return `<option value="${escapeHTML(String(value))}">${escapeHTML(String(value))}</option>`;
  }).join("");
  select.value = values.includes(existing) ? existing : "all";
}

function renderTagRow(tags) {
  const tagRow = document.getElementById("tag-row");
  if (!tagRow) return;

  tagRow.innerHTML = [
    `<button class="tag-chip ${state.activeTag === "all" ? "is-active" : ""}" type="button" data-tag="all">All tags</button>`,
    ...tags.map(tag => `
      <button class="tag-chip ${state.activeTag === tag ? "is-active" : ""}" type="button" data-tag="${escapeHTML(tag)}">
        ${escapeHTML(tag)}
      </button>
    `)
  ].join("");

  tagRow.querySelectorAll("[data-tag]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeTag = button.dataset.tag || "all";
      renderTagRow(tags);
      applyArchiveFilters();
    });
  });
}

function filterProjects(projects) {
  const type = document.getElementById("filter-type")?.value || "all";
  const year = document.getElementById("filter-year")?.value || "all";
  const search = (document.getElementById("filter-search")?.value || "").trim().toLowerCase();
  const tag = state.activeTag;

  return projects.filter(item => {
    const matchesType = type === "all" || item.type === type;
    const matchesYear = year === "all" || String(item.year) === year;
    const matchesTag = tag === "all" || (item.tags || []).includes(tag);

    const haystack = [
      item.title,
      item.category,
      item.type,
      item.location,
      ...(item.tags || [])
    ].join(" ").toLowerCase();

    const matchesSearch = !search || haystack.includes(search);

    return matchesType && matchesYear && matchesTag && matchesSearch;
  });
}

function renderArchiveEntries(items) {
  const grid = document.getElementById("archive-grid");
  const count = document.getElementById("results-count");
  if (!grid || !count) return;

  count.textContent = `${items.length} ${items.length === 1 ? "entry" : "entries"}`;

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No entries found.</h3>
        <p>Try widening the filter, changing the search term, or clearing the active tag.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <article class="archive-entry">
      <div class="archive-entry-media">
        <img
          src="${escapeHTML(item.cover)}"
          alt="${escapeHTML(item.alt || item.title)}"
          width="1200"
          height="1500"
          loading="lazy"
        />
      </div>

      <div class="archive-entry-text">
        <div class="meta">${escapeHTML(buildMeta([item.type, item.category, item.location]))}</div>

        <div class="archive-entry-header">
          <h2>${escapeHTML(item.title)}</h2>
          <div class="archive-entry-year">${escapeHTML(String(item.year || ""))}</div>
        </div>

        <p class="archive-entry-summary">${escapeHTML(item.summary)}</p>

        <div class="archive-entry-tags">
          ${(item.tags || []).map(tag => `<span class="archive-entry-tag">${escapeHTML(tag)}</span>`).join("")}
        </div>

        <a class="archive-entry-link" href="${escapeHTML(item.url || 'project/index.html')}">
          ${escapeHTML(item.cta || "Read project")}
        </a>
      </div>
    </article>
  `).join("");
}

function applyArchiveFilters() {
  const filtered = filterProjects(state.projects);
  renderArchiveEntries(filtered);
}

function renderArchive(site, projects) {
  setText("archive-title", "Works arranged by type, time, and context.");
  setText(
    "archive-description",
    "The archive brings together design, photography, moving image, writing, travel, and process. It should be searchable like an index, but read with the pace of an editorial sequence."
  );

  populateSelect("filter-type", getUniqueValues(projects, "type"));
  populateSelect("filter-year", getUniqueValues(projects, "year").sort((a, b) => b - a));
  renderTagRow(getUniqueTags(projects));

  document.getElementById("filter-type")?.addEventListener("change", applyArchiveFilters);
  document.getElementById("filter-year")?.addEventListener("change", applyArchiveFilters);
  document.getElementById("filter-search")?.addEventListener("input", applyArchiveFilters);

  applyArchiveFilters();
  document.title = `Archive — ${site.brand}`;
}

async function init() {
  initTheme();

  try {
    const [site, projects, journal] = await Promise.all([
      fetchJSON("data/site.json"),
      fetchJSON("data/projects.json"),
      fetchJSON("data/journal.json")
    ]);

    state.site = site;
    state.projects = projects;
    state.journal = journal;

    renderGlobal(site);

    const page = document.body.dataset.page;
    if (page === "archive") {
      renderArchive(site, projects);
    } else {
      renderHome(site, projects, journal);
    }
  } catch (error) {
    console.error(error);
  }
}

init();
