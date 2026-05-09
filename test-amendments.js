import { getAmendmentText } from './src/lib/amendmentsCache.js'

// Test si les amendements sont vraiment récupérés
async function testAmendments() {
  console.log('🧪 Test de récupération des amendements...\n')

  try {
    // Teste avec l'amendement du screenshot
    const testNumero = '281'
    console.log(`Essai de récupérer l'amendement n° ${testNumero}...`)
    const result = await getAmendmentText(testNumero)

    if (result) {
      console.log('✅ Amendement trouvé!')
      console.log('Données reçues:')
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('❌ Amendement NON trouvé (null)')
      console.log('Cela signifie que:')
      console.log('  1. Le numéro n\'existe pas')
      console.log('  2. L\'API ne retourne pas les données')
      console.log('  3. La structure des données est différente')
    }
  } catch (error) {
    console.log('❌ ERREUR lors de la récupération:')
    console.log(error.message)
  }

  // Test quelques autres amendements
  console.log('\n---\nTest avec d\'autres numéros:')
  const testNumbers = ['001', '1', '100', '500']

  for (const num of testNumbers) {
    try {
      const result = await getAmendmentText(num)
      console.log(`\nAm${num}: ${result ? '✅ Trouvé' : '❌ Non trouvé'}`)
      if (result) {
        console.log(`  - exposeSommaire: ${result.exposeSommaire ? '✅' : '❌'}`)
        console.log(`  - dispositif: ${result.dispositif ? '✅' : '❌'}`)
        console.log(`  - Sample: ${(result.exposeSommaire || result.dispositif || '').substring(0, 100)}...`)
      }
    } catch (e) {
      console.log(`Am${num}: ❌ Erreur - ${e.message}`)
    }
  }
}

testAmendments().catch(console.error)
