import type { VercelRequest, VercelResponse } from '@vercel/node';

const PASTA_IDS = [
  { name: 'OPERAÇÕES',       id: '012OBHEM5IBO5V6QUT2RHZJV7XBXNBSEUF' },
  { name: 'PRAXIS BUSINESS', id: '012OBHEM3YMUGT6LKJHRF2F2MW4ULZR6HW' },
  { name: 'TECNOLOGIA',      id: '012OBHEM2UMEUXC25TZ5AY45MI7GXIDLJJ' },
  { name: 'RELATÓRIOS',      id: '012OBHEM2W35BKAOAPPFDIRORAOYGSYKHQ' },
];

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.TENANT_ID ?? process.env.VITE_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: (process.env.CLIENT_ID ?? process.env.VITE_CLIENT_ID)!,
          client_secret: (process.env.CLIENT_SECRET ?? process.env.VITE_CLIENT_SECRET)!,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );

    const tokenData = await tokenRes.json() as { access_token?: string; error_description?: string };
    if (!tokenData.access_token) {
      return res.status(500).json({ error: tokenData.error_description ?? 'Token não obtido' });
    }

    const results: Record<string, unknown> = {};

    for (const pasta of PASTA_IDS) {
      const r = await fetch(
        `https://graph.microsoft.com/v1.0/users/guilherme.lacerda@ultraacademia.com.br/drive/items/${pasta.id}/children?$select=id,name,lastModifiedDateTime&$top=50`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const data = await r.json() as { value?: { id: string; name: string; lastModifiedDateTime: string }[] };
      results[pasta.name] = (data.value ?? []).map(f => ({ id: f.id, name: f.name, modified: f.lastModifiedDateTime }));
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
