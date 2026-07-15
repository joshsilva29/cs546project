// helpers.js
//
// Shares input validation reused in every data function(hopefully)
// Each validator throws a plain Error on bad input or it returns a cleaned value on success
// 
// this is a rough start but hopefully gets the point across!! please let me know of any changes or
// any improvements/data functions or types that are being added so everyones on the same page!
//
//

import { ObjectId } from 'mongodb';

export const checkString = (str, name = 'input') => {
  if (str === undefined || str === null) throw `${name} must be provided.`;
  if (typeof str !== 'string') throw `${name} must be a string.`;
  const trimmed = str.trim();
  if (trimmed.length === 0) throw `${name} cannot be empty or just spaces.`;
  return trimmed;
};

export const checkId = (id, name = 'id') => {
  // _id values string UUIDs not Mongo ObjectIds for now but we can change this later
  if (!ObjectId.isValid(id)) throw 'id must be a valid object id';
  return checkString(id, name);
};

export const checkEmail = (email) => {
  const cleaned = checkString(email, 'email').toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) throw 'email is not a valid email address.';
  return cleaned;
};

export const checkStreet = (street) => checkString(street, 'street');

export const checkBool = (val, name = 'boolean') => {
  if (typeof val !== 'boolean') throw `${name} must be true or false.`;
  return val;
};

export const checkNumber = (num, name = 'number') => {
  if (typeof num !== 'number' || Number.isNaN(num)) throw `${name} must be a valid number.`;
  return num;
};

export const checkDate = (dateStr, name = 'date') => {
  const cleaned = checkString(dateStr, name);
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) throw `${name} is not a valid date.`;
  return parsed;
};

export const checkCoordinates = (latitude, longitude) => {
  const lat = checkNumber(latitude, 'latitude');
  const long = checkNumber(longitude, 'longitude');
  if (lat < -90 || lat > 90) throw 'latitude must be between -90 and 90.';
  if (long < -180 || long > 180) throw 'longitude must be between -180 and 180.';
  return { latitude: lat, longitude: long };
};

export const checkNycCoordinates = (latitude, longitude) => {
  // runs a global check and then confirm the point is within NYC's, might be an easier way to make this faster but good for now
  // a bounding box of the five boroughs which is still a bounding box
  
  const { latitude: lat, longitude: long } = checkCoordinates(latitude, longitude);
  if (lat < 40.4774 || lat > 40.9176 || long < -74.2591 || long > -73.7004) {
    throw 'coordinates must be within New York City.';
  }
  return { latitude: lat, longitude: long };
};
