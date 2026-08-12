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


function successCallback(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = position.coords.accuracy; 

  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  console.log(`Accurate within ${accuracy} meters.`);

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

getUserLocation();