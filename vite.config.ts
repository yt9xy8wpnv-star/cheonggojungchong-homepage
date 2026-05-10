import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 빌드된 파일들을 상대 경로로 참조하도록 설정합니다.
})