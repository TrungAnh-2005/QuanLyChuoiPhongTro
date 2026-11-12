import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({mode}) => {
 const env = loadEnv(mode,process.cwd(),'');
 return {
 plugins:[react(),tailwindcss()],
 server:{host:true,port:5173,proxy:{'/api':{target:env.GATEWAY_URL || 'http://localhost:8080',changeOrigin:true}}}
};
});
