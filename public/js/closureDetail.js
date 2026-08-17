let currentClosure = null;

$(() => {
    loadClosure();
});

async function loadClosure() {
    let closure;
    try {
        const response = await fetch(`/closures/${closureId}`);
        closure = await response.json();
        if (closure.error) throw closure.error;
    } catch (e) {
        $("#closure-details").text("This closure could not be found.");
        return;
    }

    currentClosure = closure;

    // get all user id's referenced on page
    const userIds = new Set([closure.reported_by]);
    for (const comment of closure.comments || []) {
        userIds.add(comment.user_id);
    }
    // get usernames from id's
    const userNames = await resolveUserNames([...userIds]);

    renderClosure(closure, userNames);
    renderComments(closure.comments || [], userNames);
    renderCorroborateButton(closure);
    renderCommentForm();
}

// get usernames from id's
async function resolveUserNames(userIds) {
    const namesById = {};
    await Promise.all(
        userIds.map(async (id) => {
            try {
                const response = await fetch(`/users/${id}`);
                const user = await response.json();
                namesById[id] = user.error
                    ? "Unknown user"
                    : `${user.first_name} ${user.last_name}`;
            } catch (e) {
                namesById[id] = "Unknown user";
            }
        })
    );
    return namesById;
}

function renderClosure(closure, userNames) {
    const ongoing = !closure.work_end_date;
    const statusText = ongoing ? "Ongoing" : `Ended ${closure.work_end_date}`;

    const affected = [];
    if (closure.affects_sidewalk) affected.push("Sidewalk");
    if (closure.affects_roads) affected.push("Roads");
    if (closure.affects_bike_lanes) affected.push("Bike lanes");
    const affectedText = affected.length ? affected.join(", ") : "None specified";

    const locationText = closure.closure_location
        ? `${closure.closure_location.latitude}, ${closure.closure_location.longitude}`
        : "Not provided";

    $("#closure-details").html(`
        <h2>${closure.on_street_name}</h2>
        <p>From ${closure.from_street_name} to ${closure.to_street_name}</p>
        <p>Reported by ${userNames[closure.reported_by]} on ${closure.date_reported}</p>
        <p">${statusText}</p>
        <p>Affects: ${affectedText}</p>
        <p>Coordinates: ${locationText}</p>
        <p>${closure.corroborated_count || 0} confirmation${closure.corroborated_count === 1 ? "" : "s"}</p>
    `);
}

function renderComments(comments, userNames) {
    $("#comments-list").empty();

    if (comments.length === 0) {
        $("#comments-list").append("<p>No comments yet.</p>");
        return;
    }

    for (const comment of comments) {
        $("#comments-list").append(`
            <div">
                <p">${userNames[comment.user_id]} &middot; ${comment.date_posted}</p>
                <p">${comment.comment_text}</p>
            </div>
        `);
    }
}

function renderCorroborateButton(closure) {
    // must be logged in
    if (!currentUserId) return;

    if (closure.corroborated_by.includes(currentUserId)) {
        $("#corroborate-message").text("You've already confirmed this closure.");
        return;
    }

    $("#corroborate-btn").show();
}

$("#corroborate-btn").click(async () => {
    $("#corroborate-btn").prop("disabled", true);

    try {
        const response = await fetch(`/closures/${closureId}/corroborate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId })
        });
        const result = await response.json();
        if (!response.ok) throw result.error || "Could not confirm this closure.";

        currentClosure = result;
        $("#corroborate-btn").hide();
        $("#corroborate-message").text("Thanks for confirming!");
        renderClosure(currentClosure, await resolveUserNames([currentClosure.reported_by]));
    } catch (e) {
        $("#corroborate-message").text(typeof e === "string" ? e : "Could not confirm this closure.");
        $("#corroborate-btn").prop("disabled", false);
    }
});

function renderCommentForm() {
    // must be logged in
    if (!currentUserId) return;
    $("#comment-form").show();
}

$("#comment-form").submit(async (event) => {
    event.preventDefault();
    $("#comment-error").text("");

    const commentText = $("#comment_text").val().trim();
    if (!commentText) {
        $("#comment-error").text("Comment cannot be empty.");
        return;
    }

    try {
        const response = await fetch(`/closures/${closureId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment_text: commentText, user_id: currentUserId })
        });
        const result = await response.json();
        if (!response.ok) throw result.error || "Could not post comment.";

        currentClosure = result;
        $("#comment-form").trigger("reset");

        const userIds = new Set([currentClosure.reported_by]);
        for (const comment of currentClosure.comments) userIds.add(comment.user_id);
        const userNames = await resolveUserNames([...userIds]);

        renderComments(currentClosure.comments, userNames);
    } catch (e) {
        $("#comment-error").text(typeof e === "string" ? e : "Could not post comment.");
    }
});
