export function summarize(items) {
  const revenue=items.filter(x=>x.type==="income").reduce((s,x)=>s+Number(x.amount||0),0);
  const expense=items.filter(x=>x.type==="expense").reduce((s,x)=>s+Number(x.amount||0),0);
  return {revenue,expense,balance:revenue-expense};
}
export function categoriesSummary(items) {
  const total=Math.abs(items.reduce((s,x)=>s+(x.type==="expense"?-Number(x.amount||0):Number(x.amount||0)),0));
  const m={};
  items.forEach(x=>{const k=`${x.type}|${x.category}`;m[k]=(m[k]||0)+Number(x.amount||0)});
  return Object.entries(m).map(([k,v])=>{const [type,category]=k.split("|");return {type,category,total:v,pct:total?v/total*100:0}}).sort((a,b)=>b.total-a.total);
}
