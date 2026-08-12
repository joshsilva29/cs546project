
$("#login-form").submit((event) => {
    event.preventDefault();
    let email = $("#email").val();
    let password = $("#password").val();
    try {
        email = checkEmail(email);
        password = checkString(password, "Password");
        event.currentTarget.submit();
    } catch (e) {
        $("#server-error").hide(); //if there is still a previous server-error showing
        $("#client-error").text("Either the email or password is invalid");
        $("#client-error").show();
    }
});

$("#signup-form").submit((event) => {
    event.preventDefault();
    let firstName = $("#first_name").val();
    let lastName = $("#last_name").val();
    let email = $("#email").val();
    let password = $("#password").val();
    try {
        firstName = checkString(firstName, "First Name");
        lastName = checkString(lastName, "Last Name");
        email = checkEmail(email);
        password = checkString(password, "Password");
        event.currentTarget.submit();
    } catch (e) {
        $("#server-error").hide(); //if there is still a previous server-error showing
        $("#client-error").text(e);
        $("#client-error").show();
    }
});


// functions from helpers.js (minus checkId)

const checkString = (str, name = 'input') => {
  if (str === undefined || str === null) throw `${name} must be provided.`;
  if (typeof str !== 'string') throw `${name} must be a string.`;
  const trimmed = str.trim();
  if (trimmed.length === 0) throw `${name} cannot be empty or just spaces.`;
  return trimmed;
};

const checkEmail = (email) => {
  const cleaned = checkString(email, 'Email').toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) throw 'email is not a valid email address.';
  return cleaned;
};

const checkStreet = (street) => checkString(street, 'street');

const checkBool = (val, name = 'boolean') => {
  if (typeof val !== 'boolean') throw `${name} must be true or false.`;
  return val;
};

const checkNumber = (num, name = 'number') => {
  if (typeof num !== 'number' || Number.isNaN(num)) throw `${name} must be a valid number.`;
  return num;
};

const checkDate = (dateStr, name = 'date') => {
  const cleaned = checkString(dateStr, name);
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) throw `${name} is not a valid date.`;
  return parsed;
};

const checkCoordinates = (latitude, longitude) => {
  const lat = checkNumber(latitude, 'latitude');
  const long = checkNumber(longitude, 'longitude');
  if (lat < -90 || lat > 90) throw 'latitude must be between -90 and 90.';
  if (long < -180 || long > 180) throw 'longitude must be between -180 and 180.';
  return { latitude: lat, longitude: long };
};

const checkNycCoordinates = (latitude, longitude) => {
  // runs a global check and then confirm the point is within NYC's, might be an easier way to make this faster but good for now
  // a bounding box of the five boroughs which is still a bounding box
  
  const { latitude: lat, longitude: long } = checkCoordinates(latitude, longitude);
  if (lat < 40.4774 || lat > 40.9176 || long < -74.2591 || long > -73.7004) {
    throw 'coordinates must be within New York City.';
  }
  return { latitude: lat, longitude: long };
};

const checkLatitude = (lat) => {
  checkNumber(lat, 'latitude');
  if (lat < -90 || lat > 90) throw 'Error: latitude must be between -90 and 90.';
  return lat;
};

const checkLongitude = (lng) => {
  checkNumber(lng, 'longitude');
  if (lng < -180 || lng > 180) throw 'Error: longitude must be between -180 and 180.';
  return lng;
};

const checkBoolean = (bool, varName) => {
  if (typeof bool !== 'boolean') throw `Error: ${varName} must be a boolean.`;
  return bool;
};

const checkDateString = (dateStr, varName) => {
  dateStr = checkString(dateStr, varName);
  if (Number.isNaN(Date.parse(dateStr))) {
    throw `Error: ${varName} must be a valid date string (e.g. "2026-06-14").`;
  }
  return dateStr;
};

const checkSource = (source) => {
  source = checkString(source, 'source');
  if (source !== 'official' && source !== 'user') {
    throw 'Error: source must be either "official" or "user".';
  }
  return source;
};