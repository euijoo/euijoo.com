const toTopBtn = document.getElementById("toTopBtn");

if (toTopBtn) {
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
