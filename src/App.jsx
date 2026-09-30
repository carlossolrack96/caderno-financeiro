import React,{useEffect,useMemo,useState} from "react";
import {onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut} from "firebase/auth";
import {auth} from "./services/firebase";
import {subscribeCollection,addItem,updateItem,removeItem,saveDoc,listenDoc,renameCategoryAndLaunches,nextReceiptNumber} from "./services/database";
import {money} from "./utils/currency";
import {iso,brDate,monthDays} from "./utils/dates";
import {summarize,categoriesSummary} from "./utils/calculations";
import {reportPdf,receiptPdf} from "./services/pdf";
import {CalendarDays,BarChart3,ReceiptText,Settings,Plus,Trash2,Edit3,LogOut,Sun,Moon,ChevronLeft,ChevronRight,FileDown} from "lucide-react";
import "./styles/global.css";

const defaultCats=[
 {id:"d1",name:"Alimentação",type:"expense"},{id:"d2",name:"Combustível",type:"expense"},
 {id:"d3",name:"Moradia",type:"expense"},{id:"d4",name:"Contas",type:"expense"},
 {id:"d5",name:"Saúde",type:"expense"},{id:"d6",name:"Outros",type:"expense"},
 {id:"r1",name:"Salário",type:"income"},{id:"r2",name:"Vendas",type:"income"},
 {id:"r3",name:"Serviços",type:"income"},{id:"r4",name:"Outros",type:"income"}
];

function Auth({onUser}) {
 const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[pass,setPass]=useState(""),[err,setErr]=useState("");
 async function submit(e){e.preventDefault();setErr("");try{const r=mode==="login"?await signInWithEmailAndPassword(auth,email,pass):await createUserWithEmailAndPassword(auth,email,pass);onUser(r.user)}catch(x){setErr(x.message)}}
 return <div className="auth"><div className="auth-card"><h1>📒 Caderno financeiro</h1><p>Seu controle financeiro, no celular.</p><form onSubmit={submit}><input required type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)}/><input required minLength="6" type="password" placeholder="Senha" value={pass} onChange={e=>setPass(e.target.value)}/>{err&&<div className="error">{err}</div>}<button className="primary">{mode==="login"?"Entrar":"Criar conta"}</button></form><button className="link" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Ainda não tenho conta":"Já tenho conta"}</button></div></div>
}

function App(){
 const [user,setUser]=useState(null),[tab,setTab]=useState("calendar"),[dark,setDark]=useState(localStorage.theme==="dark");
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{document.documentElement.classList.toggle("dark",dark);localStorage.theme=dark?"dark":"light"},[dark]);
 if(!user)return <Auth onUser={setUser}/>;
 return <Main user={user} tab={tab} setTab={setTab} dark={dark} setDark={setDark}/>;
}

function Main({user,tab,setTab,dark,setDark}){
 const [items,setItems]=useState([]),[cats,setCats]=useState([]),[receipts,setReceipts]=useState([]),[company,setCompany]=useState(null),[notes,setNotes]=useState([]);
 useEffect(()=>subscribeCollection(user.uid,"transactions",setItems),[user.uid]);
 useEffect(()=>subscribeCollection(user.uid,"categories",async d=>{if(d.length){setCats(d);return;} setCats(defaultCats); for(const c of defaultCats){await saveDoc(user.uid,"categories",c.id,{name:c.name,type:c.type});}}),[user.uid]);
 useEffect(()=>subscribeCollection(user.uid,"receipts",setReceipts),[user.uid]);
 useEffect(()=>listenDoc(user.uid,"settings","company",setCompany),[user.uid]);
 useEffect(()=>subscribeCollection(user.uid,"notes",setNotes),[user.uid]);
 return <div className="app"><header><div><strong>📒 Caderno financeiro</strong></div><div className="header-actions"><button onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button onClick={()=>signOut(auth)}><LogOut size={18}/></button></div></header><main>
 {tab==="calendar"&&<CalendarPage {...{user,items,cats,notes}}/>}
 {tab==="reports"&&<ReportsPage {...{items,notes}}/>}
 {tab==="receipts"&&<ReceiptsPage {...{user,receipts,company}}/>}
 {tab==="settings"&&<SettingsPage {...{user,cats,company}}/>}
 </main><nav><Nav active={tab} set={setTab} icon={<CalendarDays/>} label="Calendário"/><Nav active={tab} set={setTab} icon={<BarChart3/>} label="Relatórios"/><Nav active={tab} set={setTab} icon={<ReceiptText/>} label="Recibos"/><Nav active={tab} set={setTab} icon={<Settings/>} label="Config." /></nav></div>
}
function Nav({active,set,icon,label}){const key=label==="Calendário"?"calendar":label==="Relatórios"?"reports":label==="Recibos"?"receipts":"settings";return <button className={active===key?"active":""} onClick={()=>set(key)}>{icon}<small>{label}</small></button>}

function CalendarPage({user,items,cats,notes}){
 const now=new Date(); const [date,setDate]=useState(new Date()),[selected,setSelected]=useState(null);
 const y=date.getFullYear(),m=date.getMonth(),{days}=monthDays(y,m);
 const start=new Date(y,m,1).getDay(); const cells=[...Array(start).fill(null),...days];
 const dayItems=d=>items.filter(x=>x.date===iso(d)), dayNotes=d=>notes.find(x=>x.date===iso(d));
 const monthItems=items.filter(x=>{const d=new Date(x.date+"T12:00:00");return d.getFullYear()===y&&d.getMonth()===m});
 const s=summarize(monthItems);
 return <section><div className="section-head"><div><h2>{date.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</h2><div className="month-summary">Saldo: <b className={s.balance>=0?"positive":"negative"}>{money(s.balance)}</b></div></div><div><button onClick={()=>setDate(new Date(y,m-1,1))}><ChevronLeft/></button><button onClick={()=>setDate(new Date(y,m+1,1))}><ChevronRight/></button></div></div>
 <div className="calendar">{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(x=><div className="dow" key={x}>{x}</div>)}{cells.map((d,i)=>d?<button key={i} className="day" onClick={()=>setSelected(d)}><span>{d.getDate()}</span>{dayItems(d).length>0&&<small>{money(summarize(dayItems(d)).balance)}</small>}{dayNotes(d)&&<i/>}</button>:<div key={i}/>)}</div>
 <div className="quick-cards"><div><small>Receitas</small><b className="positive">{money(s.revenue)}</b></div><div><small>Despesas</small><b className="negative">{money(s.expense)}</b></div></div>
 {selected&&<DayModal user={user} date={selected} items={dayItems(selected)} cats={cats} note={dayNotes(selected)} close={()=>setSelected(null)}/>}
 </section>
}

function DayModal({user,date,items,cats,note,close}){
 const [form,setForm]=useState(null),[text,setText]=useState(note?.text||"");
 async function saveNote(){await saveDoc(user.uid,"notes",note?.id||iso(date),{date:iso(date),text});close()}
 return <div className="overlay"><div className="modal"><div className="modal-head"><h3>{date.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</h3><button onClick={close}>×</button></div><div className="day-balance">{money(summarize(items).balance)}</div>{items.map(x=><div className="item" key={x.id}><div><b className={x.type==="income"?"positive":"negative"}>{x.type==="income"?"+":"-"} {money(x.amount)}</b><small>{(cats.find(c=>c.id===x.categoryId)?.name)||x.category} • {x.description}</small></div><div><button onClick={()=>setForm(x)}><Edit3 size={17}/></button><button onClick={()=>removeItem(user.uid,"transactions",x.id)}><Trash2 size={17}/></button></div></div>)}<button className="primary" onClick={()=>setForm({type:"expense",amount:"",category:cats.find(c=>c.type==="expense")?.name||"",description:""})}><Plus/> Lançamento</button><label>Anotação do dia<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva uma anotação..."/></label><button onClick={saveNote}>Salvar anotação</button>{form&&<TransactionForm user={user} date={date} cats={cats} data={form} close={()=>setForm(null)}/>}</div></div>
}
function TransactionForm({user,date,cats,data,close}){
 const [f,setF]=useState({...data});
 async function save(e){e.preventDefault();const selectedCat=cats.find(c=>c.name===f.category && c.type===f.type);
const payload={type:f.type,amount:Number(f.amount),category:f.category,categoryId:selectedCat?.id||f.categoryId||"",description:f.description,date:iso(date)};if(f.id)await updateItem(user.uid,"transactions",f.id,payload);else await addItem(user.uid,"transactions",payload);close()}
 const filtered=cats.filter(c=>c.type===f.type);
 return <div className="overlay nested"><form className="modal small" onSubmit={save}><div className="modal-head"><h3>{f.id?"Editar":"Novo"} lançamento</h3><button type="button" onClick={close}>×</button></div><select value={f.type} onChange={e=>setF({...f,type:e.target.value,category:""})}><option value="expense">Despesa</option><option value="income">Receita</option></select><input required type="number" step="0.01" placeholder="Valor" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/><select required value={f.category} onChange={e=>setF({...f,category:e.target.value})}><option value="">Categoria</option>{filtered.map(c=><option key={c.id}>{c.name}</option>)}</select><input placeholder="Descrição" value={f.description||""} onChange={e=>setF({...f,description:e.target.value})}/><button className="primary">Salvar</button></form></div>
}

function ReportsPage({items,notes}){
 const [period,setPeriod]=useState("month"),[ref,setRef]=useState(new Date());
 const filtered=useMemo(()=>items.filter(x=>{const d=new Date(x.date+"T12:00:00");if(period==="year")return d.getFullYear()===ref.getFullYear();if(period==="week"){const a=new Date(ref);const day=a.getDay();a.setDate(a.getDate()-day);const b=new Date(a);b.setDate(b.getDate()+6);return d>=a&&d<=b}return d.getFullYear()===ref.getFullYear()&&d.getMonth()===ref.getMonth()}),[items,period,ref]);
 const s=summarize(filtered),cats=categoriesSummary(filtered), periodText=period==="month"?ref.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}):period==="year"?String(ref.getFullYear()):"Semana de "+ref.toLocaleDateString("pt-BR");
 const ns=notes.filter(n=>filtered.some(x=>x.date===n.date));
 return <section><div className="section-head"><h2>Relatórios</h2><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="week">Semana</option><option value="month">Mês</option><option value="year">Ano</option></select></div><div className="report-cards"><Card t="Receitas" v={s.revenue}/><Card t="Despesas" v={s.expense}/><Card t="Saldo" v={s.balance}/></div><div className="bar-chart"><div className="bars"><div style={{height:Math.max(8,Math.min(100,s.revenue/(Math.max(s.revenue,s.expense)||1)*100))}}/><div style={{height:Math.max(8,Math.min(100,s.expense/(Math.max(s.revenue,s.expense)||1)*100))}}/></div><div className="bar-labels"><span>Receitas</span><span>Despesas</span></div></div><h3>Totais por categoria</h3>{cats.map(c=><div className="cat-row" key={c.type+c.category}><span>{c.category} <small>{c.type==="income"?"Receita":"Despesa"}</small></span><b>{money(c.total)} <em>{c.pct.toFixed(1)}%</em></b></div>)}<h3>Anotações</h3>{ns.length?ns.map(n=><div className="note-row" key={n.id}><b>{brDate(n.date)}</b> {n.text}</div>):<p>Nenhuma anotação no período.</p>}<button className="primary" onClick={()=>reportPdf({title:"Caderno financeiro",period:periodText,revenue:s.revenue,expense:s.expense,balance:s.balance,byCategory:cats,transactions:filtered,notes:ns})}><FileDown/> Baixar relatório em PDF</button></section>
}
function Card({t,v}){return <div className="card"><small>{t}</small><b>{money(v)}</b></div>}


function printThermal(receipt, company){
 const w=window.open("","_blank","width=320,height=600");
 if(!w)return;
 const total=money(receipt.total);
 w.document.write(`<!doctype html><html><head><title>Recibo ${receipt.number}</title><style>
 @page{size:55mm auto;margin:0}*{box-sizing:border-box}body{width:55mm;margin:0;padding:3mm;font-family:"Courier New",monospace;font-size:11px;line-height:1.35}
 .c{text-align:center}.line{border-top:1px dashed #000;margin:5px 0}@media print{button{display:none}}
 </style></head><body><div class="c"><b>${esc(company.name)}</b><br>${esc(company.address)}<br>CNPJ: ${esc(company.cnpj)}</div>
 <div class="line"></div><div>RECIBO: ${esc(receipt.number)}<br>DATA: ${esc(receipt.date)}<br>CLIENTE: ${esc(receipt.client)}${receipt.cpf?`<br>CPF: ${esc(receipt.cpf)}`:""}</div>
 <div class="line"></div><div>DESCRIÇÃO<br>${esc(receipt.quantity)} x ${esc(receipt.description)}<br>VALOR UN: ${money(receipt.unitValue)}<br><b>TOTAL: ${total}</b></div>
 <div class="line"></div><div class="c">Obrigado pela preferência!<br>${esc(company.phone)}</div><button onclick="window.print()">Imprimir</button></body></html>`);
 w.document.close(); w.focus();
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function ReceiptsPage({user,receipts,company}){
 const [open,setOpen]=useState(false);
 return <section><div className="section-head"><h2>Recibos</h2><button className="primary" onClick={()=>setOpen(true)}><Plus/> Novo</button></div>{receipts.map(r=><div className="receipt-row" key={r.id}><div><b>Recibo {r.number}</b><small>{r.client} • {brDate(r.date)} • {money(r.total)}</small></div><div><button title="PDF A5" onClick={()=>receiptPdf({receipt:r,company:company||emptyCompany,width:"a5"})}><FileDown/></button><button title="PDF 55 mm" onClick={()=>receiptPdf({receipt:r,company:company||emptyCompany,width:55})}>55</button><button title="Imprimir 55 mm" onClick={()=>printThermal(r,company||emptyCompany)}>🖨️</button><button onClick={()=>removeItem(user.uid,"receipts",r.id)}><Trash2/></button></div></div>)}{!receipts.length&&<p>Nenhum recibo emitido.</p>}{open&&<ReceiptForm user={user} company={company||emptyCompany} close={()=>setOpen(false)}/>}</section>
}
const emptyCompany={name:"[NOME DA EMPRESA]",address:"[ENDEREÇO]",cnpj:"[CNPJ]",phone:"[TELEFONE]"};
function ReceiptForm({user,company,close}){
 const [f,setF]=useState({client:"",cpf:"",description:"",quantity:1,unitValue:"",date:iso(new Date())});
 const [busy,setBusy]=useState(false);
 async function save(e){e.preventDefault();setBusy(true);const number=await nextReceiptNumber(user.uid);const r={...f,quantity:Number(f.quantity),unitValue:Number(f.unitValue),total:Number(f.quantity)*Number(f.unitValue),number};await addItem(user.uid,"receipts",r);receiptPdf({receipt:r,company,width:"a5"});setBusy(false);close()}
 return <div className="overlay"><form className="modal" onSubmit={save}><div className="modal-head"><h3>Novo recibo</h3><button type="button" onClick={close}>×</button></div><input required placeholder="Cliente" value={f.client} onChange={e=>setF({...f,client:e.target.value})}/><input placeholder="CPF (opcional)" value={f.cpf} onChange={e=>setF({...f,cpf:e.target.value})}/><input required type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/><input required type="number" min="1" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/><input required placeholder="Descrição" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/><input required type="number" step="0.01" placeholder="Valor unitário" value={f.unitValue} onChange={e=>setF({...f,unitValue:e.target.value})}/><button disabled={busy} className="primary">{busy?"Gerando...":"Emitir recibo"}</button></form></div>
}

function SettingsPage({user,cats,company}){
 const [c,setC]=useState(company||emptyCompany);
 useEffect(()=>setC(company||emptyCompany),[company]);
 async function companySave(e){e.preventDefault();await saveDoc(user.uid,"settings","company",c);alert("Dados salvos.");}
 async function addCat(type){const name=prompt(`Nome da nova ${type==="income"?"receita":"despesa"}:`);if(name)await addItem(user.uid,"categories",{name,type});}
 async function editCat(cat){const name=prompt("Novo nome:",cat.name);if(name&&name!==cat.name){await renameCategoryAndLaunches(user.uid,cat.id,cat.name,name);await updateItem(user.uid,"categories",cat.id,{name});}}
 return <section><h2>Configurações</h2><form onSubmit={companySave} className="settings"><h3>Dados da empresa</h3>{["name","address","cnpj","phone"].map(k=><input key={k} placeholder={k} value={c[k]||""} onChange={e=>setC({...c,[k]:e.target.value})}/>) }<button className="primary">Salvar empresa</button></form><div className="settings"><h3>Categorias</h3>{["expense","income"].map(type=><div key={type}><div className="section-head"><b>{type==="income"?"Receitas":"Despesas"}</b><button onClick={()=>addCat(type)}><Plus/></button></div>{cats.filter(x=>x.type===type).map(cat=><div className="cat-row" key={cat.id}><span>{cat.name}</span><span><button onClick={()=>editCat(cat)}><Edit3/></button><button onClick={()=>removeItem(user.uid,"categories",cat.id)}><Trash2/></button></span></div>)}</div>)}</div></section>
}
export default App;
