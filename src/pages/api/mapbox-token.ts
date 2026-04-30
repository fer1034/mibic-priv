export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const token = import.meta.env.MAPBOX_TOKEN;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
