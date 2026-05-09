import { unzipSync } from 'fflate'

async function check113() {
  const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip', {
    signal: AbortSignal.timeout(600000)
  })
  const uint8 = new Uint8Array(await response.arrayBuffer())
  const archive = unzipSync(uint8)

  const fileName = 'AMANR5L16PO59047BTC2071P0D1N000113.json'
  const text = new TextDecoder().decode(archive[fileName])
  const data = JSON.parse(text)
  const amdt = data.amendement || data

  console.log('Amendement #113 - corps:')
  console.log(JSON.stringify(amdt.corps, null, 2))
}

check113().catch(console.error).finally(() => process.exit(0))
