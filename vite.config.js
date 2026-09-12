import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    // /api만 wrangler로 넘긴다. 터미널 둘로 돈다.
    //   npm run dev       화면 (5173)
    //   npm run dev:api   함수 (8788)
    //
    // wrangler를 안 켜면 이 프록시가 실패하고 core가 fallback 대사로 답한다.
    // P4까지의 상태가 그대로라 폴백 경로가 매일 자동으로 검증되는 셈이다.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
});