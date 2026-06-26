// api/tmdb.js — Proxy serverless para a API do TMDB
// Guarda a chave em variável de ambiente no Vercel (TMDB_API_KEY)
// e recebe ?path=/search/movie&query=xxx do dashboard.html

export default async function handler(req, res) {
  // CORS: permite acesso do mesmo site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TMDB_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY não configurada nas variáveis de ambiente do Vercel.' });
  }

  // Pega o caminho da rota TMDB que o dashboard quer acessar, ex: /search/movie
  const { path, ...otherParams } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'Parâmetro "path" é obrigatório.' });
  }

  // Monta a URL final do TMDB
  const params = new URLSearchParams({ ...otherParams, api_key: TMDB_KEY, language: 'pt-BR' });
  const tmdbUrl = `https://api.themoviedb.org/3${path}?${params.toString()}`;

  try {
    const tmdbRes = await fetch(tmdbUrl);
    const data = await tmdbRes.json();

    if (!tmdbRes.ok) {
      return res.status(tmdbRes.status).json({ error: data?.status_message || 'Erro ao consultar TMDB' });
    }

    // Cache de 5 minutos para resultados de busca
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Falha na requisição ao TMDB: ' + err.message });
  }
}
