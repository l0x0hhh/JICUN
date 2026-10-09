// 默认从域名根目录部署；Pages 工作流通过 --base 传入实际仓库子路径。
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ base: '/', plugins: [react()] })
