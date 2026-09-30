# Caderno financeiro

PWA mobile-first em React + Vite + Firebase.

## Rodar localmente

1. Instale Node.js LTS.
2. Entre na pasta.
3. `npm install`
4. Copie `.env.example` para `.env`.
5. Preencha as variáveis do Firebase.
6. `npm run dev`

## Build

`npm run build`

## Firebase

Ative Authentication > Email/Password e crie o Firestore.
Publique as regras de `firestore.rules`.

## Hospedagem

Com Firebase CLI:
`npm install -g firebase-tools`
`firebase login`
`firebase init hosting`
`npm run build`
`firebase deploy`

## Observações

A geração PDF ocorre no navegador. O PWA usa cache/IndexedDB do Firestore para consulta offline. A sincronização exige conexão quando o dispositivo ainda não possui os dados.


## Instalação como aplicativo

Android: abra o endereço publicado no Chrome e use "Instalar aplicativo" / "Adicionar à tela inicial".
iPhone: abra no Safari, toque em Compartilhar > Adicionar à Tela de Início.

## Google Play

Depois de validar a PWA, ela pode ser empacotada como aplicativo Android com Trusted Web Activity (Bubblewrap) ou PWABuilder. Isso é uma etapa posterior; primeiro publique e teste a versão web.
