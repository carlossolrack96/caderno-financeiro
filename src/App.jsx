import React,{useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut} from "firebase/auth";
import {auth} from "./services/firebase";

import {
  addCompanyItem,
  updateCompanyItem,
  removeCompanyItem,
  saveCompanyDoc,
  listenCompanyDoc,
  subscribeCompanyCollection,
  getUserProfile,
  renameCompanyCategoryAndTransactions,
  nextCompanyReceiptNumber
} from "./services/database";

import {money} from "./utils/currency";
import {iso,brDate,monthDays} from "./utils/dates";
import {summarize,categoriesSummary} from "./utils/calculations";
import {reportPdf,receiptPdf} from "./services/pdf";

import {
  CalendarDays,
  BarChart3,
  ReceiptText,
  Settings,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  FileDown
} from "lucide-react";

import "./styles/global.css";


const defaultCats=[
  {id:"d1",name:"Alimentação",type:"expense"},
  {id:"d2",name:"Combustível",type:"expense"},
  {id:"d3",name:"Moradia",type:"expense"},
  {id:"d4",name:"Contas",type:"expense"},
  {id:"d5",name:"Saúde",type:"expense"},
  {id:"d6",name:"Outros",type:"expense"},
  {id:"r1",name:"Salário",type:"income"},
  {id:"r2",name:"Vendas",type:"income"},
  {id:"r3",name:"Serviços",type:"income"},
  {id:"r4",name:"Outros",type:"income"}
];


function Auth({onUser}){

  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");

  async function submit(e){
    e.preventDefault();
    setErr("");

    try{
      const r=await signInWithEmailAndPassword(
        auth,
        email,
        pass
      );

      onUser(r.user);

    }catch(x){
      setErr(x.message);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">

        <h1>🚐 VCAR Gestão de Viagens</h1>

        <p>
          Entre com seu e-mail e senha.
        </p>

        <form onSubmit={submit}>

          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />

          <input
            required
            minLength="6"
            type="password"
            placeholder="Senha"
            value={pass}
            onChange={e=>setPass(e.target.value)}
          />

          {err&&
            <div className="error">
              {err}
            </div>
          }

          <button className="primary">
            Entrar
          </button>

        </form>

      </div>
    </div>
  );
}


function App(){

  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("calendar");
  const [dark,setDark]=useState(
    localStorage.theme==="dark"
  );

  useEffect(()=>{
    return onAuthStateChanged(
      auth,
      setUser
    );
  },[]);

  useEffect(()=>{
    document.documentElement.classList.toggle(
      "dark",
      dark
    );

    localStorage.theme=
      dark?"dark":"light";

  },[dark]);


  if(!user){
    return <Auth onUser={setUser}/>;
  }


  return (
    <Main
      user={user}
      tab={tab}
      setTab={setTab}
      dark={dark}
      setDark={setDark}
    />
  );
}


function Main({
  user,
  tab,
  setTab,
  dark,
  setDark
}){

  const [profile,setProfile]=useState(null);
  const [profileLoading,setProfileLoading]=useState(true);

  const [items,setItems]=useState([]);
  const [cats,setCats]=useState([]);
  const [receipts,setReceipts]=useState([]);
  const [company,setCompany]=useState(null);
  const [notes,setNotes]=useState([]);

  const companyId=
    profile?.companyId||null;


  useEffect(()=>{

    let active=true;

    getUserProfile(user.uid)
      .then(p=>{

        if(active){
          setProfile(p);
          setProfileLoading(false);
        }

      })
      .catch(err=>{

        console.error(err);

        if(active){
          setProfileLoading(false);
        }

      });

    return()=>{
      active=false;
    };

  },[user.uid]);


  useEffect(()=>{

    if(!companyId){
      setItems([]);
      return;
    }

    return subscribeCompanyCollection(
      companyId,
      "transactions",
      setItems
    );

  },[companyId]);


  useEffect(()=>{

    if(!companyId){
      setCats([]);
      return;
    }

    return subscribeCompanyCollection(
      companyId,
      "categories",
      async data=>{

        if(data.length){
          setCats(data);
          return;
        }

        setCats(defaultCats);

        for(const c of defaultCats){

          await saveCompanyDoc(
            companyId,
            "categories",
            c.id,
            {
              name:c.name,
              type:c.type
            }
          );

        }

      }
    );

  },[companyId]);


  useEffect(()=>{

    if(!companyId){
      setReceipts([]);
      return;
    }

    return subscribeCompanyCollection(
      companyId,
      "receipts",
      setReceipts
    );

  },[companyId]);


  useEffect(()=>{

    if(!companyId){
      setCompany(null);
      return;
    }

    return listenCompanyDoc(
      companyId,
      "settings",
      "company",
      setCompany
    );

  },[companyId]);


  useEffect(()=>{

    if(!companyId){
      setNotes([]);
      return;
    }

    return subscribeCompanyCollection(
      companyId,
      "notes",
      setNotes
    );

  },[companyId]);


  if(profileLoading){

    return (
      <div className="auth">
        <div className="auth-card">
          <h2>
            Carregando empresa...
          </h2>
        </div>
      </div>
    );
  }


  if(!profile?.companyId){

    return (
      <div className="auth">
        <div className="auth-card">

          <h2>
            Empresa não vinculada
          </h2>

          <p>
            Este usuário ainda não está
            vinculado a uma empresa.
          </p>

          <button
            className="primary"
            onClick={()=>signOut(auth)}
          >
            Sair
          </button>

        </div>
      </div>
    );
  }


  return (
    <div className="app">

      <header>

        <div>
          <strong>
            🚐 VCAR Gestão de Viagens
          </strong>
        </div>

        <div className="header-actions">

          <button
            onClick={()=>setDark(!dark)}
          >
            {dark
              ?<Sun size={18}/>
              :<Moon size={18}/>
            }
          </button>

          <button
            onClick={()=>signOut(auth)}
          >
            <LogOut size={18}/>
          </button>

        </div>

      </header>


      <main>

        {tab==="calendar"&&
          <CalendarPage
            user={user}
            companyId={companyId}
            items={items}
            cats={cats}
            notes={notes}
          />
        }

        {tab==="reports"&&
          <ReportsPage
            items={items}
            notes={notes}
          />
        }

        {tab==="receipts"&&
          <ReceiptsPage
            user={user}
            companyId={companyId}
            receipts={receipts}
            company={company}
          />
        }

        {tab==="settings"&&
          <SettingsPage
            user={user}
            companyId={companyId}
            cats={cats}
            company={company}
          />
        }

      </main>


      <nav>

        <Nav
          active={tab}
          set={setTab}
          icon={<CalendarDays/>}
          label="Calendário"
        />

        <Nav
          active={tab}
          set={setTab}
          icon={<BarChart3/>}
          label="Relatórios"
        />

        <Nav
          active={tab}
          set={setTab}
          icon={<ReceiptText/>}
          label="Recibos"
        />

        <Nav
          active={tab}
          set={setTab}
          icon={<Settings/>}
          label="Config."
        />

      </nav>

    </div>
  );
}


function Nav({
  active,
  set,
  icon,
  label
}){

  const key=
    label==="Calendário"
      ?"calendar"
      :label==="Relatórios"
      ?"reports"
      :label==="Recibos"
      ?"receipts"
      :"settings";

  return (
    <button
      className={
        active===key
          ?"active"
          :""
      }
      onClick={()=>set(key)}
    >
      {icon}
      <small>{label}</small>
    </button>
  );
}


function CalendarPage({
  user,
  companyId,
  items,
  cats,
  notes
}){

  const [date,setDate]=
    useState(new Date());

  const [selected,setSelected]=
    useState(null);


  const y=date.getFullYear();
  const m=date.getMonth();

  const {days}=monthDays(y,m);

  const start=
    new Date(y,m,1).getDay();

  const cells=[
    ...Array(start).fill(null),
    ...days
  ];


  const dayItems=d=>
    items.filter(
      x=>x.date===iso(d)
    );


  const dayNotes=d=>
    notes.find(
      x=>x.date===iso(d)
    );


  const monthItems=
    items.filter(x=>{

      const d=
        new Date(
          x.date+"T12:00:00"
        );

      return(
        d.getFullYear()===y &&
        d.getMonth()===m
      );

    });


  const s=
    summarize(monthItems);


  return (
    <section>

      <div className="section-head">

        <div>

          <h2>
            {date.toLocaleDateString(
              "pt-BR",
              {
                month:"long",
                year:"numeric"
              }
            )}
          </h2>

          <div className="month-summary">
            Saldo:
            {" "}
            <b
              className={
                s.balance>=0
                  ?"positive"
                  :"negative"
              }
            >
              {money(s.balance)}
            </b>
          </div>

        </div>


        <div>

          <button
            onClick={()=>
              setDate(
                new Date(y,m-1,1)
              )
            }
          >
            <ChevronLeft/>
          </button>

          <button
            onClick={()=>
              setDate(
                new Date(y,m+1,1)
              )
            }
          >
            <ChevronRight/>
          </button>

        </div>

      </div>


      <div className="calendar">

        {[
          "Dom",
          "Seg",
          "Ter",
          "Qua",
          "Qui",
          "Sex",
          "Sáb"
        ].map(x=>
          <div
            className="dow"
            key={x}
          >
            {x}
          </div>
        )}


        {cells.map((d,i)=>

          d?

          <button
            key={i}
            className="day"
            onClick={()=>
              setSelected(d)
            }
          >

            <span>
              {d.getDate()}
            </span>

            {dayItems(d).length>0&&
              <small>
                {money(
                  summarize(
                    dayItems(d)
                  ).balance
                )}
              </small>
            }

            {dayNotes(d)&&
              <i/>
            }

          </button>

          :

          <div key={i}/>

        )}

      </div>


      <div className="quick-cards">

        <div>
          <small>Receitas</small>
          <b className="positive">
            {money(s.revenue)}
          </b>
        </div>

        <div>
          <small>Despesas</small>
          <b className="negative">
            {money(s.expense)}
          </b>
        </div>

      </div>


      {selected&&
        <DayModal
          user={user}
          companyId={companyId}
          date={selected}
          items={dayItems(selected)}
          cats={cats}
          note={dayNotes(selected)}
          close={()=>
            setSelected(null)
          }
        />
      }

    </section>
  );
}


function DayModal({
  user,
  companyId,
  date,
  items,
  cats,
  note,
  close
}){

  const [form,setForm]=
    useState(null);

  const [text,setText]=
    useState(note?.text||"");


  async function saveNote(){

    await saveCompanyDoc(
      companyId,
      "notes",
      note?.id||iso(date),
      {
        date:iso(date),
        text
      }
    );

    close();
  }


  async function deleteTransaction(id){

    await removeCompanyItem(
      companyId,
      "transactions",
      id
    );

  }


  return (
    <div className="overlay">

      <div className="modal">

        <div className="modal-head">

          <h3>
            {date.toLocaleDateString(
              "pt-BR",
              {
                weekday:"long",
                day:"2-digit",
                month:"long"
              }
            )}
          </h3>

          <button onClick={close}>
            ×
          </button>

        </div>


        <div className="day-balance">
          {money(
            summarize(items).balance
          )}
        </div>


        {items.map(x=>

          <div
            className="item"
            key={x.id}
          >

            <div>

              <b
                className={
                  x.type==="income"
                    ?"positive"
                    :"negative"
                }
              >
                {x.type==="income"
                  ?"+"
                  :"-"
                }
                {" "}
                {money(x.amount)}
              </b>

              <small>
                {
                  cats.find(
                    c=>c.id===x.categoryId
                  )?.name
                ||x.category
                }
                {" • "}
                {x.description}
              </small>

            </div>


            <div>

              <button
                onClick={()=>
                  setForm(x)
                }
              >
                <Edit3 size={17}/>
              </button>

              <button
                onClick={()=>
                  deleteTransaction(x.id)
                }
              >
                <Trash2 size={17}/>
              </button>

            </div>

          </div>

        )}


        <button
          className="primary"
          onClick={()=>
            setForm({
              type:"expense",
              amount:"",
              category:
                cats.find(
                  c=>c.type==="expense"
                )?.name||"",
              description:""
            })
          }
        >
          <Plus/>
          Lançamento
        </button>


        <label>
          Anotação do dia

          <textarea
            value={text}
            onChange={e=>
              setText(e.target.value)
            }
            placeholder="Escreva uma anotação..."
          />

        </label>


        <button onClick={saveNote}>
          Salvar anotação
        </button>


        {form&&
          <TransactionForm
            user={user}
            companyId={companyId}
            date={date}
            cats={cats}
            data={form}
            close={()=>
              setForm(null)
            }
          />
        }

      </div>
    </div>
  );
}


function TransactionForm({
  companyId,
  date,
  cats,
  data,
  close
}){

  const [f,setF]=
    useState({...data});


  async function save(e){

    e.preventDefault();

    const selectedCat=
      cats.find(
        c=>
          c.name===f.category &&
          c.type===f.type
      );


    const payload={
      type:f.type,
      amount:Number(f.amount),
      category:f.category,
      categoryId:
        selectedCat?.id||
        f.categoryId||
        "",
      description:f.description||"",
      date:iso(date)
    };


    try{

      if(f.id){

        await updateCompanyItem(
          companyId,
          "transactions",
          f.id,
          payload
        );

      }else{

        await addCompanyItem(
          companyId,
          "transactions",
          payload
        );

      }

      close();

    }catch(err){

      console.error(
        "Erro ao salvar lançamento:",
        err
      );

      alert(
        "Não foi possível salvar o lançamento."
      );

    }

  }


  const filtered=
    cats.filter(
      c=>c.type===f.type
    );


  return (
    <div className="overlay nested">

      <form
        className="modal small"
        onSubmit={save}
      >

        <div className="modal-head">

          <h3>
            {f.id
              ?"Editar"
              :"Novo"
            } lançamento
          </h3>

          <button
            type="button"
            onClick={close}
          >
            ×
          </button>

        </div>


        <select
          value={
