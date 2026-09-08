import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const publicDir = fileURLToPath(new URL('./public', import.meta.url))

function servePublicDirectoryIndex(): Plugin {
  return {
    name: 'serve-public-directory-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET') {
          next()
          return
        }
        const url = (req.url ?? '').split('?')[0]
        if (!url.endsWith('/')) {
          next()
          return
        }
        const rel = decodeURIComponent(url).replace(/^\/+/, '')
        const indexPath = path.join(publicDir, rel, 'index.html')
        if (indexPath.startsWith(publicDir + path.sep) && fs.existsSync(indexPath)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(fs.readFileSync(indexPath))
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    servePublicDirectoryIndex(),
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
      },
      '/server': {
        target: 'http://127.0.0.1:3030',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/server/, ''),
      }
    }
  }
})
