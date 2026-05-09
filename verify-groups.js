import { getVotes } from './src/lib/votesCache.js'
import { getGroupsMap } from './src/lib/groupsCache.js'

async function verifyGroups() {
  console.log('🔍 Vérification des groupes dans les votes...\n')

  const votes = await getVotes()
  const groupsMap = await getGroupsMap()

  // Collecter tous les groupes uniques des votes
  const groupesFromVotes = new Set()
  votes.forEach(vote => {
    if (vote.groupes) {
      vote.groupes.forEach(g => {
        groupesFromVotes.add(g.organeRef)
      })
    }
  })

  console.log(`📊 ${groupesFromVotes.size} groupes différents dans les votes:\n`)

  // Afficher chaque groupe
  const sortedGroups = Array.from(groupesFromVotes).sort()
  sortedGroups.forEach(groupId => {
    const groupName = groupsMap.get(groupId) || 'INCONNU'
    console.log(`${groupId} → ${groupName}`)
  })

  console.log('\n\n⚠️  Groupes non trouvés dans la map:')
  const missingGroups = sortedGroups.filter(g => !groupsMap.has(g))
  if (missingGroups.length === 0) {
    console.log('✓ Tous les groupes sont mappés!')
  } else {
    missingGroups.forEach(g => {
      console.log(`❌ ${g}`)
    })
  }
}

verifyGroups().catch(console.error)
