const state = {
  site: null,
  projects: [],
  journal: []
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

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.innerHTML = value;
}

function buildMeta(parts = []) {
  return parts.filter(Boolean).join(" / ");
}

function renderSite(site) {
  setText("site-brand-text", site.brand);
  setText("hero-eyebrow", site.hero.eyebrow);
  setText("hero-title", site.hero.title);
  setText("hero-description", site.hero.description);

  setText("featured-section-title", site.featuredSection.title);
  setText("featured-section-description", site.featuredSection.description);

  setText("about-preview-text-1", site.about.preview[0]);
  setText("about-preview-text-2", site.about.preview[1]);

  setText("contact-heading", site.contact.heading);
  setText("contact-description", site.contact.description);

  setText("footer-brand", site.brand);
  setText("footer-tagline", site.tagline);

  const contactLinks = document.getElementById("contact-links");
  contactLinks.innerHTML = site.contact.links.map(link => {
    const external = link.href.startsWith("http");
    const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${link.href}"${target}>${link.label}</a>`;
  }).join("");

  document.title = `${site.brand} — ${site.tagline}`;
}

function renderFeatured(projects) {
  const featured = projects.find(item => item.featured) || projects[0];
  if (!featured) return;

  setText("featured-meta", buildMeta([featured.type, featured.category, featured.location]));
  setText("featured-title", featured.title);
  setText("featured-summary", featured.summary);

  const featuredLink = document.getElementById("featured-link");
  featuredLink.textContent = featured.cta || "Open story";
  featuredLink.href = featured.url || "project/index.html";

  const media = document.getElementById("featured-media");
  media.style.backgroundImage =
    `linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.22)), url('${featured.cover}')`;
}

function renderWorks(projects) {
  const worksGrid = document.getElementById("works-grid");
  const selected = projects.slice(0, 3);

  worksGrid.innerHTML = selected.map(item => `
    <article class="archive-card">
      <div class="archive-thumb">
        <img
          src="${item.cover}"
          alt="${item.alt}"
          width="900"
          height="1100"
          loading="lazy"
        />
      </div>
      <div class="meta">${buildMeta([item.type, item.category])}</div>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
    </article>
  `).join("");
}

function renderJournal(entries) {
  const journalList = document.getElementById("journal-list");
  const latest = entries.slice(0, 3);

  journalList.innerHTML = latest.map(item => `
    <article class="journal-item">
      <div class="journal-date">${item.dateLabel}</div>
      <div>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
      </div>
      <div class="journal-type">${item.type}</div>
    </article>
  `).join("");
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

    renderSite(site);
    renderFeatured(projects);
    renderWorks(projects);
    renderJournal(journal);
  } catch (error) {
    console.error(error);
  }
}

init();
