import {printPreferences,receiptPageHeight,receiptLayout} from './receipt-model.mjs';
import thermalStyles from './thermal-base.css?inline';
let printing=false;
function prepareJob(receipt){
 printing=true;
 const prefs=printPreferences({paper:receipt.dataset.printPaper,width:receipt.dataset.printWidth,feed:receipt.dataset.printFeed,driverPaper:receipt.dataset.driverPaper==='true'}),paperWidth=`${prefs.paper}mm`;
 const root=document.createElement('div');root.className='thermal-print-root';root.style.cssText=`position:absolute;left:-10000px;top:0;width:${paperWidth};background:white;`;
 const shadow=root.attachShadow({mode:'open'}),style=document.createElement('style'),copy=receipt.cloneNode(true);
 copy.className='thermal-receipt';copy.querySelectorAll('.no-print,button,details').forEach(e=>e.remove());
 copy.style.setProperty('--printable-width',`${prefs.width}mm`);copy.style.setProperty('--trailing-feed',`${prefs.feed}mm`);copy.dataset.layout=receiptLayout(prefs);
 style.textContent=thermalStyles;shadow.append(style,copy);document.body.appendChild(root);
 const page=document.createElement('style');page.dataset.thermalPage='true';
 const priorTitle=document.title;let cleaned=false;
 const cleanup=()=>{if(cleaned)return;cleaned=true;root.remove();page.remove();document.body.classList.remove('printing-thermal');document.title=priorTitle;printing=false;window.removeEventListener('afterprint',cleanup)};
 const apply=()=>{
  // Measure the actual print typography, wrapping and logo, not a guessed item count.
  const height=receiptPageHeight(copy.getBoundingClientRect().height,prefs.paper);
  const paper=prefs.driverPaper?'auto':`${paperWidth} ${height}mm`;
  page.textContent=`@media print{@page{size:${paper};margin:0;page-orientation:upright}html,body{width:${paperWidth}!important;margin:0!important;padding:0!important;height:auto!important;min-height:0!important;overflow:visible!important;background:white!important;color-scheme:light!important;writing-mode:horizontal-tb!important;direction:ltr!important;transform:none!important;zoom:1!important}html::before,html::after,body::before,body::after{display:none!important;content:none!important}body>*:not(.thermal-print-root){display:none!important}body>.thermal-print-root{display:block!important;position:static!important;width:${paperWidth}!important;margin:0!important;padding:0!important;height:auto!important;min-height:0!important}}`;
  document.head.appendChild(page);document.body.classList.add('printing-thermal');document.title='';window.addEventListener('afterprint',cleanup,{once:true});
 };
 return {copy,apply,cleanup};
}
export async function openPrinter(event){
 if(printing)return;
 const scope=event.currentTarget.closest('.modal-wrap')||document;
 const receipt=event.currentTarget.closest('.thermal-receipt')||scope.querySelector('.thermal-receipt');
 if(!receipt||receipt.dataset.printError){if(receipt?.dataset.printError)window.alert(receipt.dataset.printError);return}
 const job=prepareJob(receipt);
 try{
  await Promise.all([...job.copy.querySelectorAll('img')].map(img=>new Promise(resolve=>{if(img.complete){if(!img.naturalWidth)img.remove();return resolve()}const finish=()=>{clearTimeout(timer);if(!img.naturalWidth)img.remove();resolve()};const timer=setTimeout(finish,3000);img.addEventListener('load',finish,{once:true});img.addEventListener('error',finish,{once:true})})));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  job.apply();await window.print();
 }catch(error){window.alert(`Unable to prepare receipt: ${error.message}`)}finally{job.cleanup()}
}
// Ctrl+P with an open bill uses the same isolated layout, never every mounted dialog.
if(typeof window!=='undefined')window.addEventListener('beforeprint',()=>{
 if(printing)return;
 const receipt=[...document.querySelectorAll('.thermal-receipt')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).at(-1);
 if(receipt&&!receipt.dataset.printError)prepareJob(receipt).apply();
});
