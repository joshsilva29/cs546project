// data/index.js
// Single import surface for every data layer.potentially that we can work on
// Routes import from here so adding a new layer is like a one line code change
// 
// 
// feel free to use or add another index file ofcourse, would like to index emails or user ids or usernames 
// so we do not duplicate data twice!!
//
//

import * as usersData from './users.js';
import * as closuresData from './closures.js';

export { usersData };
export { closuresData };