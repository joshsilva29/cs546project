$("#save_street_form").submit(async (event) => {
    
    let street = $("#save_street_input").val().trim();
    if (!street) {
        event.preventDefault();
        $("#error").empty();
        $("#error").append("You need to provide a street name to save");
    }
});