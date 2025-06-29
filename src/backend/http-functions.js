import { ok, serverError } from 'wix-http-functions';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

export async function get_viator(request) {
  try {
    const apiKey = await getSecret('viatorApiKey');
    const env = await getSecret('viatorEnv');
    const baseUrl = env === 'production'
      ? 'https://api.viator.com/partner'
      : 'https://api.sandbox.viator.com/partner';

    const page = Number(request.query.page) || 1;
    const search = request.query.search || '';
    const url = `${baseUrl}/v1/products/search?text=${encodeURIComponent(search)}&page=${page}&pageSize=10`;

    const response = await fetch(url, {
      headers: {
        'API-key': apiKey,
        'Accept-Language': 'es-ES',
        'Accept': 'application/json;version=2.0'
      }
    });

    if (!response.ok) {
      console.error('Viator API error', response.status);
      return serverError({
        headers: { 'Content-Type': 'application/json' },
        body: { error: `Viator API ${response.status}` }
      });
    }

    const data = await response.json();
    return ok({ headers: { 'Content-Type': 'application/json' }, body: data });
  } catch (err) {
    console.error('get_viator error', err);
    return serverError({ headers: { 'Content-Type': 'application/json' }, body: { error: 'Internal error' } });
  }
}
