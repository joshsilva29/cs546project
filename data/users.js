// data/users.js
// users data layer, feel free to let me know what changes are made and write down your changes for
// a possible changelog doc i can make so everyones on the same page.
//
// potential to mix in with closures data layer right now but lets see what happens
//
//


import { userCollection } from '../config/mongoCollections.js';
import { checkString, checkEmail, checkId } from '../helpers.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';


// bcrypt salt rounds for hashing passwords and we can change to make secure and/or fast enough for our project
const SALT_ROUNDS = 10;


export const ensureUserIndexes = async () => {
 
  // database has rule where no two users share an email.
  // once at startup goes to MongoDB and skips creation if index exists.
 
  const users = await userCollection();
  await users.createIndex({ email: 1 }, { unique: true });
};

export const createUser = async (first_name, last_name, email, password) => {
  first_name = checkString(first_name, 'first_name');
  last_name = checkString(last_name, 'last_name');
  email = checkEmail(email);
  password = checkString(password, 'password');

  const users = await userCollection();

  const existing = await users.findOne({ email });
  if (existing) throw new Error('A user with that email already exists.');

  const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = {
    _id: uuid(),
    first_name,
    last_name,
    email,
    hashed_password,
    user_places: [] // used later in addUserPlace
  };

  const insertInfo = await users.insertOne(newUser);
  if (!insertInfo.acknowledged) throw new Error('Could not create user.');

  return await getUserById(newUser._id);
};

export const getUserById = async (id) => {
  id = checkId(id, 'user id');
  const users = await userCollection();
  const user = await users.findOne(
    { _id: id },
    { projection: { hashed_password: 0 } } // does not leak password hash
  );
  if (!user) throw new Error('No user found with that id.');
  return user;
};

export const getAllUsers = async () => {
  const users = await userCollection();
  return await users.find({}, { projection: { hashed_password: 0 } }).toArray();
};

export const getUserPlaces = async (id) => {
  const user = await getUserById(id);
  return user.user_places;
};

export const addUserPlace = async (id, street) => {
  id = checkId(id, 'user id');
  street = checkString(street, 'street');
  const users = await userCollection();
  const updateInfo = await users.updateOne(
    { _id: id },
    { $addToSet: { user_places: street } } // $addToSet avoids duplicate streets
  );
  if (updateInfo.matchedCount === 0) throw new Error('No user found with that id.');
  return await getUserById(id);
};

export const removeUserPlace = async (id, street) => {
  id = checkId(id, 'user id');
  street = checkString(street, 'street');
  const users = await userCollection();
  const updateInfo = await users.updateOne(
    { _id: id },
    { $pull: { user_places: street } }
  );
  if (updateInfo.matchedCount === 0) throw new Error('No user found with that id.');
  return await getUserById(id);
};
