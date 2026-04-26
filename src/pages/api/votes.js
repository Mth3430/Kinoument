import { getVotes } from '../../lib/votesCache'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const votes = await getVotes()
    res.status(200).json({ votes })
  } catch (error) {
    res.status(502).json({ error: error.message })
  }
}
