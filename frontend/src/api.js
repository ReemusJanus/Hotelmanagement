function portalIdentity(){
  try{
    const sessionUser=JSON.parse(sessionStorage.getItem('knockout-portal-user')||'null');
    if(sessionUser?.role)return{role:sessionUser.role,companyDatabase:sessionUser.companyDatabase||localStorage.getItem('knockout-company-db')||'knockout'};
  }catch{}
  return{role:localStorage.getItem('knockout-portal-role')||'admin',companyDatabase:localStorage.getItem('knockout-company-db')||'knockout'};
}
export async function api(path, options={}) {
  const identity=portalIdentity(),companyDatabase=identity.companyDatabase;
  const buildRole=import.meta.env.VITE_PORTAL_ROLE||'admin',activeRole=identity.role||buildRole;
  const base=`${location.protocol}//${location.hostname}:5100/api`;
  const accessToken=sessionStorage.getItem('knockout-access-token');
  const response = await fetch(base + path, {...options,headers: {'Content-Type':'application/json','Authorization':accessToken?`Bearer ${accessToken}`:'','X-Company-Database':companyDatabase,'X-Portal-Role':activeRole,...options.headers}});
  const data = await response.json();
  if(response.status===401&&sessionStorage.getItem('knockout-portal-user')){
    sessionStorage.removeItem('knockout-portal-user');
    sessionStorage.removeItem('knockout-access-token');
    window.dispatchEvent(new CustomEvent('knockout:session-revoked',{detail:{message:data.message||'Your secure session has expired. Sign in again.'}}));
  }
  if(response.status===403&&data.code==='COMPANY_SUSPENDED'){
    sessionStorage.removeItem('knockout-portal-user');
    sessionStorage.removeItem('knockout-access-token');
    window.dispatchEvent(new CustomEvent('knockout:session-revoked',{detail:{message:data.message}}));
  }
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

export async function apiForm(path, form, options={}) {
  const identity=portalIdentity(),base=`${location.protocol}//${location.hostname}:5100/api`;
  const accessToken=sessionStorage.getItem('knockout-access-token');
  const response=await fetch(base+path,{...options,method:options.method||'POST',headers:{'Authorization':accessToken?`Bearer ${accessToken}`:'','X-Company-Database':identity.companyDatabase,'X-Portal-Role':identity.role,...options.headers},body:form});
  const data=await response.json().catch(()=>({message:'Upload service returned an invalid response'}));
  if(response.status===401&&sessionStorage.getItem('knockout-portal-user')){
    sessionStorage.removeItem('knockout-portal-user');
    sessionStorage.removeItem('knockout-access-token');
    window.dispatchEvent(new CustomEvent('knockout:session-revoked',{detail:{message:data.message||'Your secure session has expired. Sign in again.'}}));
  }
  if(response.status===403&&data.code==='COMPANY_SUSPENDED'){
    sessionStorage.removeItem('knockout-portal-user');
    sessionStorage.removeItem('knockout-access-token');
    window.dispatchEvent(new CustomEvent('knockout:session-revoked',{detail:{message:data.message}}));
  }
  if(!response.ok)throw new Error(data.message||'Unable to upload the file');
  return data;
}

export async function resolvePortalLogin(pin) {
  const masterBase=`${location.protocol}//${location.hostname}:5100/api`;
  const response=await fetch(`${masterBase}/public/resolve-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
  const data=await response.json().catch(()=>({message:'Login service returned an invalid response'}));
  if(!response.ok)throw new Error(data.message||'Unable to verify this PIN');
  localStorage.setItem('knockout-company-db',data.companyDatabase);
  localStorage.setItem('knockout-portal-role',data.role);
  if(data.accessToken)sessionStorage.setItem('knockout-access-token',data.accessToken);else sessionStorage.removeItem('knockout-access-token');
  return data;
}

export async function submitCompanyRegistration(form) {
  const masterBase=`${location.protocol}//${location.hostname}:5100/api`;
  const response=await fetch(`${masterBase}/public/company-registrations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
  const data=await response.json().catch(()=>({message:'Registration service returned an invalid response'}));
  if(!response.ok)throw new Error(data.message||'Unable to submit company registration');
  return data;
}
