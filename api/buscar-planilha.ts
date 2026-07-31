import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    // Tenta resolver o site do SharePoint
    const siteRes = await fetch(
      'https://graph.microsoft.com/v1.0/sites/ultrafitacademia.sharepoint.com:/sites/ConsultoriadeCampo',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const siteData = await siteRes.json() as { id?: string; error?: unknown };
    results['site'] = siteData;

    // Se achou o site, lista os drives
    if (siteData.id) {
      const drivesRes = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteData.id}/drives`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      results['drives'] = await drivesRes.json();
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
