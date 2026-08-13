const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("toggle");

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});