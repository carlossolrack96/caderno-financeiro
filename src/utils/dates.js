export const pad = n => String(n).padStart(2,"0");
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const brDate = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR") : "";
export function monthDays(year, month) {
  const first = new Date(year,month,1), last = new Date(year,month+1,0);
  const arr=[]; for(let i=1;i<=last.getDate();i++) arr.push(new Date(year,month,i));
  return {first,last,days:arr};
}
