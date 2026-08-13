function getUserLocation() {
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by your browser.");
    return;
  }

  const options = {
    enableHighAccuracy: true, // use GPS if available for better accuracy
    timeout: 60000,           // wait up to 60 seconds for a response
    maximumAge: 0             // force fresh location data instead of cached data
  };

  navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
}


async function successCallback(position) {
  

  let latitude = position.coords.latitude;
  let longitude = position.coords.longitude;
  const accuracy = position.coords.accuracy; 

  const elements = [];

  const nearbyUserClosures = await nearByClosureSearch(latitude, longitude);
  // const nearbyNYCClosures = await nearByNYCClosureSearch(latitude, longitude);
  elements.push(nearbyUserClosures);
  // elements.push(nearbyNYCClosures)


  $("#results").empty(); //remove loading
  for (let element of elements) {
    $("#results").append(element);
  }
}

// search from mongodb database
async function nearByClosureSearch(latitude, longitude) {
  let response, closureResults;

  try {
    const response = await fetch(`/closures/nearYou?latitude=${latitude}&longitude=${longitude}&maxDistanceMiles=10`);
  } catch (e) {
    alert("There was an error fetching nearby closures");
  }

  const closureResults = await response.json();

  let elements = [];

  if (closureResults.length === 0) {
    let noResultsElement = `<div>No user closures were found for ${street}</div>`;
    elements.push(noResultsElement);
    // $("#results").append(noResultsElement);
  } else {
    for (let closure of closureResults) {
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
      elements.push(closureElement);
    }
  }

  return elements;
}

// from NYC data
async function nearByNYCClosureSearch(latitude, longitude) {
  let response, closureResults;

  try {
    const response = await fetch(`/closures/nearYou?latitude=${latitude}&longitude=${longitude}&maxDistanceMiles=10`); // change fetch request to use nyc version once merged
  } catch (e) {
    alert("There was an error fetching nearby closures");
  }

  const closureResults = await response.json();

  let elements = [];

  if (closureResults.length === 0) {
    let noResultsElement = `<div>No user closures were found for ${street}</div>`;
    elements.push(noResultsElement);
    // $("#results").append(noResultsElement);
  } else {
    for (let closure of closureResults) {
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
      elements.push(closureElement);
    }
  }

  return elements;
}

function errorCallback(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.error("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.error("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.error("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.error("An unknown error occurred.");
      break;
  }
}

let loading = "<div>Loading...</div>";

$("#results").empty();
$("#results").append(loading);

getUserLocation();
