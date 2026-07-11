const state = {
  site: null,
  projects: [],
  journal: [],
  activeTag: "all",
  activeJournalTag: "all"
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
  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  return response.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.innerHTML = value;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildMeta(parts = []) {
  return parts.filter(Boolean).join(" / ");
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
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

  select.value = values.map(String).includes(String(existing)) ? String(existing) : "all";
}

function renderTagButtons(containerId, tags, activeTag, onClick) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = [
    `<button class="tag-chip ${activeTag === "all" ? "is-active" : ""}" type="button" data-tag="all">All tags</button>`,
    ...tags.map(tag => `
      <button class="tag-chip ${activeTag === tag ? "is-active" : ""}" type="button" data-tag="${escapeHTML(tag)}">
        ${escapeHTML(tag)}
      </button>
    `)
  ].join("");

  container.querySelectorAll("[data-tag]").forEach(button => {
    button.addEventListener("click", () => onClick(button.dataset.tag || "all"));
  });
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

  setText("about-preview-text-1", site.aboutPreview?.[0]);
  setText("about-preview-text-2", site.aboutPreview?.[1]);

  setText("contact-heading", site.contactPreview?.heading);
  setText("contact-description", site.contactPreview?.description);

  const contactLinks = document.getElementById("contact-links");
  if (contactLinks && site.contactPreview?.links) {
    contactLinks.innerHTML = site.contactPreview.links.map(link => {
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
          <img src="${escapeHTML(item.cover)}" alt="${escapeHTML(item.alt || item.title)}" width="900" height="1100" loading="lazy" />
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

function filterProjects(projects) {
  const type = document.getElementById("filter-type")?.value || "all";
  const year = document.getElementById("filter-year")?.value || "all";
  const search = (document.getElementById("filter-search")?.value || "").trim().toLowerCase();
  const tag = state.activeTag;

  return projects.filter(item => {
    const matchesType = type === "all" || item.type === type;
    const matchesYear = year === "all" || String(item.year) === String(year);
    const matchesTag = tag === "all" || (item.tags || []).includes(tag);
    const haystack = [item.title, item.category, item.type, item.location, ...(item.tags || [])].join(" ").toLowerCase();
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
        <img src="${escapeHTML(item.cover)}" alt="${escapeHTML(item.alt || item.title)}" width="1200" height="1500" loading="lazy" />
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
        <a class="archive-entry-link" href="${escapeHTML(item.url || 'project/index.html')}">${escapeHTML(item.cta || "Read project")}</a>
      </div>
    </article>
  `).join("");
}

function applyArchiveFilters() {
  renderArchiveEntries(filterProjects(state.projects));
}

function renderArchive(site, projects) {
  populateSelect("filter-type", getUniqueValues(projects, "type"));
  populateSelect("filter-year", getUniqueValues(projects, "year").sort((a, b) => Number(b) - Number(a)));

  renderTagButtons("tag-row", getUniqueTags(projects), state.activeTag, (tag) => {
    state.activeTag = tag;
    renderArchive(site, projects);
  });

  document.getElementById("filter-type")?.addEventListener("change", applyArchiveFilters);
  document.getElementById("filter-year")?.addEventListener("change", applyArchiveFilters);
  document.getElementById("filter-search")?.addEventListener("input", applyArchiveFilters);

  applyArchiveFilters();
  document.title = `Archive — ${site.brand}`;
}

function filterJournal(entries) {
  const type = document.getElementById("journal-filter-type")?.value || "all";
  const year = document.getElementById("journal-filter-year")?.value || "all";
  const search = (document.getElementById("journal-filter-search")?.value || "").trim().toLowerCase();
  const tag = state.activeJournalTag;

  return entries.filter(item => {
    const matchesType = type === "all" || item.type === type;
    const matchesYear = year === "all" || String(item.year) === String(year);
    const matchesTag = tag === "all" || (item.tags || []).includes(tag);
    const haystack = [item.title, item.summary, item.type, ...(item.tags || [])].join(" ").toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesType && matchesYear && matchesTag && matchesSearch;
  });
}

function renderJournalIndex(entries) {
  const list = document.getElementById("journal-index-list");
  const count = document.getElementById("journal-results-count");
  if (!list || !count) return;

  count.textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;

  if (!entries.length) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No journal entries found.</h3>
        <p>Try changing the type, year, search term, or active tag.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = entries.map(item => `
    <article class="journal-index-entry">
      <div class="journal-index-date">${escapeHTML(item.dateLabel)}</div>
      <div class="journal-index-main">
        <div class="meta">${escapeHTML(buildMeta([item.type, item.readingTime]))}</div>
        <h2>${escapeHTML(item.title)}</h2>
        <p class="journal-index-summary">${escapeHTML(item.summary)}</p>
        <div class="journal-index-tags">
          ${(item.tags || []).map(tag => `<span class="journal-index-tag">${escapeHTML(tag)}</span>`).join("")}
        </div>
      </div>
      <div class="journal-index-side">
        <div class="journal-index-type">${escapeHTML(item.type)}</div>
        <a class="journal-index-link" href="${escapeHTML(item.url || 'post/index.html')}">${escapeHTML(item.cta || "Read entry")}</a>
      </div>
    </article>
  `).join("");
}

function applyJournalFilters() {
  renderJournalIndex(filterJournal(state.journal));
}

function renderJournalPage(site, journal) {
  populateSelect("journal-filter-type", getUniqueValues(journal, "type"));
  populateSelect("journal-filter-year", getUniqueValues(journal, "year").sort((a, b) => Number(b) - Number(a)));

  renderTagButtons("journal-tag-row", getUniqueTags(journal), state.activeJournalTag, (tag) => {
    state.activeJournalTag = tag;
    renderJournalPage(site, journal);
  });

  document.getElementById("journal-filter-type")?.addEventListener("change", applyJournalFilters);
  document.getElementById("journal-filter-year")?.addEventListener("change", applyJournalFilters);
  document.getElementById("journal-filter-search")?.addEventListener("input", applyJournalFilters);

  applyJournalFilters();
  document.title = `Journal — ${site.brand}`;
}

function renderProjectDetail(site, projects) {
  const slug = getQueryParam("slug");
  const project = projects.find(item => item.slug === slug) || projects[0];
  if (!project) return;

  setText("project-title", project.title);
  setText("project-lede", project.summary);
  setText("project-meta-type", project.type);
  setText("project-meta-category", project.category);
  setText("project-meta-year", project.year);
  setText("project-meta-location", project.location);
  setText("project-role", project.role);
  setText("project-format", project.format);
  setText("project-scope", project.scope);
  setText("project-credits", project.credits);
  setText("project-tools", project.tools);

  const heroImage = document.getElementById("project-hero-image");
  if (heroImage && project.heroImage) {
    heroImage.src = project.heroImage;
    heroImage.alt = project.alt || project.title;
  }

  const intro = document.getElementById("project-intro-text");
  if (intro && project.intro) {
    intro.innerHTML = project.intro.map(p => `<p>${escapeHTML(p)}</p>`).join("");
  }

  const context = document.getElementById("project-context-text");
  if (context && project.context) {
    context.innerHTML = project.context.map(p => `<p>${escapeHTML(p)}</p>`).join("");
  }

  const notes = document.getElementById("project-notes-text");
  if (notes && project.notes) {
    notes.innerHTML = project.notes.map(p => `<p>${escapeHTML(p)}</p>`).join("");
  }

  const tags = document.getElementById("project-tag-list");
  if (tags) {
    tags.innerHTML = (project.tags || []).map(tag => `<span>${escapeHTML(tag)}</span>`).join("");
  }

  const processList = document.getElementById("project-process-list");
  if (processList && project.processItems) {
    processList.innerHTML = project.processItems.map(item => `
      <article class="project-process-item">
        <div class="project-process-step">${escapeHTML(item.step)}</div>
        <div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>
        </div>
      </article>
    `).join("");
  }

  if (project.media?.length) {
    const mediaSection = document.getElementById("media");
    if (mediaSection) {
      const large = project.media.find(item => item.large);
      const rest = project.media.filter(item => !item.large);

      mediaSection.innerHTML = `
        <div class="project-section-heading">
          <div class="section-label">Media</div>
          <h2>Images, frames, and visual sequence.</h2>
        </div>
        ${large ? `
          <figure class="project-figure project-figure-large">
            <img src="${escapeHTML(large.src)}" alt="${escapeHTML(large.alt)}" width="${escapeHTML(large.width)}" height="${escapeHTML(large.height)}" loading="lazy" />
            <figcaption>${escapeHTML(large.caption)}</figcaption>
          </figure>
        ` : ""}
        <div class="project-media-grid">
          ${rest.map(item => `
            <figure class="project-figure">
              <img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt)}" width="${escapeHTML(item.width)}" height="${escapeHTML(item.height)}" loading="lazy" />
              <figcaption>${escapeHTML(item.caption)}</figcaption>
            </figure>
          `).join("")}
        </div>
      `;
    }
  }

  document.title = `${project.title} — ${site.brand}`;
}

function renderPostDetail(site, journal) {
  const slug = getQueryParam("slug");
  const post = journal.find(item => item.slug === slug) || journal[0];
  if (!post) return;

  setText("post-type", post.type);
  setText("post-date", post.dateLabel);
  setText("post-reading-time", post.readingTime);
  setText("post-title", post.title);
  setText("post-deck", post.deck || post.summary);
  setText("post-footer-type", post.type);
  setText("post-footer-reading-time", post.readingTime);
  setText("post-footer-date", post.dateLabel);

  const heroImage = document.getElementById("post-hero-image");
  if (heroImage && post.heroImage) {
    heroImage.src = post.heroImage;
    heroImage.alt = post.title;
  }

  setText("post-hero-caption", post.heroCaption);

  const tags = document.getElementById("post-tag-list");
  if (tags) {
    tags.innerHTML = (post.tags || []).map(tag => `<span>${escapeHTML(tag)}</span>`).join("");
  }

  const intro = document.getElementById("post-body-intro");
  if (intro && post.bodyIntro) {
    intro.innerHTML = post.bodyIntro.map(p => `<p>${escapeHTML(p)}</p>`).join("");
  }

  const quote = document.querySelector(".post-pullquote p");
  if (quote && post.quote) {
    quote.textContent = post.quote;
  }

  const main = document.getElementById("post-body-main");
  if (main && post.bodyMain) {
    main.innerHTML = post.bodyMain.map(p => `<p>${escapeHTML(p)}</p>`).join("");
  }

  if (post.inlineImage) {
    const figure = document.querySelector(".post-inline-figure");
    if (figure) {
      figure.innerHTML = `
        <img src="${escapeHTML(post.inlineImage.src)}" alt="${escapeHTML(post.inlineImage.alt)}" width="${escapeHTML(post.inlineImage.width)}" height="${escapeHTML(post.inlineImage.height)}" loading="lazy" />
        <figcaption>${escapeHTML(post.inlineImage.caption)}</figcaption>
      `;
    }
  }

  document.title = `${post.title} — ${site.brand}`;
}

function renderAboutPage(site) {
  const about = site.aboutPage;
  if (!about) return;

  setText("site-brand-text", site.brand);

  const introTitle = document.querySelector(".about-intro h1");
  const introEyebrow = document.querySelector(".about-intro .eyebrow");
  const introDesc = document.querySelector(".about-intro .page-intro-copy");

  if (introTitle) introTitle.textContent = about.title;
  if (introEyebrow) introEyebrow.textContent = about.eyebrow;
  if (introDesc) introDesc.textContent = about.description;

  const profile = document.querySelector(".about-profile-list");
  if (profile && about.profile) {
    profile.innerHTML = `
      <div><dt>Name</dt><dd>${escapeHTML(about.profile.name)}</dd></div>
      <div><dt>Base</dt><dd>${escapeHTML(about.profile.base)}</dd></div>
      <div><dt>Practice</dt><dd>${escapeHTML(about.profile.practice)}</dd></div>
    `;
  }

  const blocks = document.querySelector(".about-main");
  if (blocks && about.sections) {
    const sectionsHTML = about.sections.map(section => `
      <section class="about-block">
        <h2>${escapeHTML(section.title)}</h2>
        <div class="about-prose">
          ${section.paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join("")}
        </div>
      </section>
    `).join("");

    const capabilitiesHTML = `
      <section class="about-block">
        <h2>What the site holds.</h2>
        <div class="about-capability-grid">
          ${(about.capabilities || []).map(item => `
            <div class="about-capability">
              <span>${escapeHTML(item.number)}</span>
              <strong>${escapeHTML(item.title)}</strong>
              <p>${escapeHTML(item.description)}</p>
            </div>
          `).join("")}
        </div>
      </section>
    `;

    const principlesHTML = `
      <section class="about-block">
        <h2>Working principles.</h2>
        <div class="about-principles">
          ${(about.principles || []).map((item, index) => `
            <div class="about-principle">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <p>${escapeHTML(item)}</p>
            </div>
          `).join("")}
        </div>
      </section>
    `;

    blocks.innerHTML = sectionsHTML + capabilitiesHTML + principlesHTML;
  }

  document.title = `About — ${site.brand}`;
}

function renderContactPage(site) {
  const contact = site.contactPage;
  if (!contact) return;

  const introTitle = document.querySelector(".contact-intro h1");
  const introEyebrow = document.querySelector(".contact-intro .eyebrow");
  const introDesc = document.querySelector(".contact-intro .page-intro-copy");

  if (introTitle) introTitle.textContent = contact.title;
  if (introEyebrow) introEyebrow.textContent = contact.eyebrow;
  if (introDesc) introDesc.textContent = contact.description;

  const links = document.querySelector(".contact-link-list");
  if (links) {
    links.innerHTML = (contact.links || []).map(link => {
      const external = link.href.startsWith("http");
      const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHTML(link.href)}"${target}>${escapeHTML(link.label)}</a>`;
    }).join("");
  }

  const notes = document.querySelector(".contact-notes");
  if (notes) {
    notes.innerHTML = (contact.notes || []).map(note => `<p>${escapeHTML(note)}</p>`).join("");
  }

  document.title = `Contact — ${site.brand}`;
}

async function init() {
  initTheme();

  try {
    const [site, projects, journal] = await Promise.all([
      fetchJSON("data/site.json").catch(() => fetchJSON("../data/site.json")),
      fetchJSON("data/projects.json").catch(() => fetchJSON("../data/projects.json")),
      fetchJSON("data/journal.json").catch(() => fetchJSON("../data/journal.json"))
    ]);

    state.site = site;
    state.projects = projects;
    state.journal = journal;

    renderGlobal(site);

    const page = document.body.dataset.page;

    if (page === "archive") return renderArchive(site, projects);
    if (page === "journal") return renderJournalPage(site, journal);
    if (page === "project-detail") return renderProjectDetail(site, projects);
    if (page === "post-detail") return renderPostDetail(site, journal);
    if (page === "about") return renderAboutPage(site);
    if (page === "contact") return renderContactPage(site);

    renderHome(site, projects, journal);
  } catch (error) {
    console.error(error);
  }
}

init();
