const OLLAMA_URL = 'http://localhost:11434/api/generate'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'

export default async function handler(req, res) {
  try {
    const r = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: 'Réponds juste "ok".',
        stream: false,
        num_gpu: 1,
        num_thread: 2,
        keep_alive: '5m'
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return res.status(502).json({ ollama: false, error: `HTTP ${r.status}` })
    const data = await r.json()
    res.status(200).json({ ollama: true, model: OLLAMA_MODEL, response: data.response })
  } catch (e) {
    res.status(200).json({ ollama: false, error: e.message })
  }
}
