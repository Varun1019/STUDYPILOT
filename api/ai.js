import { handleAiRequest } from '../server/apiPlugin.js';

export default async function handler(req, res) {
  // Add CORS headers for cross-origin callers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  await handleAiRequest(req, res);
}
