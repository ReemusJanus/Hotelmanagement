import crypto from 'node:crypto';
import {createClient} from 'redis';

const channel=process.env.REDIS_EVENTS_CHANNEL||'knockout:state-events';
const instanceId=process.env.INSTANCE_ID||crypto.randomUUID();
let publisher=null,subscriber=null,handler=null,ready=false;

export async function initializeRealtime(onMessage){
 handler=onMessage;
 const url=String(process.env.REDIS_URL||'').trim();
 if(!url)return {provider:'memory',ready:false};
 let initialConnect=true;
 publisher=createClient({url,socket:{connectTimeout:2000,reconnectStrategy:retries=>{
  if(initialConnect&&process.env.REDIS_REQUIRED!=='true')return false;
  return Math.min(retries*100,3000);
 }}});
 subscriber=publisher.duplicate();
 publisher.on('error',error=>{if(!initialConnect)console.error('Redis publisher:',error.message)});
 subscriber.on('error',error=>{if(!initialConnect)console.error('Redis subscriber:',error.message)});
 try{
  await Promise.all([publisher.connect(),subscriber.connect()]);
  initialConnect=false;
  await subscriber.subscribe(channel,raw=>{
   try{const event=JSON.parse(raw);if(event.instanceId!==instanceId)handler?.(event)}catch(error){console.error('Invalid realtime event:',error.message)}
  });
  ready=true;
  return {provider:'redis',ready:true};
 }catch(err){
  initialConnect=false;
  ready=false;
  publisher?.removeAllListeners?.('error');
  subscriber?.removeAllListeners?.('error');
  await Promise.allSettled([subscriber?.disconnect(),publisher?.disconnect()]);
  subscriber=null;publisher=null;
  throw err;
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
