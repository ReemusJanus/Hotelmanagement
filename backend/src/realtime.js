import crypto from 'node:crypto';
import {createClient} from 'redis';

const channel=process.env.REDIS_EVENTS_CHANNEL||'knockout:state-events';
const instanceId=process.env.INSTANCE_ID||crypto.randomUUID();
let publisher=null,subscriber=null,handler=null,ready=false;

export async function initializeRealtime(onMessage){
 handler=onMessage;
 const url=String(process.env.REDIS_URL||'').trim();
 if(!url)return {provider:'memory',ready:false};
 const pub=createClient({url,socket:{reconnectStrategy:retries=>{if(!ready)return false;return Math.min(retries*100,3000)}}});
 const sub=pub.duplicate();
 pub.on('error',error=>{if(ready)console.error('Redis publisher:',error.message)});
 sub.on('error',error=>{if(ready)console.error('Redis subscriber:',error.message)});
 try{
  await Promise.all([pub.connect(),sub.connect()]);
  await sub.subscribe(channel,raw=>{
   try{const event=JSON.parse(raw);if(event.instanceId!==instanceId)handler?.(event)}catch(error){console.error('Invalid realtime event:',error.message)}
  });
  publisher=pub;subscriber=sub;ready=true;
  return {provider:'redis',ready:true};
 }catch(error){
  await Promise.allSettled([pub.disconnect(),sub.disconnect()]);
  throw error;
 }
}

export function publishRealtime(event){
 if(!ready)return;
 publisher.publish(channel,JSON.stringify({...event,instanceId})).catch(error=>console.error('Redis publish:',error.message));
}

export function realtimeStatus(){return{provider:ready?'redis':'memory',ready}}

export async function closeRealtime(){
 ready=false;
 await Promise.allSettled([subscriber?.quit(),publisher?.quit()]);
}
