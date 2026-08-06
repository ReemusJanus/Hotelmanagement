import * as Minio from 'minio';

export const bucket = process.env.MINIO_BUCKET || 'food-images';
export const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'knockout',
  secretKey: process.env.MINIO_SECRET_KEY || 'knockout_secret'
});

export async function initializeStorage() {
  if (!await minio.bucketExists(bucket)) await minio.makeBucket(bucket);
  await minio.setBucketPolicy(bucket, JSON.stringify({Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{AWS:['*']},Action:['s3:GetObject'],Resource:[`arn:aws:s3:::${bucket}/*`]}]}));
}

export function publicUrl(objectName) {
  return `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${bucket}/${objectName}`;
}
