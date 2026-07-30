
let searchOption = "all";

$("#search_form").submit(async (event) => {
    event.preventDefault();
    
    let street = $("#search_input").val().trim();
    if (!street) alert("You need to provide a street name");

    $("#results").empty();

    if (searchOption === "all" || searchOption === "user-reported") {
        await closureSearch(street);
    }

    if (searchOption === "all" || searchOption === "nyc") {
        await nycClosureSearch(street);
    }

    $('#search_form').trigger('reset');
    $('#search_input').focus();
});

//-----------------------------------------------------

async function closureSearch(street) {
    let response, closureResults;

    //THIS IS FOR THE MONGODB CLOSURES DATABASE

    try {
        response = await fetch(`/closures/closureSearch?street=${street}`);
    } catch (e) {
        alert("There was an error fetching the results");
    }

    closureResults = await response.json();

    console.log(closureResults);

    if (closureResults.length === 0) {
        let noResultsElement = `<div>No user closures were found for ${street}</div>`;
        $("#results").append(noResultsElement);
    } else {
        for(let closure of closureResults) {
            let id = closure._id;
            let onStreet = closure.on_street_name;
            let fromStreet = closure.from_street_name;
            let toStreet = closure.to_street_name;
            let closureElement = `
                <div id=${id} class="closure-element">
                    <p>${onStreet}</p>
                    <p>From ${fromStreet} to ${toStreet}</p>
                </div>
            `;
            $("#results").append(closureElement);
        }
    }
}

async function nycClosureSearch(street) {
    let response, closureResults;

    //THIS IS FOR NYC OPEN DATA

    try {
        response = await fetch(`/closureSearch?street=${street}`);
    } catch (e) {
        alert("There was an error fetching the results");
    }

    try {
        closureResults = await response.json();
        console.log(closureResults);
        for(let closure of closureResults.results) {
            let onStreet = closure.street;
            let toStreet = closure.toStreet || "";
            let fromStreet = toStreet ? `${closure.fromStreet} to` : closure.fromStreet;
            let closureElement = `
                <div class="closure-element">
                    <p>${onStreet}</p>
                    <p>From ${fromStreet} ${toStreet}</p>
                </div>
            `;
            $("#results").append(closureElement);
        }
    } catch (e) {
        let noResultsElement = `<div>No NYC closures were found for ${street}</div>`;
        $("#results").append(noResultsElement);
    }
    
}

async function toggleOption(option) {
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

    console.log(searchOption);
}