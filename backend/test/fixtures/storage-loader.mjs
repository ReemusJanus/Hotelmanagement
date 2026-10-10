import {registerHooks} from 'node:module';
// Database integration tests deliberately stub object storage, not PostgreSQL.
registerHooks({load(url,context,nextLoad){if(url.endsWith('/src/storage.js'))return{format:'module',shortCircuit:true,source:`
export const bucket='test-storage',storageProvider='test-fixture';
export const minio={removeObject:async()=>{}};
export const storagePrefix=value=>value;
export const initializeStorage=async()=>{};
export const ensureStorageFolders=async()=>{};
export const putImage=async()=>({url:'test://image',objectName:'test/image'});
export const putReport=async()=>({url:'test://report',objectName:'test/report'});
export const copyImage=async()=>({url:'test://image',objectName:'test/image'});
`};return nextLoad(url,context)}});
