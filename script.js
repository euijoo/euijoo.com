const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".side-nav a");

function setActiveNav() {
  let currentId = "home";

  sections.forEach((section) => {
    const top = section.offsetTop - 120;
    if (window.scrollY >= top) {
      currentId = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    const dot = link.querySelector(".dot");
    if (link.getAttribute("href") === `#${currentId}`) {
      dot.classList.add("active-dot");
    } else {
      dot.classList.remove("active-dot");
    }
  });
}

window.addEventListener("scroll", setActiveNav);
window.addEventListener("load", setActiveNav);
