import * as Minio from 'minio';

const provider=String(process.env.STORAGE_PROVIDER||'minio').toLowerCase(),s3=provider==='s3';
export const bucket=process.env.STORAGE_BUCKET||process.env.S3_BUCKET||process.env.MINIO_BUCKET||'knockout-assets';
export const minio=new Minio.Client({
  endPoint:s3?(process.env.S3_ENDPOINT||'s3.amazonaws.com'):(process.env.MINIO_ENDPOINT||'127.0.0.1'),
  port:Number(s3?(process.env.S3_PORT||443):(process.env.MINIO_PORT||9000)),
  useSSL:s3?process.env.S3_SSL!=='false':process.env.MINIO_SSL==='true',
  accessKey:s3?(process.env.S3_ACCESS_KEY_ID||process.env.AWS_ACCESS_KEY_ID||''):(process.env.MINIO_ACCESS_KEY||'knockout'),
  secretKey:s3?(process.env.S3_SECRET_ACCESS_KEY||process.env.AWS_SECRET_ACCESS_KEY||''):(process.env.MINIO_SECRET_KEY||'knockout_secret'),
  region:s3?(process.env.S3_REGION||process.env.AWS_REGION||'us-east-1'):undefined,
  pathStyle:s3?process.env.S3_PATH_STYLE==='true':true
});

export const storageProvider=provider;
export const storagePrefix=value=>{const clean=String(value||'knockout').trim().replace(/[\\/\x00-\x1f]+/g,'-').replace(/^\.+|\.+$/g,'');return clean.toLowerCase()==='knockout'?'knockout':clean||'knockout'};
export const imageObject=(owner,name)=>`${storagePrefix(owner)}/images/${name}`;
export const reportObject=(owner,name)=>`${storagePrefix(owner)}/reports/${String(name||'report').replace(/[^a-zA-Z0-9._-]+/g,'-')}`;

export async function initializeStorage(){
  if(!await minio.bucketExists(bucket))await minio.makeBucket(bucket,s3?(process.env.S3_REGION||'us-east-1'):undefined);
  if(!s3&&process.env.STORAGE_PUBLIC_READ!=='false')await minio.setBucketPolicy(bucket,JSON.stringify({Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{AWS:['*']},Action:['s3:GetObject'],Resource:[`arn:aws:s3:::${bucket}/*`]}]}));
  await ensureStorageFolders('knockout');
}
export async function ensureStorageFolders(owner){const prefix=storagePrefix(owner);for(const folder of ['images','reports'])await minio.putObject(bucket,`${prefix}/${folder}/.keep`,Buffer.from(''),0,{'Content-Type':'application/octet-stream'});return prefix}
export async function putImage(owner,name,buffer,size,contentType){const objectName=imageObject(owner,name);await minio.putObject(bucket,objectName,buffer,size,{'Content-Type':contentType});return{objectName,url:publicUrl(objectName)}}
export async function putReport(owner,name,content,contentType='text/csv;charset=utf-8'){const objectName=reportObject(owner,name);const body=Buffer.from(content);await minio.putObject(bucket,objectName,body,body.length,{'Content-Type':contentType});return{objectName,url:publicUrl(objectName)}}
export async function copyImage(owner,sourceObject,name){const stream=await minio.getObject(bucket,sourceObject),chunks=[];for await(const chunk of stream)chunks.push(chunk);const body=Buffer.concat(chunks);return putImage(owner,name,body,body.length,'application/octet-stream')}
export function publicUrl(objectName){const configured=s3?process.env.S3_PUBLIC_URL:process.env.MINIO_PUBLIC_URL;if(configured)return`${configured.replace(/\/$/,'')}/${bucket}/${objectName}`;if(s3)return`https://${bucket}.s3.${process.env.S3_REGION||'us-east-1'}.amazonaws.com/${objectName}`;return`http://localhost:9000/${bucket}/${objectName}`}
