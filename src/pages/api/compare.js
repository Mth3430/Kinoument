import { compareProposal } from '../../lib/compareLogic'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { proposal = 'amende', partyGroup = 'PO845407' } = req.query
    req = { ...req, method: 'POST', body: { proposal, partyGroup } }
  } else if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { proposal, partyGroup } = req.body ?? req.query
  if (!proposal || !partyGroup) return res.status(400).json({ error: 'Missing required fields' })

  try {
    const result = await compareProposal(proposal, partyGroup)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
