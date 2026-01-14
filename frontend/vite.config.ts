import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    'process.env': {
      REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
    },
  },
});
