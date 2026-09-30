import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Caderno financeiro",
        short_name: "Caderno",
        description: "Controle financeiro pessoal e empresarial",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        lang: "pt-BR",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "firestore", networkTimeoutSeconds: 5 }
          }
        ]
      }
    })
  ]
});
