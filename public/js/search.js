
$("#search_form").submit(async (event) => {
    event.preventDefault();
    
    let street = $("#search_input").val().trim();
    if (!street) alert("You need to provide a street name");

    let response, closureResults;

    //THIS IS FOR THE MONGODB CLOSURES DATABASE

    try {
        response = await fetch(`/closures/closureSearch?street=${street}`);
    } catch (e) {
        alert("There was an error fetching the results");
    }

    closureResults = await response.json();

    $("#results").empty();

    for(let closure of closureResults) {
        let id = closure._id;
        let onStreet = closure.on_street_name;
        let fromStreet = closure.from_street_name;
        let toStreet = closure.to_street_name;
        let closureElement = `
            <div id=${id} class="closure-element">
                <p>${onStreet}</p>
                <p>From ${onStreet} to ${toStreet}</p>
            </div>
        `;
        $("#results").append(closureElement);
    }

    $('#search_form').trigger('reset');
    $('#search_input').focus();
});