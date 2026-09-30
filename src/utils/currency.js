export const money = n => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n||0));
export const parseMoney = v => Number(String(v).replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,"")) || 0;
