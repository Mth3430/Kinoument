import { getVotes } from './src/lib/votesCache.js'
import { getGroupsMap } from './src/lib/groupsCache.js'

async function verifyVotes() {
  console.log('📋 Vérification des votes...\n')

  const votes = await getVotes()
  const groupsMap = await getGroupsMap()

  console.log(`✓ ${votes.length} votes chargés\n`)

  // Vérifier les 10 premiers votes
  const samplesToCheck = votes.slice(0, 10)

  samplesToCheck.forEach((vote, idx) => {
    console.log(`\n📌 Vote #${vote.numero}:`)
    console.log(`   Titre: ${(vote.titre || vote.objet || '').substring(0, 80)}...`)
    console.log(`   Date: ${vote.dateScrutin || 'N/A'}`)
    console.log(`   Groupes qui ont voté:`)

    if (vote.groupes && vote.groupes.length > 0) {
      vote.groupes.slice(0, 5).forEach(g => {
        const groupName = groupsMap.get(g.organeRef) || g.organeRef
        console.log(`     - ${groupName}: ${g.positionMajoritaire || 'N/A'}`)
      })
      if (vote.groupes.length > 5) {
        console.log(`     ... +${vote.groupes.length - 5} autres groupes`)
      }
    } else {
      console.log(`     ⚠️  Aucun groupe trouvé`)
    }

    if (vote.amendementNumero) {
      console.log(`   Amendement: #${vote.amendementNumero}`)
    }
  })

  console.log('\n\n📊 Statistiques:')
  const votesWithGroupes = votes.filter(v => v.groupes && v.groupes.length > 0).length
  const votesWithAmendments = votes.filter(v => v.amendementNumero).length

  console.log(`✓ ${votesWithGroupes}/${votes.length} votes ont des groupes`)
  console.log(`✓ ${votesWithAmendments}/${votes.length} votes ont des amendements`)
}

verifyVotes().catch(console.error)
