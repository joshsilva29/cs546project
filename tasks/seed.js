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
const bob = await usersData.createUser(
  'Bob',
  'Smith',
  'bobsmith@yahoo.com',
  'Password4!'
);
const jerry = await usersData.createUser(
  'Jerry',
  'Stevens',
  'jerrystevens@gmail.com',
  'Password5!'
);
const josh = await usersData.createUser(
  'Josh',
  'Silva',
  'joshsilva@gmail.com',
  'Password6!'
);
const jeffrey = await usersData.createUser(
  'Jeffrey',
  'Kersh',
  'jeffreykersh789@gmail.com',
  'Password7!'
);
const aaron = await usersData.createUser(
  'Aaron',
  'Shieh',
  'aaronshieh789@gmail.com',
  'Password8!'
);
const carlos = await usersData.createUser(
  'Carlos',
  'Orta',
  'carlosorta789@gmail.com',
  'Password9!'
);
const samuel = await usersData.createUser(
  'Samuel',
  'Malwal',
  'samuelmalwal789@gmail.com',
  'Password10!'
);
const paul = await usersData.createUser(
  'Paul',
  'McCartney',
  'paulmccartney@gmail.com',
  'Password11!'
);
const rebecca = await usersData.createUser(
  'Rebecca',
  'Park',
  'rebeccapark@gmail.com',
  'Password12!'
);

console.log('Seeded 12 users.');

await usersData.addUserPlace(john._id.toString(), '4 av');
await usersData.addUserPlace(john._id.toString(), '34 st');
await usersData.addUserPlace(jane._id.toString(), '5 av');
await usersData.addUserPlace(josh._id.toString(), '14');
await usersData.addUserPlace(josh._id.toString(), 'w 18');
await usersData.addUserPlace(josh._id.toString(), 'broadway');
await usersData.addUserPlace(alex._id.toString(), 'broadway');

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
  '2026-07-20',
  null, //still ongoing
  null, // manual street entry, no pinned location
  true,
  true,
  true
);

//

//by bryant park
const userClosure5 = await closuresData.createClosure(
  josh._id.toString(),
  'W 18th',
  '5th Avenue',
  '7th Avenue',
  '2026-07-22',
  null, //still ongoing
  {latitude: 40.752593, longitude: -73.981586}, // manual street entry, no pinned location
  false,
  true,
  true
);

const userClosure6 = await closuresData.createClosure(
  samuel._id.toString(),
  '5th Ave',
  'E 21st St',
  'E 20th St',
  '2026-05-20',
  '2026-08-15',
  {latitude: 40.739792, longitude: -73.990844}, // manual street entry, no pinned location
  true,
  true,
  false
);

const userClosure7 = await closuresData.createClosure(
  carlos._id.toString(),
  '6th Ave',
  'W 33rd St',
  'W 36th St',
  '2026-06-20',
  '2026-07-21',
  {latitude: 40.750191, longitude: -73.987462}, // manual street entry, no pinned location
  true,
  false,
  true
);

const userClosure8 = await closuresData.createClosure(
  aaron._id.toString(),
  'Broadway',
  'W 4th St',
  'Waverly Pl',
  '2026-08-10',
  null,
  {latitude: 40.728741, longitude: -73.993963},
  true,
  false,
  true
);

const userClosure9 = await closuresData.createClosure(
  rebecca._id.toString(),
  'Stanton St',
  'Norfolk St',
  'Clinton St',
  '2026-08-16',
  null,
  null, // manual street entry, no pinned location
  true,
  false,
  true
);

const userClosure10 = await closuresData.createClosure(
  jeffrey._id.toString(),
  'Ludow St',
  'Canal St',
  'Broome St',
  '2026-07-16',
  null,
  {latitude: 40.715549, longitude: 73.990741},
  true,
  false,
  false
);

const userClosure11 = await closuresData.createClosure(
  alex._id.toString(),
  'Desbrosses St',
  'Washington St',
  'Greenwich St',
  '2026-08-01',
  null,
  {latitude: 40.723486, longitude: -74.009967},
  true,
  true,
  true
);

const userClosure12 = await closuresData.createClosure(
  rebecca._id.toString(),
  'E 46 St',
  'Madison Ave',
  'Vanderbilt Ave',
  '2026-08-04',
  null,
  {latitude: 40.755143, longitude: -73.976912},
  true,
  false,
  false
);

const userClosure13 = await closuresData.createClosure(
  bob._id.toString(),
  'E 46 St',
  'Madison Ave',
  'Vanderbilt Ave',
  '2026-08-04',
  null,
  {latitude: 40.755143, longitude: -73.976912},
  true,
  false,
  false
);

const userClosure14 = await closuresData.createClosure(
  carlos._id.toString(),
  'Broadway',
  'W 75th St',
  'W 76 St',
  '2026-08-04',
  '2026-08-10',
  {latitude: 40.781404, longitude: -73.981103},
  true,
  false,
  false
);

//financial district
const userClosure15 = await closuresData.createClosure(
  carlos._id.toString(),
  'Fulton St',
  'Dutch St',
  'William St',
  '2026-07-28',
  null,
  {latitude: 40.709746, longitude: -74.006757},
  true,
  false,
  true
);


console.log('Seeded user-reported closures.');

// CORROBORATIONS

await closuresData.corroborateClosure(userClosure1._id.toString(), john._id.toString());
await closuresData.corroborateClosure(userClosure1._id.toString(), alex._id.toString());
await closuresData.corroborateClosure(userClosure1._id.toString(), john._id.toString());
await closuresData.corroborateClosure(userClosure12._id.toString(), josh._id.toString());
await closuresData.corroborateClosure(userClosure12._id.toString(), carlos._id.toString());
await closuresData.corroborateClosure(userClosure1._id.toString(), alex._id.toString());

console.log('Seeded corroborations.');

// COMMENTS

await closuresData.addComment(
  userClosure1._id.toString(),
  "Can't get into the Whole Foods on this block right now.",
  john._id.toString()
);
await closuresData.addComment(
  userClosure1._id.toString(),
  "there's another whole foods down the street if u can't get through",
  jane._id.toString()
);
await closuresData.addComment(
  userClosure2._id.toString(),
  'Sidewalk is blocked here too, not just the road.',
  samuel._id.toString()
);
await closuresData.addComment(
  userClosure2._id.toString(),
  'Construction is pretty loud here.',
  josh._id.toString()
);
await closuresData.addComment(
  userClosure3._id.toString(),
  'The front entrance of Target is blocked. Have to enter the other way.',
  aaron._id.toString()
);
await closuresData.addComment(
  userClosure4._id.toString(),
  'construction starts everyday at 5 am.',
  josh._id.toString()
);
await closuresData.addComment(
  userClosure5._id.toString(),
  'Construction affects the bike lane a bit. Roads are clear, though',
  carlos._id.toString()
);
await closuresData.addComment(
  userClosure5._id.toString(),
  'Bike lane blocked.',
  samuel._id.toString()
);
await closuresData.addComment(
  userClosure5._id.toString(),
  'even louder than it usually is without the construction',
  paul._id.toString()
);
await closuresData.addComment(
  userClosure6._id.toString(),
  'Bike lane is open, thankfully!',
  alex._id.toString()
);
await closuresData.addComment(
  userClosure7._id.toString(),
  'road is kinda blocked also...',
  rebecca._id.toString()
);
await closuresData.addComment(
  userClosure8._id.toString(),
  'You can walk around some of the construction on the sidewalk. Just kinda annoying.',
  jerry._id.toString()
);
await closuresData.addComment(
  userClosure10._id.toString(),
  'sidewalk barely obstructed.',
  jane._id.toString()
);
await closuresData.addComment(
  userClosure10._id.toString(),
  'Talked to the workers, and they said the construction should be done soon',
  alex._id.toString()
);
await closuresData.addComment(
  userClosure11._id.toString(),
  'Really loud!',
  jeffrey._id.toString()
);
await closuresData.addComment(
  userClosure11._id.toString(),
  'I live in the area. Noise peaks around noon.',
  carlos._id.toString()
);
await closuresData.addComment(
  userClosure12._id.toString(),
  'sidewalk completely closed. plan accordingly',
  paul._id.toString()
);
await closuresData.addComment(
  userClosure12._id.toString(),
  'Yeah, sidewalk is fully blocked off.',
  josh._id.toString()
);
await closuresData.addComment(
  userClosure12._id.toString(),
  'Heard that construction will only last another week',
  bob._id.toString()
);
await closuresData.addComment(
  userClosure13._id.toString(),
  'construction ends by 1 pm. sidewalk still closed tho',
  aaron._id.toString()
);
await closuresData.addComment(
  userClosure14._id.toString(),
  "You can walk around the construction. Sidewalk isn't that obstructed",
  carlos._id.toString()
);
await closuresData.addComment(
  userClosure15._id.toString(),
  "Construction only takes place in the morning.",
  alex._id.toString()
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