import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173, 
    proxy: {
      // 代理 DashScope API
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,  // 重要：修改请求头中的 origin
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
        // configure: (proxy, options) => {
        //   // 添加请求头（包括 API Key）
        //   proxy.on('proxyReq', (proxyReq, req, res) => {
        //     // 在这里添加 Authorization 头
        //     proxyReq.setHeader(
        //       'Authorization',
        //       `Bearer ${process.env.VITE_DASHSCOPE_API_KEY}`
        //     );
        //     proxyReq.setHeader('Content-Type', 'application/json');
        //   });
        // }
      },
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
      }
    }
  }
})
