import { appState } from '../state/appState';
import { toast } from 'react-toastify';

const databases: {
  photoCaptureDb: DB | null;
  blobCaptureDb: DB | null;
} = {
  photoCaptureDb: null,
  blobCaptureDb: null,
};

async function persist() {
  return (
    (await navigator.storage) &&
    navigator.storage.persist &&
    navigator.storage.persist()
  );
}

async function isStoragePersisted() {
  return (
    (await navigator.storage) &&
    navigator.storage.persisted &&
    navigator.storage.persisted()
  );
}
async function enablePersistance() {
  try {
    const isPersisted = await isStoragePersisted();
    if (isPersisted) {
      console.log('Storage is successfully persisted. :)');
    } else {
      console.log(':( Storage is not persisted.');
      console.log('Trying to persist..:');
      if (await persist()) {
        console.log('We successfully turned the storage to be persisted.  :)');
      } else {
        console.log('Failed to make storage persisted :(');
      }
    }
  } catch (e) {
    console.error('enablePersistance: error enabling persistance', e);
  }
}

/**
 * A wrapper for IndexedDB operations.
 * Based on: https://github.com/msandrini/minimal-indexed-db/blob/master/index.js
 * @param {string} dbName - The name of the IndexedDB database.
 * @param {string} [key='id'] - The key path to use for the object store.
 * @returns {Promise<{
 *   getById: (keyToUse: string | number) => Promise<any | undefined>,
 *   getAll: (keyToUse: string | number) => Promise<any[] | undefined>,
 *   put: (entryData: object | object[]) => Promise<string | number>,
 *   add: (entryData: object | object[]) => Promise<string | number>,
 *   deleteEntry: (keyToUse: string | number) => Promise<boolean>,
 *   deleteAll: () => Promise<boolean>,
 *   flush: () => Promise<boolean>,
 *   count: () => Promise<number>
 * }>} A promise that resolves to an object with IndexedDB methods.
 */

class DB {
  private dbName: string;
  private storeName: string;
  private key: string;
  private schema: any;
  private db: IDBDatabase | null;
  public photos: any;

  constructor(dbName: string, key = 'id', schema = {}) {
    this.dbName = dbName;
    this.storeName = `${dbName}_store`;
    this.key = key;
    this.schema = schema;
    this.db = null;
    this.photos = {
      where: (field: string) => ({
        equals: (value: any) => ({
          count: () =>
            this._query('count', true, IDBKeyRange.only(value), field),
        }),
      }),
    };
  }

  async _initialize() {
    return new Promise<DB>((resolve, reject) => {
      const openDBRequest = window.indexedDB.open(this.dbName, 1);

      openDBRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          const store = this.db.createObjectStore(this.storeName, {
            keyPath: this.key,
            autoIncrement: !!this.schema.autoIncrement,
          });

          Object.entries(this.schema.columns).forEach(
            ([columnName, details]: [string, any]) => {
              if (details.queryable) {
                store.createIndex(columnName, columnName, {
                  unique: details.unique,
                });
              }
            }
          );
        }
      };

      openDBRequest.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this);
      };

      openDBRequest.onerror = (event: Event) => {
        reject(new Error((event.target as IDBOpenDBRequest).error?.message));
      };
    });
  }

  static async open(dbName: string, key = 'id', schema = {}) {
    const dbInstance = new DB(dbName, key, schema);
    await dbInstance._initialize();
    return dbInstance;
  }

  _query(
    method: string,
    readOnly: boolean,
    param: any = null,
    indexName: string | null = null
  ) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(
        [this.storeName],
        readOnly ? 'readonly' : 'readwrite'
      );
      const store = transaction.objectStore(this.storeName);
      let request;

      if (indexName) {
        const index = store.index(indexName);
        request = (index as any)[method](param);
      } else {
        request = (store as any)[method](param);
      }

      request.onsuccess = (event: Event) => {
        resolve((event.target as IDBRequest).result);
      };

      request.onerror = (event: Event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  getAll() {
    return this._query('getAll', true);
  }

  getById(key: IDBValidKey) {
    return this._query('get', true, key);
  }

  put(entry: any) {
    return this._query('put', false, entry);
  }

  add(entry: any) {
    return this._query('add', false, entry);
  }

  async bulkAdd(entries: any[]) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return Promise.all(
      entries.map((entry) => {
        return new Promise((resolve, reject) => {
          const request = store.add(entry);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      })
    );
  }

  delete(key: IDBValidKey) {
    return this._query('delete', false, key);
  }

  deleteAll() {
    return this._query('clear', false);
  }

  findByIndex(
    indexName: string,
    value: IDBValidKey | IDBKeyRange
  ): Promise<any[]> {
    return this._query('getAll', true, value, indexName) as Promise<any[]>;
  }

  async getAllByIndex(indexName: string, value: IDBValidKey | IDBKeyRange) {
    return this.findByIndex(indexName, value) as Promise<any[]>;
  }

  count(): Promise<number> {
    return this._query('count', true) as Promise<number>;
  }

  countByIndex(
    indexName: string,
    value: IDBValidKey | IDBKeyRange
  ): Promise<number> {
    return this._query('count', true, value, indexName) as Promise<number>;
  }

  static async getUserByUsername(db: DB, username: string) {
    try {
      const users = await db.findByIndex('username', username);
      return (users as any)[0]; // Assuming username is unique
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  static async testDB() {
    try {
      const userSchema = {
        autoIncrement: true,
        columns: {
          username: { queryable: true, unique: true },
          email: { queryable: true, unique: true },
        },
      };

      const db = await DB.open('UsersDB', 'id', userSchema);

      await db.add({ username: 'jane_doe', email: 'jane@example.com' });

      const user = await this.getUserByUsername(db, 'jane_doe');
      console.log('User:', user);

      await db.add({ username: 'john_doe', email: 'john@example.com' });

      const users = await db.getAll();
      console.log('All users:', users);

      if ((users as any).length > 0) {
        await db.delete((users as any)[0].id);
        console.log('First user deleted');
      }

      const usersAfterDeletion = await db.getAll();
      console.log('All users after deletion:', usersAfterDeletion);
    } catch (error) {
      console.error('Error in testDB:', error);
    }
  }
}

export const initializePhotoCaptureDB = async (recordId?: string) => {
  try {
    await enablePersistance();
    if (!databases.photoCaptureDb) {
      const photoSchema = {
        autoIncrement: true,
        columns: {
          fileName: { queryable: true, unique: true },
          recordId: { queryable: true, unique: false },
          size: { queryable: true, unique: false },
          type: { queryable: true, unique: false },
          lastModified: { queryable: true, unique: false },
          lastModifiedDate: { queryable: true, unique: false },
          webkitRelativePath: { queryable: true, unique: false },
          timestamp: { queryable: true, unique: false },
          sectionName: { queryable: true, unique: false },
          uploaded: { queryable: true, unique: false },
        },
      };

      const blobSchema = {
        autoIncrement: true,
        columns: {
          photoId: { queryable: true, unique: true },
          dataUrl: { queryable: false, unique: false },
        },
      };

      databases.photoCaptureDb = await DB.open(
        'PatterAIPhotos',
        'id',
        photoSchema
      );
      databases.blobCaptureDb = await DB.open(
        'PatterAIBlobs',
        'id',
        blobSchema
      );

      console.log('PhotoCapture DB initialized', databases);
    } else {
      console.log('PhotoCapture DB already initialized', databases);
    }
    return databases.photoCaptureDb;
  } catch (e) {
    console.error('initializePhotoCaptureDB: error initializing photo db', e);
    return null;
  }
};

// // function to bulk add phots by inserting photo then the blob using the photoId
// export const bulkAddPhotos = async (photos: any[]) => {
//   try {
//     const db = await getPhotoDB();
//     if (!db) throw new Error('Failed to get PhotoDB');

//     const photoIds = [];
//     const blobDb = await DB.open('PatterAIBlobs', 'id', {});

//     for (const photo of photos) {
//       try {
//         const existingPhotos = await db.findByIndex('fileName', photo.fileName);
//         if (existingPhotos.length > 0) {
//           console.log('bulkAddPhotos: photo already exists', photo.fileName);
//           photo.fileName = photo.fileName.replace(
//             '.jpg',
//             '_' + Date.now() + '.jpg'
//           );
//         }

//         const dataUrl = `${photo.dataUrl}`;
//         delete photo.dataUrl;
//         const photoId = await db.add(photo);

//         await blobDb.add({
//           photoId: photoId,
//           dataUrl: dataUrl,
//         });

//         photoIds.push(photoId);
//       } catch (e) {
//         console.error('bulkAddPhotos: error adding photo', e);
//       }
//     }
//     return photoIds;
//   } catch (e) {
//     console.error('bulkAddPhotos: error adding photos', e);
//     return [];
//   }
// };

// get blob for a photo using the photoId
export const getBlobForPhoto = async (photoId: any) => {
  try {
    const blobDb = await DB.open('PatterAIBlobs', 'id', {});
    const blob = await blobDb.findByIndex('photoId', photoId);
    console.log('getBlobForPhoto: blob', blob);
    if (blob && blob.length > 0) {
      return blob[0].dataUrl;
    }
    console.warn(`No blob found for photo with id ${photoId}`);
    return null;
  } catch (e) {
    console.error('getBlobForPhoto: error getting blob for photo', e);
    throw e; // Rethrow the error to be caught in the calling function
  }
};

// // update a photo as uploaded
// export const updatePhotoAsUploaded = async (photoId: any) => {
//   try {
//     const db = await getPhotoDB();
//     const photo = await (db as any).getById(photoId);
//     (photo as any).uploaded = true;
//     console.log('updatePhotoAsUploaded: updating photo', photoId, photo);
//     await db?.put(photo);
//     return true;
//   } catch (e) {
//     console.error('updatePhotoAsUploaded: error updating photo', e);
//     return false;
//   }
// };

export async function getPhotoDB(recordId?: string) {
  try {
    if (!databases.photoCaptureDb) {
      await initializePhotoCaptureDB(recordId);
    }
    return databases.photoCaptureDb;
  } catch (e) {
    console.error('getPhotoDB: error getting photo db', e);
    return null;
  }
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MAX_IMAGE_SIZE = 1024; // Maximum width/height in pixels

export const sanitizeBytesToMBAndGB = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${bytes / 1024} KB`;
  }
  return `${bytes / (1024 * 1024)} MB`;
};

export const sanitizeName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

export const generateUniqueFileName = (
  sectionName: string,
  originalFileName: string
) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.]/g, '_');
  const extension = sanitizedFileName.split('.').pop();
  return `${sectionName}-${sanitizedFileName}-${timestamp}-${randomString}.${extension}`;
};

export const bulkAddPhotos = async (processedFilesData: any[]) => {
  const db = await getPhotoDB();
  if (!db) {
    console.error('Failed to get photo database');
    return;
  }

  const blobDb = await DB.open('PatterAIBlobs', 'id', {});

  for (const fileData of processedFilesData) {
    try {
      const uniqueFileName = generateUniqueFileName(
        fileData.sectionName,
        fileData.fileName
      );

      // Store the photo metadata in the main photo database
      const photoId = await db.add({
        ...fileData,
        fileName: uniqueFileName,
        uploaded: false,
        dataUrl: null, // Don't store dataUrl in the main photo database
      });

      // Store the dataUrl in the blob database
      const blobId = await blobDb.add({
        photoId: photoId,
        dataUrl: fileData.dataUrl,
      });

      console.log(
        `Photo ${uniqueFileName} added successfully with ID: ${photoId}`
      );
      console.log(`Blob added successfully with ID: ${blobId}`);
    } catch (error) {
      console.error('Error adding photo to database:', error);
      toast.error(
        `Failed to add photo ${fileData.fileName}. Please try again.`
      );
    }
  }
};

export const getAWSPathForPhoto = async (photo: any) => {
  const fileName = photo.fileName || photo.title;
  const opportunityDetails = appState.opportunityDetails.get();
  const recordId = appState.recordId.get();
  return `https://${opportunityDetails.photosBucket}.amazonaws.com/${opportunityDetails.territory}/${opportunityDetails.state}/${recordId}/${fileName}`;
};

export const generateUniqueFileId = (file: any) => {
  return `${file.sectionName}-${file.fileName || file.title}-${Date.now()}`;
};

export const getAllStoredFiles = async () => {
  try {
    const db = await getPhotoDB();
    const blobDb = await DB.open('PatterAIBlobs', 'id', {});
    if (db) {
      const files = await db.findByIndex('recordId', appState.recordId.get());
      const filesWithDataUrl = await Promise.all(
        files.map(async (file: any) => {
          const blob = await blobDb.findByIndex('photoId', file.id);
          return {
            ...file,
            awsPath: await getAWSPathForPhoto(file),
            dataUrl: blob && blob.length > 0 ? blob[0].dataUrl : null,
            uniqueId: generateUniqueFileId(file),
          };
        })
      );
      return filesWithDataUrl;
    }
    return [];
  } catch (error) {
    console.error('Error getting stored files:', error);
    return [];
  }
};

export const uploadFile = async (
  fileRecord: any,
  uploadFilesToSalesforce: (params: any) => Promise<any>
) => {
  const recordId = appState.recordId.get();
  if (!recordId) {
    throw new Error('No recordId found for uploading file');
  }
  try {
    const db = await getPhotoDB();
    if (!db) {
      throw new Error('Failed to get photo database');
    }

    const photo = await db.getById(fileRecord.id);
    if (!photo) {
      throw new Error(`No photo found with id ${fileRecord.id}`);
    }

    // @ts-ignore
    const blob = photo.dataUrl || (await getBlobForPhoto(fileRecord.id));
    if (!blob) {
      throw new Error(`No data found for photo ${fileRecord.fileName}`);
    }

    let resizedDataUrl = await resizeImage(blob);
    resizedDataUrl = resizedDataUrl.replace(
      /^data:image\/(png|jpeg);base64,/,
      ''
    );

    if (resizedDataUrl.length > MAX_FILE_SIZE) {
      throw new Error(
        `File ${
          fileRecord.fileName
        } is too large. Max file size is ${sanitizeBytesToMBAndGB(
          MAX_FILE_SIZE
        )}`
      );
    }

    const response = await uploadFilesToSalesforce(
      {
        dataUrl: resizedDataUrl,
        fileName: fileRecord.fileName,
        recordId: recordId,
        sectionName: fileRecord.sectionName,
      },
      // (progress) => {
      //   updateFileUploadProgress(fileRecord.uniqueId, progress);
      // }
    );

    console.log('uploadFile response', response);

    if (fileRecord.id) {
      await updatePhotoAsUploaded(fileRecord.id);
    }

    return response;
  } catch (error) {
    console.error(`Failed to upload photo ${fileRecord.fileName}:`, error);
    throw error;
  }
};

export const updatePhotoAsUploaded = async (photoId: string) => {
  const db = await getPhotoDB();
  if (db) {
    const photo = await db.getById(photoId);
    if (photo) {
      await db.put({ ...photo, uploaded: true });
    }
  }
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      console.log(`File read successfully: ${file.name}`);
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error(`Error reading file ${file.name}:`, error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

export const resizeImage = (input: string | File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement) => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_IMAGE_SIZE) {
          height *= MAX_IMAGE_SIZE / width;
          width = MAX_IMAGE_SIZE;
        }
      } else {
        if (height > MAX_IMAGE_SIZE) {
          width *= MAX_IMAGE_SIZE / height;
          height = MAX_IMAGE_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      console.log('Resized image size:', resizedBase64.length);
      resolve(resizedBase64);
    };

    if (input instanceof File || input instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(input);
    } else if (typeof input === 'string' && input.startsWith('data:')) {
      const img = new Image();
      img.onload = () => processImage(img);
      img.onerror = reject;
      img.src = input;
    } else {
      reject(
        new Error('Invalid input type. Expected File, Blob, or data URL.')
      );
    }
  });
};
