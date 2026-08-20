$("#save_street_form").submit(async (event) => {
    
    let street = $("#save_street_input").val().trim();
    if (!street) {
        event.preventDefault();
        $("#error").empty();
        $("#error").append("You need to provide a street name to save");
    }
});

const itemList = document.getElementById('item-list');

$("#saved-street-list").click(async (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const streetName = event.target.dataset.id;

        try {
            const response = await fetch(`/savedStreets`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    street: streetName
                })
            });

            // 4. Update the UI if the server confirms deletion
            if (response.ok) {
                event.target.closest('.saved-street-list-item').remove();
            } else {
                alert('Server refused to delete item.');
            }
        } catch (e) {
            alert('Deleting saved street failed.');
        }
    }
});

