// public/js/reportClosure.js
// Client-side validation + "use my current location" for the report form.
// This mirrors the server rules in routes/navigation.js -- the server never
// trusts the client, this is just a faster first pass for the user.

(function () {
  // same NYC bounding box as helpers.js checkNycCoordinates
  const NYC = { latMin: 40.4774, latMax: 40.9176, lonMin: -74.2591, lonMax: -73.7004 };

  const checkString = (str, name) => {
    if (str === undefined || str === null) throw `${name} must be provided.`;
    if (typeof str !== 'string') throw `${name} must be a string.`;
    const trimmed = str.trim();
    if (trimmed.length === 0) throw `${name} cannot be empty or just spaces.`;
    return trimmed;
  };

  function collectErrors() {
    const errors = [];
    let onStreet, fromStreet, toStreet;

    try { onStreet = checkString($('#on_street_name').val(), 'Current street'); }
    catch (e) { errors.push(e); }
    try { fromStreet = checkString($('#from_street_name').val(), 'From street'); }
    catch (e) { errors.push(e); }
    try { toStreet = checkString($('#to_street_name').val(), 'To street'); }
    catch (e) { errors.push(e); }

    if (fromStreet && toStreet &&
        fromStreet.toLowerCase() === toStreet.toLowerCase()) {
      errors.push('From street and To street must be different.');
    }

    const endDate = $('#work_end_date').val();
    if (endDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (Number.isNaN(Date.parse(endDate))) {
        errors.push('Expected end date is not a valid date.');
      } else if (endDate < today) {
        errors.push('Expected end date cannot be in the past.');
      }
    }

    const anyChecked =
      $('#affects_sidewalk').is(':checked') ||
      $('#affects_roads').is(':checked') ||
      $('#affects_bike_lanes').is(':checked');
    if (!anyChecked) {
      errors.push('Select at least one thing the closure affects (sidewalk, roads, or bike lanes).');
    }

    return errors;
  }

  $('#report_closure_form').submit(function (event) {
    const errors = collectErrors();
    const errorBox = $('#client-error');
    if (errors.length > 0) {
      event.preventDefault();
      errorBox.empty();
      const list = $('<ul>');
      for (const err of errors) {
        list.append($('<li>').text(err)); // .text() so nothing is injected as HTML
      }
      errorBox.append(list);
      errorBox.prop('hidden', false);
    } else {
      errorBox.prop('hidden', true);
    }
  });

  // GEOLOCATION -------------------------------------------------------------

  function setLocationStatus(text, isError) {
    $('#location_status')
      .text(text)
      .toggleClass('location-error', Boolean(isError));
  }

  function clearLocation() {
    $('#latitude').val('');
    $('#longitude').val('');
    $('#clear_location_button').prop('hidden', true);
  }

  $('#use_location_button').on('click', function () {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.', true);
      return;
    }
    setLocationStatus('Getting your location...', false);

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (lat < NYC.latMin || lat > NYC.latMax || lon < NYC.lonMin || lon > NYC.lonMax) {
          clearLocation();
          setLocationStatus('Your current location appears to be outside New York City, so it was not attached.', true);
          return;
        }

        $('#latitude').val(lat);
        $('#longitude').val(lon);
        $('#clear_location_button').prop('hidden', false);
        setLocationStatus(`Location attached (${lat.toFixed(5)}, ${lon.toFixed(5)})`, false);
      },
      function (error) {
        clearLocation();
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('Location permission denied. You can still submit without a location.', true);
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('Getting your location timed out. You can still submit without a location.', true);
        } else {
          setLocationStatus('Your location is unavailable. You can still submit without a location.', true);
        }
      },
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
    );
  });

  $('#clear_location_button').on('click', function () {
    clearLocation();
    setLocationStatus('Location removed.', false);
  });

  // if the server re-rendered the form with a location already attached, show it
  if ($('#latitude').val() && $('#longitude').val()) {
    $('#clear_location_button').prop('hidden', false);
    setLocationStatus(`Location attached (${$('#latitude').val()}, ${$('#longitude').val()})`, false);
  }
})();
