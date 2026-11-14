import './storage-loader.mjs';
import {registerHooks} from 'node:module';
// This fixture explicitly tests the real single-process WebSocket transport with
// REDIS_URL empty. Fail if Redis is unexpectedly used; do not mock delivery.
registerHooks({
 resolve(specifier,context,next){return specifier==='redis'?{url:'fixture:unused-redis',shortCircuit:true}:next(specifier,context)},
 load(url,context,next){return url==='fixture:unused-redis'?{format:'module',shortCircuit:true,source:"export function createClient(){throw new Error('Redis must be disabled for this isolated test')}"}:next(url,context)}
});
