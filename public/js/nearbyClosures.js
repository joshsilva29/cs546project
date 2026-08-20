let userLatitude;
let userLongitude; 

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

  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;

  await searchNearbyClosures();
}

async function searchNearbyClosures() {

  const distance = Number($("#distance").val());

  if (!distance || distance <= 0) {
    alert("Please enter a valid distance.");
    return;
  }

  $("#results").empty();
  $("#results").append("<div>Loading...</div>");

  const elements = [];

  try {
    const nearbyUserClosures = await nearByClosureSearch(
      userLatitude,
      userLongitude,
      distance
    );

    if (nearbyUserClosures)
      elements.push(...nearbyUserClosures);
  } catch (e) {
    // console.error(e);
  }

  try {
    const nearbyNYCClosures = await nearByNYCClosureSearch(
      userLatitude,
      userLongitude,
      distance
    );

    if (nearbyNYCClosures)
      elements.push(...nearbyNYCClosures);
  } catch (e) {
    // console.error(e);
  }

  console.log(elements.length);
  if (elements.length === 0) {
    let noResultsElement = `<div>No nearby closures were found</div>`;
    elements.push(noResultsElement);
  }

  $("#results").empty();

  for (let element of elements) {
    $("#results").append(element);
  }
}

// search from mongodb database
async function nearByClosureSearch(latitude, longitude, distance) {
  let response;

  try {
    response = await fetch(
      `/closures/nearYou?latitude=${latitude}&longitude=${longitude}&maxDistanceMiles=${distance}`
    );
  } catch (e) {
    return [];
  }

  const closureResults = await response.json();

  let elements = [];

  if (closureResults.length === 0) {
    // let noResultsElement = `<div>No nearby closures were found</div>`;
    // elements.push(noResultsElement);

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
async function nearByNYCClosureSearch(latitude, longitude, distance) {
  let response; 
  try {
    response = await fetch(
      `/closureNearYou?lat=${latitude}&lon=${longitude}&miles=${distance}`
    );
  } catch (e) {
    return [];
  }

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
                <a href="/nycClosureDetail/${encodeURIComponent(closure.oftcode)}/${encodeURIComponent(closure.startDate.slice(0, -1))}/${encodeURIComponent(closure.endDate.slice(0, -1))}" class="closure-element">
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

$("#search-button").on("click", function () {
  searchNearbyClosures();
});

getUserLocation();