$(() => {
    loadClosure();
});

async function loadClosure() {
    let data;
    try {
        const response = await fetch(`/getClosure/${encodeURIComponent(oftcode)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`);
        data = await response.json();
        if (!response.ok) throw data.error || "Closure not found.";
    } catch (e) {
        $("#closure-details").text(typeof e === "string" ? e : "This closure could not be found.");
        return;
    }

    renderClosure(data.result);
}

// add formatting for dates/times
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// add formatting for nyc returned info
function toTitleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function renderClosure(closure) {
    const street = toTitleCase(closure.street);
    const fromStreet = toTitleCase(closure.fromStreet);
    const toStreet = toTitleCase(closure.toStreet);
    const crossStreets = `From: ${fromStreet}${toStreet ? ` to ${toStreet}` : ""}`;
    const borough = toTitleCase(closure.borough);
    const workType = toTitleCase(closure.workType);
    const startDate = formatDateTime(closure.startDate);
    const endDate = formatDateTime(closure.endDate);
    const duration = `${closure.durationDays} day${closure.durationDays === 1 ? "" : "s"}`;
    const status = closure.status;

    $("#closure-details").html(`
        <h2>${street}</h2>
        <p>${crossStreets}</p>
        <p>Borough: ${borough}</p>
        <p>Work Type: ${workType}</p>
        <p>Scheduled: ${startDate} through ${endDate}</p>
        <p>Status: ${status}</p>
        <p>Duration: ${duration}</p>
        <p>Reference: ${closure.oftcode}</p>
    `);
}
