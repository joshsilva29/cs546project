// anytime there's a change, check if ongoing is checked.
// if it's checked disable the end date
$("#ongoing").change((event) => {
    if ($("#ongoing").is(":checked")) {
        $("#work_end_date").val("");
        $("#work_end_date").prop("disabled", true);
    } else {
        $("#work_end_date").prop("disabled", false);
    }
});

// default date reported to current date
$(() => {
    const today = new Date().toLocaleDateString('en-CA');
    $("#date_reported").val(today);
});


$("#report-closure-form").submit(async (event) => {
    // reset UI
    event.preventDefault();
    $("#client-error").hide();
    $("#success-message").hide();
    $("#server-error").hide();

    // read values
    let onStreet = $("#on_street_name").val();
    let fromStreet = $("#from_street_name").val();
    let toStreet = $("#to_street_name").val();
    let dateReported = $("#date_reported").val();
    let ongoing = $("#ongoing").is(":checked");
    let workEndDate = $("#work_end_date").val();
    let latitude = $("#latitude").val();
    let longitude = $("#longitude").val();
    let affectsSidewalk = $("#affects_sidewalk").is(":checked");
    let affectsRoads = $("#affects_roads").is(":checked");
    let affectsBikeLanes = $("#affects_bike_lanes").is(":checked");
    let closureLocation = null;

    try {
        // validate
        onStreet = checkStreet(onStreet);
        fromStreet = checkStreet(fromStreet);
        toStreet = checkStreet(toStreet);
        dateReported = checkDateString(dateReported, "Date Reported");
        if (!ongoing) {
            workEndDate = checkDateString(workEndDate, "Work End Date");
        } else {
            workEndDate = null;
        }

        // both lat + long must be provided, not just one
        if (latitude.trim() !== "" || longitude.trim() !== "") {
            const lat = Number(latitude);
            const long = Number(longitude);
            closureLocation = checkCoordinates(lat, long);
        }

        if (!affectsSidewalk && !affectsRoads && !affectsBikeLanes) {
            throw "At least one of sidewalk, roads, or bike lanes must be affected.";
        }
    } catch (e) {
        // if error, show on client side
        $("#client-error").text(e);
        $("#client-error").show();
        return;
    }

    const payload = {
        reported_by: currentUserId,
        on_street_name: onStreet,
        from_street_name: fromStreet,
        to_street_name: toStreet,
        date_reported: dateReported,
        work_end_date: workEndDate,
        closure_location: closureLocation,
        affects_sidewalk: affectsSidewalk,
        affects_roads: affectsRoads,
        affects_bike_lanes: affectsBikeLanes
    };

    try {
        // post request
        const response = await fetch("/closures/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw result.error || "There was an error submitting the closure.";
        }

        // confirm it worked
        $("#success-message").text("Closure reported successfully!");
        $("#success-message").show();
        $("#report-closure-form").trigger("reset");
        $("#work_end_date").prop("disabled", true);
    } catch (e) {
        // if problem, show on UI
        $("#client-error").text(typeof e === "string" ? e : "There was an error submitting the closure.");
        $("#client-error").show();
    }
});
