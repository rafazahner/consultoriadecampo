import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.VITE_TENANT_ID ?? process.env.TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: (process.env.VITE_CLIENT_ID ?? process.env.CLIENT_ID)!,
          client_secret: (process.env.VITE_CLIENT_SECRET ?? process.env.CLIENT_SECRET)!,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );

    const tokenData = await tokenRes.json() as { access_token?: string; error_description?: string };
    if (!tokenData.access_token) {
      return res.status(500).json({ error: tokenData.error_description ?? 'Token não obtido' });
    }

    const graphRes = await fetch(
      "https://graph.microsoft.com/v1.0/drives/b!S7AfAMvfOUSsYZCBzRit7g66NAyfUONLmsQyYgOBvx-RGSBAaSQbR4lvNOFe4Vui/items/AA9FA19B-A653-432C-8926-1BC4A465B21F/workbook/worksheets('DADOS')/usedRange",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    const data = await graphRes.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
