import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import taskMentorI18nBabelPlugin from "./build/i18nBabelPlugin.js";
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: { plugins: [taskMentorI18nBabelPlugin] },
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:4444",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://localhost:4444",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:4444",
                ws: true,
                changeOrigin: true,
            },
        },
    },
});
