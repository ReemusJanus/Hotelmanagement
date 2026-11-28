// Native counterparts of the web templates. The server sends {id, code, version}; unknown values use Classic.
import {createContext,useContext} from 'react';
const base={hero:['#2B2F33','#1E2124'],heroBorder:'#454A4F',heroCopy:'#C3C6CA',onAccent:'#111214',radius:16,heroRadius:24,display:undefined,dock:'bar',centered:false};
export const nativeTemplates={
 classic:{...base,code:'classic',background:'#151719',surface:'#1E2124',border:'#34383C',text:'#F8F7F4',muted:'#B3B6BA',accent:'#c5a572'},
 luxury:{...base,code:'luxury',background:'#1F1C18',surface:'#2A2723',border:'#4A453E',text:'#FBF7EF',muted:'#CFC7B8',accent:'#D9BA83',hero:['#2A2723','#2A2723'],heroBorder:'#8A7248',heroCopy:'#CFC7B8',radius:2,heroRadius:2,display:'serif'},
 modern:{...base,code:'modern',background:'#0B1220',surface:'#152036',border:'#2A3A58',text:'#F8FAFC',muted:'#B6C2D6',accent:'#8FB0FF',hero:['#1D4ED8','#1E40AF'],heroBorder:'#3B66DD',heroCopy:'#DCE6FF',onAccent:'#0B1220',radius:20,heroRadius:26,dock:'floating'},
 minimal:{...base,code:'minimal',background:'#0C0C0C',surface:'#0C0C0C',border:'#383838',text:'#FFFFFF',muted:'#B8B8B8',accent:'#FFFFFF',hero:['#0C0C0C','#0C0C0C'],heroBorder:'#383838',heroCopy:'#B8B8B8',radius:4,heroRadius:0,dock:'text'},
 royal:{...base,code:'royal',background:'#0A1430',surface:'#13224B',border:'#2E4174',text:'#F7F3E8',muted:'#C0C8DD',accent:'#D9B868',hero:['#192A57','#0E1B3D'],heroBorder:'#C9A24B',heroCopy:'#D5DBEA',onAccent:'#0E1B3D',radius:6,heroRadius:6,display:'serif',centered:true},
 'midnight-dark':{...base,code:'midnight-dark',background:'#0E0F11',surface:'#17191C',border:'#3A3222',text:'#F4EFE6',muted:'#BDB7AC',accent:'#D4B06A',hero:['#1E2125','#131518'],heroBorder:'#5E4E2C',heroCopy:'#BDB7AC',radius:10,heroRadius:10,display:'serif'},
 'ocean-dark':{...base,code:'ocean-dark',background:'#061423',surface:'#0A1C30',border:'#1D3A58',text:'#EAF6FB',muted:'#A9C3D6',accent:'#3FD0E6',hero:['#0C2C4A','#0A1F38'],heroBorder:'#1F617A',heroCopy:'#CFE3EE',onAccent:'#04202A',radius:20,heroRadius:22},
 emerald:{...base,code:'emerald',background:'#0B2A21',surface:'#0F3B2E',border:'#2B6451',text:'#FAF7EE',muted:'#C4D6CC',accent:'#E3CB9B',hero:['#174C3C','#0F3B2E'],heroBorder:'#B9975B',heroCopy:'#C4D6CC',radius:14,heroRadius:18,display:'serif'},
 amoled:{...base,code:'amoled',background:'#000000',surface:'#000000',border:'#262626',text:'#FFFFFF',muted:'#B5B5B5',accent:'#6BE3A4',hero:['#000000','#000000'],heroBorder:'#262626',heroCopy:'#B5B5B5',onAccent:'#00140A',radius:12,heroRadius:12,dock:'text'},
 'modern-light':{...base,code:'modern-light',background:'#1C1C1F',surface:'#27272A',border:'#45454D',text:'#FAFAFA',muted:'#C9C9D0',accent:'#FAFAFA',hero:['#3F3F46','#27272A'],heroBorder:'#5B5B64',heroCopy:'#DADAE0',onAccent:'#18181B',radius:14,heroRadius:14},
 'glass-light':{...base,code:'glass-light',glass:true,background:'#16233A',surface:'#22345299',border:'#3E557C',text:'#F4F8FF',muted:'#C2CFE3',accent:'#9CC2FF',hero:['#2F5CA8','#1C3560'],heroBorder:'#5B82C4',heroCopy:'#D6E2F6',onAccent:'#0A1B38',radius:22,heroRadius:28,dock:'floating'},
 'glass-dark':{...base,code:'glass-dark',glass:true,background:'#0C0F14',surface:'#262C3799',border:'#3A4250',text:'#F2F5FA',muted:'#BAC3D1',accent:'#8AB4FF',hero:['#263044','#171B22'],heroBorder:'#4A5568',heroCopy:'#BAC3D1',onAccent:'#071529',radius:22,heroRadius:28,dock:'floating'},
 'midnight-glass':{...base,code:'midnight-glass',glass:true,background:'#080A1C',surface:'#1E255099',border:'#3C4580',text:'#F1F2FF',muted:'#BCC1E6',accent:'#A9A4FF',hero:['#2E2968','#11152E'],heroBorder:'#4B4890',heroCopy:'#C6CAEC',onAccent:'#0E0B2C',radius:22,heroRadius:28,dock:'floating'},
 'royal-gold-glass':{...base,code:'royal-gold-glass',glass:true,background:'#140C1C',surface:'#35244499',border:'#74603C',text:'#FBF5E9',muted:'#D3C6CE',accent:'#DDBB72',hero:['#402842','#20152A'],heroBorder:'#9A7F4C',heroCopy:'#DACDD4',onAccent:'#21160A',radius:22,heroRadius:28,display:'serif',dock:'floating'},
 'aurora-glass':{...base,code:'aurora-glass',glass:true,background:'#061219',surface:'#16344299',border:'#2A5E68',text:'#ECFBF8',muted:'#B3CCD2',accent:'#5BE0BE',hero:['#0C4246','#261E4E'],heroBorder:'#2F7A70',heroCopy:'#C2D8DC',onAccent:'#03231B',radius:22,heroRadius:28,dock:'floating'},
};
export function nativeTemplate(config){
 const entry=Object.prototype.hasOwnProperty.call(nativeTemplates,config?.code)?nativeTemplates[config.code]:nativeTemplates.classic;
 const major=Number.parseInt(config?.version??'1',10);
 return major===1?entry:nativeTemplates.classic;
}
const Context=createContext(nativeTemplates.classic);
export const NativeTemplateProvider=Context.Provider;
export const useNativeTemplate=()=>useContext(Context);
