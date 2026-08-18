$(() => {
    loadClosure();
});

async function loadClosure() {
    let data;
    try {
        const response = await fetch(`/getClosure/${encodeURIComponent(oftcode)}`);
        data = await response.json();
        if (!response.ok) throw data.error || "Closure not found.";
    } catch (e) {
        $("#closure-details").text(typeof e === "string" ? e : "This closure could not be found.");
        return;
    }

    renderClosure(data.result);
}

function renderClosure(closure) {
    const street = closure.street;
    const fromStreet = closure.fromStreet;
    const toStreet = closure.toStreet;
    const crossStreets = `From ${fromStreet}${toStreet ? ` to ${toStreet}` : ""}`;
    const borough = closure.borough;
    const workType = closure.workType;
    const startDate = closure.startDate;
    const endDate = closure.endDate;
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
