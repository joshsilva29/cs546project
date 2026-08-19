
let searchOption = "all";
let closureType = "all";

$("#search_form").submit(async (event) => {
    event.preventDefault();
    
    let street = $("#search_input").val().trim();

    if (!street) {
        $("#results").empty();
        let element = `<div>You must provide a street name.</div>`;
        $("#results").append(element);
        $('#search_form').trigger('reset');
        $('#search_input').focus();
    } else {
        let loading = "<div >Loading...</div>";

        $("#results").empty();
        $("#results").append(loading);

        let elements = [];

        if (searchOption === "all" || searchOption === "user-reported") {
            let userReportedClosures = await closureSearch(street);
            elements.push(...userReportedClosures);
        }

        if (searchOption === "all" || searchOption === "nyc") {
            let nycClosures = await nycClosureSearch(street);
            elements.push(...nycClosures);
        }

        // console.log(elements);

        let noResultsElement = `<div>No closures were found for "${street}"</div>`;
        if (elements.length === 0) elements.push(noResultsElement);
        // console.log(elements.length);
        // console.log(elements[0]);

        $("#results").empty(); //remove loading
        for (let element of elements) {
            $("#results").append(element);
        }

        $('#search_form').trigger('reset');
        $('#search_input').focus();
    }

});

//-----------------------------------------------------

async function closureSearch(street) {
    let response, closureResults;

    //THIS IS FOR THE MONGODB CLOSURES DATABASE

    if (closureType === "all") {
        try {
            response = await fetch(`/closures/closureSearch?street=${street}`);
        } catch (e) {
            console.error(e);
        }
    } else {
        try {
            response = await fetch(`/closures/closureHistoryFiltered?street=${street}&status=${closureType}`);
        } catch (e) {
            console.error(e);
        }
    }

    closureResults = await response.json();

    // console.log(closureResults);
    let elements = [];

    if (closureResults.length !== 0) {
        for(let closure of closureResults) {
            let id = closure._id;
            let onStreet = closure.on_street_name;
            let fromStreet = closure.from_street_name;
            let toStreet = closure.to_street_name;
            let closureElement = `
                <a href="/closureDetail/${id}" class="closure-element">
                    <p>${onStreet}</p>
                    <p>From ${fromStreet} to ${toStreet}</p>
                </a>
            `;
            elements.push(closureElement);
        }
    }
    
    return elements;
}

async function nycClosureSearch(street) {
    let response, closureResults;

    //THIS IS FOR NYC OPEN DATA

    let elements = [];

    try {
        let searchUrl = `/closureSearch?street=${street}`;
        if (closureType === "inactive") {
            searchUrl = `/closureSearch?street=${street}&status=past`;
        } else if (closureType === "active") {
            searchUrl = `/closureSearch?street=${street}&status=active`;
        }
        response = await fetch(searchUrl);
    } catch (e) {
        console.error(e);
    }

    try {
        closureResults = await response.json();
        if (closureResults && closureResults.results) {
            let seen = new Set();
            for(let closure of closureResults.results) {

                let oftCode = closure.oftcode; //since query returns closures with duplicate oftcodes
                if (seen.has(oftCode)) {
                    continue;
                } else {
                    seen.add(oftCode);
                }

                let onStreet = closure.street;
                let toStreet = closure.toStreet || "";
                let fromStreet = toStreet ? `${closure.fromStreet} to` : closure.fromStreet;
                let href = `/nycClosureDetail/${encodeURIComponent(closure.oftcode)}/${encodeURIComponent(closure.startDate.slice(0, -1))}/${encodeURIComponent(closure.endDate.slice(0, -1))}`;
                let closureElement = `
                    <a href=${href} class="closure-element">
                        <p>${onStreet}</p>
                        <p>From ${fromStreet} ${toStreet}</p>
                    </a>
                `;
                elements.push(closureElement);
            }
        }
    } catch (e) {
        console.error(e);
    }

    return elements;
    
}

function toggleOption(option) {
    if (option === "all") {
        $("#all").addClass("selected-class");
        $("#user-reported").removeClass("selected-class");
        $("#nyc").removeClass("selected-class");
    } else if (option === "user-reported") {
        $("#all").removeClass("selected-class");
        $("#user-reported").addClass("selected-class");
        $("#nyc").removeClass("selected-class");
    } else {
        $("#all").removeClass("selected-class");
        $("#user-reported").removeClass("selected-class");
        $("#nyc").addClass("selected-class");
    }
    searchOption = option;

    // console.log(searchOption);
}

function toggleClosureType(option) {
    if (option === "all") {
        $("#allClosures").addClass("selected-class");
        $("#inactive").removeClass("selected-class");
        $("#active").removeClass("selected-class");
    } else if (option === "inactive") {
        $("#allClosures").removeClass("selected-class");
        $("#inactive").addClass("selected-class");
        $("#active").removeClass("selected-class");
    } else {
        $("#allClosures").removeClass("selected-class");
        $("#inactive").removeClass("selected-class");
        $("#active").addClass("selected-class");
    }
    closureType = option;

    // console.log(closureType);
}