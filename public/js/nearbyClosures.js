function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
} 

function isDatePast(dateString) {
  const date = new Date(dateString);
  return date < new Date();
}

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
  // let latitude = 40.7128; // new york city coords for testing
  // let longitude = -74.0060;
  const accuracy = position.coords.accuracy; 

  const elements = [];

  let nearbyUserClosures, nearbyNYCClosures = [];
  try {
    nearbyUserClosures = await nearByClosureSearch(latitude, longitude);
  } catch (e) {
    alert("There was an error fetching nearby closures");
    console.log(e);
  }
  
  try {
    nearbyNYCClosures = await nearByNYCClosureSearch(latitude, longitude);
  } catch (e) {
    alert("There was an error fetching nearby NYC database closures");
    console.log(e);
  }
   
  elements.push(nearbyUserClosures);
  elements.push(nearbyNYCClosures)


  $("#results").empty(); //remove loading
  for (let element of elements) {
    $("#results").append(element);
  }
}

// search from mongodb database
async function nearByClosureSearch(latitude, longitude) {

  const response = await fetch(`/closures/nearYou?latitude=${latitude}&longitude=${longitude}&maxDistanceMiles=10`);

  const closureResults = await response.json();

  let elements = [];

  if (closureResults.length === 0) {
    let noResultsElement = `<div>No nearby closures were found</div>`;
    elements.push(noResultsElement);

  } else {
    for (let closure of closureResults) {
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

// from NYC data
async function nearByNYCClosureSearch(latitude, longitude) {
  const response = await fetch(`/closureNearYou?lat=${latitude}&lon=${longitude}`); 

  const closureResults = await response.json();

  let elements = [];

  if (closureResults.results) {
    let seen = new Set();
    for (let closure of closureResults.results) {

      let oftCode = closure.oftcode; //since query returns closures with duplicate oftcodes
      if (seen.has(oftCode)) {
        continue;
      } else {
        seen.add(oftCode);
      }

      let onStreet = closure.street;
      let toStreet = closure.toStreet || "";
      let fromStreet = toStreet ? `${closure.fromStreet} to` : closure.fromStreet;
      let closureElement = `
                <a href="/nycClosureDetail/${encodeURIComponent(closure.oftcode)}" class="closure-element">
                    <p>${onStreet}</p>
                    <p>From ${fromStreet}</p>
                </a>
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
