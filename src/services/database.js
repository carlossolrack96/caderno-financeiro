import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  where,
  writeBatch,
  runTransaction
} from "firebase/firestore";

import { db } from "./firebase";


/* =========================================================
   ESTRUTURA ANTIGA
   Mantida para partes do sistema que ainda utilizam
   dados individuais do usuário.
========================================================= */

const base = (uid, name) =>
  collection(db, "users", uid, name);

const one = (uid, name, id) =>
  doc(db, "users", uid, name, id);


export const subscribeCollection = (uid, name, callback) => {

  return onSnapshot(
    query(
      base(uid, name),
      orderBy("createdAt", "desc")
    ),

    snap => {

      callback(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );

    },

    err => console.error(err)
  );

};


export const addItem = (uid, name, data) =>

  addDoc(
    base(uid, name),
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  );


export const updateItem = (uid, name, id, data) =>

  updateDoc(
    one(uid, name, id),
    {
      ...data,
      updatedAt: serverTimestamp()
    }
  );


export const removeItem = (uid, name, id) =>

  deleteDoc(
    one(uid, name, id)
  );


export const saveDoc = (uid, name, id, data) =>

  setDoc(
    one(uid, name, id),
    {
      ...data,
      updatedAt: serverTimestamp()
    },
    {
      merge: true
    }
  );


export const listenDoc = (
  uid,
  name,
  id,
  callback
) =>

  onSnapshot(
    one(uid, name, id),
    d =>
      callback(
        d.exists()
          ? {
              id: d.id,
              ...d.data()
            }
          : null
      )
  );


/* =========================================================
   EMPRESA
   Estrutura:
   companies/{companyId}/...
========================================================= */

const companyBase = (companyId, name) =>

  collection(
    db,
    "companies",
    companyId,
    name
  );


const companyOne = (
  companyId,
  name,
  id
) =>

  doc(
    db,
    "companies",
    companyId,
    name,
    id
  );


/* =========================================================
   CONSULTAR PERFIL DO USUÁRIO
========================================================= */

export const getUserProfile = async (uid) => {

  const ref =
    doc(db, "users", uid);

  const snap =
    await getDocs(
      query(
        collection(db, "users"),
        where("__name__", "==", uid)
      )
    );

  if(snap.empty){
    return null;
  }

  return {
    id: uid,
    ...snap.docs[0].data()
  };

};


/* =========================================================
   LISTAR DADOS DA EMPRESA
========================================================= */

export const subscribeCompanyCollection = (
  companyId,
  name,
  callback
) => {

  if(!companyId){
    return () => {};
  }

  return onSnapshot(

    companyBase(
      companyId,
      name
    ),

    snap => {

      callback(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );

    },

    err => console.error(err)

  );

};


/* =========================================================
   ADICIONAR DADO NA EMPRESA
========================================================= */

export const addCompanyItem = (
  companyId,
  name,
  data
) =>

  addDoc(

    companyBase(
      companyId,
      name
    ),

    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

  );


/* =========================================================
   ATUALIZAR DADO DA EMPRESA
========================================================= */

export const updateCompanyItem = (
  companyId,
  name,
  id,
  data
) =>

  updateDoc(

    companyOne(
      companyId,
      name,
      id
    ),

    {
      ...data,
      updatedAt: serverTimestamp()
    }

  );


/* =========================================================
   EXCLUIR DADO DA EMPRESA
========================================================= */

export const removeCompanyItem = (
  companyId,
  name,
  id
) =>

  deleteDoc(

    companyOne(
      companyId,
      name,
      id
    )

  );


/* =========================================================
   SALVAR DOCUMENTO DA EMPRESA
========================================================= */

export const saveCompanyDoc = (
  companyId,
  name,
  id,
  data
) =>

  setDoc(

    companyOne(
      companyId,
      name,
      id
    ),

    {
      ...data,
      updatedAt: serverTimestamp()
    },

    {
      merge: true
    }

  );


/* =========================================================
   OUVIR UM DOCUMENTO DA EMPRESA
========================================================= */

export const listenCompanyDoc = (
  companyId,
  name,
  id,
  callback
) => {

  if(!companyId){
    callback(null);
    return () => {};
  }

  return onSnapshot(

    companyOne(
      companyId,
      name,
      id
    ),

    d => {

      callback(
        d.exists()
          ? {
              id: d.id,
              ...d.data()
            }
          : null
      );

    }

  );

};


/* =========================================================
   RENOMEAR CATEGORIA E TRANSAÇÕES DA EMPRESA
========================================================= */

export const renameCompanyCategoryAndTransactions =
async (
  companyId,
  categoryId,
  oldName,
  newName
) => {

  const transactions =
    companyBase(
      companyId,
      "transactions"
    );


  let snap =
    await getDocs(
      query(
        transactions,
        where(
          "categoryId",
          "==",
          categoryId
        )
      )
    );


  const batch =
    writeBatch(db);


  snap.docs.forEach(d => {

    batch.update(
      d.ref,
      {
        category: newName,
        categoryId: categoryId,
        updatedAt: serverTimestamp()
      }
    );

  });


  if(!snap.empty){

    await batch.commit();

    return;

  }


  /*
    Compatibilidade com lançamentos
    que possam ter somente o nome da categoria.
  */

  snap =
    await getDocs(
      query(
        transactions,
        where(
          "category",
          "==",
          oldName
        )
      )
    );


  if(snap.empty){
    return;
  }


  const batch2 =
    writeBatch(db);


  snap.docs.forEach(d => {

    batch2.update(
      d.ref,
      {
        category: newName,
        categoryId: categoryId,
        updatedAt: serverTimestamp()
      }
    );

  });


  await batch2.commit();

};


/* =========================================================
   FUNÇÃO ANTIGA
   Mantida para compatibilidade.
========================================================= */

export const renameCategoryAndLaunches =
async (
  uid,
  categoryId,
  oldName,
  newName
) => {

  const transactions =
    base(
      uid,
      "transactions"
    );


  const snap =
    await getDocs(
      query(
        transactions,
        where(
          "categoryId",
          "==",
          categoryId
        )
      )
    );


  const batch =
    writeBatch(db);


  snap.docs.forEach(d => {

    batch.update(
      d.ref,
      {
        category: newName,
        categoryId: categoryId,
        updatedAt: serverTimestamp()
      }
    );

  });


  await batch.commit();


  if(snap.empty){

    const legacy =
      await getDocs(
        query(
          transactions,
          where(
            "category",
            "==",
            oldName
          )
        )
      );


    if(!legacy.empty){

      const batch2 =
        writeBatch(db);


      legacy.docs.forEach(d => {

        batch2.update(
          d.ref,
          {
            category: newName,
            categoryId: categoryId,
            updatedAt: serverTimestamp()
          }
        );

      });


      await batch2.commit();

    }

  }

};


/* =========================================================
   CONTADOR DE RECIBOS DA EMPRESA

   O contador começa em 338.
   O próximo recibo será 00339.
========================================================= */

export const nextCompanyReceiptNumber =
async (companyId) => {

  const ref =
    doc(
      db,
      "companies",
      companyId,
      "settings",
      "receiptCounter"
    );


  return runTransaction(
    db,
    async tx => {

      const snap =
        await tx.get(ref);


      const current =
        snap.exists()
          ? Number(
              snap.data().value || 338
            )
          : 338;


      const next =
        current + 1;


      tx.set(
        ref,
        {
          value: next
        },
        {
          merge: true
        }
      );


      return String(next)
        .padStart(5, "0");

    }
  );

};


/* =========================================================
   CONTADOR ANTIGO
   Mantido para compatibilidade.
========================================================= */

export const nextReceiptNumber = async (
  uid
) => {

  const ref =
    doc(
      db,
      "users",
      uid,
      "settings",
      "receiptCounter"
    );


  return runTransaction(
    db,
    async tx => {

      const snap =
        await tx.get(ref);


      const current =
        snap.exists()
          ? Number(
              snap.data().value || 338
            )
          : 338;


      const next =
        current + 1;


      tx.set(
        ref,
        {
          value: next
        },
        {
          merge: true
        }
      );


      return String(next)
        .padStart(5, "0");

    }
  );

};
