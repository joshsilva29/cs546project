// seed.js
// Wipes the CS546-Project database and repopulates it with sample users and closures via the data layer

import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { usersData, closuresData } from '../data/index.js';

const db = await dbConnection();

await db.dropDatabase();

await usersData.ensureUserIndexes();
await closuresData.ensureClosureIndexes();

// USERS

const john = await usersData.createUser(
  'John',
  'Doe',
  'jdoe@gmail.com',
  'Password1!'
);
const jane = await usersData.createUser(
  'Jane',
  'Smith',
  'jsmith@gmail.com',
  'Password2!'
);
const alex = await usersData.createUser(
  'Alex',
  'Rivera',
  'arivera@gmail.com',
  'Password3!'
);

console.log('Seeded 3 users.');

await usersData.addUserPlace(john._id.toString(), '4 av');
await usersData.addUserPlace(john._id.toString(), '34 st');
await usersData.addUserPlace(jane._id.toString(), '5 av');

console.log('Seeded saved streets.');

// CLOSURES

const userClosure1 = await closuresData.createClosure(
  john._id.toString(),
  '4th',
  '31st',
  '48th',
  '2025-06-14',
  '2026-08-17',
  { latitude: 40.748817, longitude: -73.985428 }, // near Koreatown/Midtown
  false,
  true,
  true
);

const userClosure2 = await closuresData.createClosure(
  alex._id.toString(),
  'Broadway',
  '42nd',
  '47th',
  '2026-01-10',
  null, // still ongoing
  { latitude: 40.758896, longitude: -73.98513 }, // Times Square
  true,
  true,
  false
);

const userClosure3 = await closuresData.createClosure(
  jane._id.toString(),
  '34th',
  '5th',
  '6th',
  '2026-06-01',
  null, // still ongoing
  { latitude: 40.749825, longitude: -73.987964 }, // pinned location, ~0.1mi from userClosure1
  false,
  true,
  false
);

const userClosure4 = await closuresData.createClosure(
  alex._id.toString(),
  '14th',
  '7th',
  '8th',
  '2026-05-20',
  '2026-06-15',
  null, // manual street entry, no pinned location
  true,
  true,
  true
);

console.log('Seeded 4 user-reported closures.');

// CORROBORATIONS

await closuresData.corroborateClosure(userClosure1._id.toString(), john._id.toString());
await closuresData.corroborateClosure(userClosure1._id.toString(), alex._id.toString());

console.log('Seeded corroborations.');

// COMMENTS

await closuresData.addComment(
  userClosure1._id.toString(),
  "Can't get into the Whole Foods on this block right now.",
  john._id.toString()
);
await closuresData.addComment(
  userClosure2._id.toString(),
  'Sidewalk is blocked here too, not just the road.',
  jane._id.toString()
);

console.log('Seeded comments.');

// QUICK CHECKS

// console.log('\n--- quick checks ---');
// console.log(
//   'getClosureDuration(userClosure1):',
//   await closuresData.getClosureDuration(userClosure1._id.toString())
// );
// console.log(
//   'getClosureHistory("34th") count:',
//   (await closuresData.getClosureHistory('34th')).length
// );
// console.log(
//   'getClosuresNearLocation(Midtown, 0.5mi) count:',
//   (await closuresData.getClosuresNearLocation(40.749825, -73.987964, 0.5)).length
// );
// console.log(
//   'getAllClosures() count:',
//   (await closuresData.getAllClosures()).length
// );

console.log('-------------')
console.log('Done seeding.');

await closeConnection();