import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = n => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n||0));

export function reportPdf({title, period, revenue, expense, balance, byCategory, transactions, notes}) {
  const pdf = new jsPDF();
  pdf.setFillColor(37,99,235); pdf.rect(0,0,210,28,"F");
  pdf.setTextColor(255,255,255); pdf.setFontSize(18); pdf.text(title,14,12);
  pdf.setFontSize(10); pdf.text(period,14,20);
  pdf.setTextColor(30,30,30);
  autoTable(pdf,{startY:36,head:[["Receitas","Despesas","Saldo"]],body:[[money(revenue),money(expense),money(balance)]],theme:"grid"});
  let y = pdf.lastAutoTable.finalY + 8;
  autoTable(pdf,{startY:y,head:[["Categoria","Tipo","Total","%"]],body:byCategory.map(x=>[x.category,x.type,money(x.total),`${x.pct.toFixed(1)}%`]),theme:"striped"});
  y = pdf.lastAutoTable.finalY + 8;
  autoTable(pdf,{startY:y,head:[["Data","Tipo","Categoria","Descrição","Valor"]],body:transactions.map(x=>[x.date,x.type==="income"?"Receita":"Despesa",x.category,x.description,money(x.amount)]),theme:"striped",styles:{fontSize:8}});
  y = pdf.lastAutoTable.finalY + 8;
  if (notes?.length) {
    pdf.setFontSize(12); pdf.text("Anotações",14,y); y+=6;
    pdf.setFontSize(9);
    notes.forEach(n => { pdf.text(`${n.date}: ${n.text}`,14,y); y+=5; if(y>280){pdf.addPage();y=20;} });
  }
  const pages = pdf.internal.getNumberOfPages();
  for(let p=1;p<=pages;p++){pdf.setPage(p);pdf.setFontSize(8);pdf.setTextColor(100);pdf.text(`Caderno financeiro • ${new Date().toLocaleDateString("pt-BR")} • ${p}/${pages}`,14,290);}
  pdf.save(`relatorio-${period.replaceAll("/","-")}.pdf`);
}

export function receiptPdf({receipt, company, width}) {
  const isThermal = width === 55;
  const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:isThermal?[55,180]:"a5"});
  const W = isThermal ? 55 : 148;
  let y=10, x=isThermal?4:12;
  pdf.setFont("courier","normal");
  pdf.setFontSize(isThermal?9:12);
  const center = t => pdf.text(String(t),W/2,y,{align:"center"});
  center(company.name); y+=5; center(company.address); y+=5; center(`CNPJ: ${company.cnpj}`); y+=8;
  center(`RECIBO: ${receipt.number}`); y+=6;
  pdf.text(`DATA: ${receipt.date}`,x,y); y+=7;
  pdf.text(`CLIENTE: ${receipt.client}`,x,y); y+=5;
  if(receipt.cpf) {pdf.text(`CPF: ${receipt.cpf}`,x,y);y+=5;}
  y+=3; pdf.text("DESCRIÇÃO",x,y); y+=6;
  const desc = `${receipt.quantity} x ${receipt.description}`;
  pdf.text(desc,x,y,{maxWidth:W-2*x}); y+=6;
  pdf.text(`VALOR UN: ${money(receipt.unitValue)}`,x,y); y+=6;
  pdf.text(`TOTAL: ${money(receipt.total)}`,x,y); y+=10;
  center("Obrigado pela preferência!"); y+=7; center(company.phone);
  pdf.save(`recibo-${receipt.number}.pdf`);
}
