import {dbConnection} from './mongoConnection.js';

const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

// collection list below
export const userCollection = getCollectionFn('users');
export const closureCollection = getCollectionFn('closures');

// commentsCollection is unnecessary if comments is a subdocument under closures 
// export const commentCollection = getCollectionFn('comments');