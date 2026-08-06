export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6000/api';
export async function api(path, options={}) {
  const companyDatabase=localStorage.getItem('knockout-company-db')||'knockout';
  const response = await fetch(API_BASE + path, {...options,headers: {'Content-Type':'application/json','X-Company-Database':companyDatabase,...options.headers}});
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}
