import { promises as fs } from 'fs'
import path from 'path'

const CACHE_DIR = path.join(process.cwd(), '.cache')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const files = await fs.readdir(CACHE_DIR)
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const stat = await fs.stat(path.join(CACHE_DIR, file))
          return {
            name: file,
            size: stat.size,
            modified: stat.mtime,
          }
        })
      )
      res.status(200).json({ status: 'ok', files: fileStats, total: fileStats.length })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      const files = await fs.readdir(CACHE_DIR)
      await Promise.all(
        files.map((file) => fs.unlink(path.join(CACHE_DIR, file)))
      )
      res.status(200).json({ status: 'cleared', filesDeleted: files.length })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
