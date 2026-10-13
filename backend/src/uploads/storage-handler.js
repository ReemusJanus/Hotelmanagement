import crypto from 'node:crypto';
import {
  putImage as storagePutImage,
  copyImage as storageCopyImage,
  putReport as storagePutReport,
  minio,
  bucket,
  storageProvider,
  storagePrefix
} from '../storage.js';

/**
 * Upload an image buffer for a specific hotel/owner
 */
export async function uploadImage({ owner = 'knockout', subfolder = 'images', buffer, size, mimetype, filename = 'image' }) {
  const ext = filename.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const objectPath = `${subfolder}/${crypto.randomUUID()}.${ext}`;
  return storagePutImage(owner, objectPath, buffer, size, mimetype);
}

/**
 * Remove an object from MinIO / S3 storage safely
 */
export async function removeStorageObject(objectName) {
  if (!objectName) return;
  try {
    await minio.removeObject(bucket, objectName);
  } catch (err) {
    console.warn(`[storage] Could not delete object ${objectName}:`, err.message);
  }
}

export {
  storagePutImage as putImage,
  storageCopyImage as copyImage,
  storagePutReport as putReport,
  minio,
  bucket,
  storageProvider,
  storagePrefix
};
