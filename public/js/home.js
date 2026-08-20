const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("toggle");

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});
// unread notifications badge -- element only exists when logged in
const notificationBadge = document.getElementById("notification-badge");
if (notificationBadge) {
  fetch("/notifications/unreadCount")
    .then((r) => r.json())
    .then((data) => {
      if (data && data.count > 0) {
        notificationBadge.textContent = data.count > 99 ? "99+" : String(data.count);
        notificationBadge.hidden = false;
      }
    })
    .catch(() => {}); // badge is decorative; never break the page over it
}
