// public/js/notifications.js
// Mark-as-read handlers for the notifications page + badge refresh.

(function () {
  function refreshBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    fetch('/notifications/unreadCount')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.count > 0) {
          badge.textContent = data.count > 99 ? '99+' : String(data.count);
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      })
      .catch(() => {});
  }

  $(document).on('click', '.mark-read-button', function () {
    const id = $(this).data('id');
    const button = $(this);
    fetch(`/notifications/${id}/read`, { method: 'POST' })
      .then((r) => {
        if (!r.ok) throw new Error('Could not mark as read');
        return r.json();
      })
      .then(() => {
        button.closest('.notification').removeClass('unread');
        button.remove();
        refreshBadge();
      })
      .catch(() => alert('Could not mark that notification as read.'));
  });

  $('#mark_all_read').on('click', function () {
    fetch('/notifications/readAll', { method: 'POST' })
      .then((r) => {
        if (!r.ok) throw new Error('Could not mark all as read');
        return r.json();
      })
      .then(() => {
        $('.notification').removeClass('unread');
        $('.mark-read-button').remove();
        refreshBadge();
      })
      .catch(() => alert('Could not mark all notifications as read.'));
  });
})();
