import { getAmendmentText } from './src/lib/amendmentsCache.js'
import { getVotes } from './src/lib/votesCache.js'

async function testAmendments16() {
  console.log('🧪 Test de la 16e législature\n')

  try {
    // 1. D'abord, récupérer les votes et voir les amendements trouvés
    console.log('📊 Récupération des votes...')
    const votes = await getVotes()
    console.log(`✅ ${votes.length} votes chargés\n`)

    // Trouver les votes avec amendements
    const votesWithAmends = votes.filter(v => v.amendementNumero)
    console.log(`📋 Votes avec amendement trouvés: ${votesWithAmends.length}`)

    if (votesWithAmends.length > 0) {
      console.log('Premiers 5 amendements trouvés:')
      votesWithAmends.slice(0, 5).forEach(v => {
        console.log(`  - Numéro: ${v.amendementNumero} | Titre: ${v.titre.substring(0, 60)}...`)
      })
    }

    // 2. Tester avec des amendements spécifiques
    console.log('\n🔍 Test de récupération spécifique...')

    const testNumbers = ['509', '281', '001', '100', '500', '1000']

    for (const num of testNumbers) {
      try {
        const result = await getAmendmentText(num)
        if (result) {
          console.log(`\n✅ Amendement ${num}:`)
          console.log(`   exposeSommaire: ${result.exposeSommaire ? result.exposeSommaire.substring(0, 100) + '...' : '(vide)'}`)
          console.log(`   dispositif: ${result.dispositif ? result.dispositif.substring(0, 100) + '...' : '(vide)'}`)
        } else {
          console.log(`❌ Amendement ${num}: NON TROUVÉ`)
        }
      } catch (e) {
        console.log(`❌ Amendement ${num}: ERREUR - ${e.message}`)
      }
    }

    // 3. Trouver un amendement qui existe réellement
    if (votesWithAmends.length > 0) {
      console.log('\n\n🎯 Test avec amendement existant:')
      const realAmend = votesWithAmends[0].amendementNumero
      console.log(`Essai avec amendement ${realAmend}...`)

      const result = await getAmendmentText(realAmend)
      if (result) {
        console.log('✅ Données reçues:')
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log('❌ Aucune donnée retournée')
      }
    }

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error.message)
  }
}

testAmendments16().catch(console.error).finally(() => process.exit(0))
