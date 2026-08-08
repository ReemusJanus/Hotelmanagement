export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6000/api';
function portalIdentity(){
  try{
    const sessionUser=JSON.parse(sessionStorage.getItem('knockout-portal-user')||'null');
    if(sessionUser?.role)return{role:sessionUser.role,companyDatabase:sessionUser.companyDatabase||localStorage.getItem('knockout-company-db')||'knockout'};
  }catch{}
  return{role:localStorage.getItem('knockout-portal-role')||'admin',companyDatabase:localStorage.getItem('knockout-company-db')||'knockout'};
}
export function portalHeaders(){const identity=portalIdentity();return {'X-Company-Database':identity.companyDatabase,'X-Portal-Role':identity.role}}
export async function api(path, options={}) {
  const identity=portalIdentity(),companyDatabase=identity.companyDatabase;
  const buildRole=import.meta.env.VITE_PORTAL_ROLE||'admin',activeRole=identity.role||buildRole,ports={admin:6100,waiter:7100,chef:8100};
  const base=['superadmin','unified'].includes(buildRole)?API_BASE:`${location.protocol}//${location.hostname}:${ports[activeRole]||ports.admin}/api`;
  const response = await fetch(base + path, {...options,headers: {'Content-Type':'application/json','X-Company-Database':companyDatabase,'X-Portal-Role':activeRole,...options.headers}});
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

export async function resolvePortalLogin(pin) {
  const masterBase=`${location.protocol}//${location.hostname}:5100/api`;
  const response=await fetch(`${masterBase}/public/resolve-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
  const data=await response.json().catch(()=>({message:'Login service returned an invalid response'}));
  if(!response.ok)throw new Error(data.message||'Unable to verify this PIN');
  localStorage.setItem('knockout-company-db',data.companyDatabase);
  localStorage.setItem('knockout-portal-role',data.role);
  return data;
}
