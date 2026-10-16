import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuration Vite.
 *
 * Le frontend parle au backend via VITE_API_URL (voir .env.development) :
 * aucune URL n'est écrite en dur dans le code des composants.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: Number(env['VITE_DEV_PORT'] ?? 5173),
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
