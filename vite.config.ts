import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function graphApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'graph-api',
    configureServer(server) {
      server.middlewares.use('/api/dados', async (_req, res) => {
        try {
          const tokenRes = await fetch(
            `https://login.microsoftonline.com/${env.VITE_TENANT_ID}/oauth2/v2.0/token`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: env.VITE_CLIENT_ID,
                client_secret: env.VITE_CLIENT_SECRET,
                scope: 'https://graph.microsoft.com/.default',
              }),
            }
          );
          const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
          if (!tokenData.access_token) {
            console.error('[graph-api] token error:', tokenData);
            throw new Error(tokenData.error_description ?? tokenData.error ?? 'Token não obtido');
          }

          const graphRes = await fetch(
            "https://graph.microsoft.com/v1.0/users/guilherme.lacerda@ultraacademia.com.br/drive/items/C190CA03-6BCF-4E51-B246-824877B19FF0/workbook/worksheets('DADOS')/usedRange",
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          );
          const graphData = await graphRes.json();

          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(graphData));
        } catch (err) {
          console.error('[graph-api] erro:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), graphApiPlugin(env)],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
