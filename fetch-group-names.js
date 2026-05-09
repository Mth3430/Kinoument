// Fetch current groups from National Assembly API
async function fetchGroupDefinitions() {
  try {
    // Try to fetch from the groups endpoint
    const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/json/organes/groupes/GroupesRef.json')
    const data = await response.json()

    console.log('\n=== GROUP DEFINITIONS ===\n')

    if (Array.isArray(data)) {
      data.forEach(group => {
        console.log(`${group.uid}: ${group.libelle}`)
      })
    } else if (data.organes) {
      data.organes.forEach(group => {
        console.log(`${group.uid}: ${group.libelle}`)
      })
    } else {
      console.log('Raw data structure:')
      console.log(JSON.stringify(data, null, 2).substring(0, 500))
    }
  } catch (err) {
    console.error('Error:', err.message)

    // Try alternate endpoint
    console.log('\nTrying alternate endpoint...')
    try {
      const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/json/deputes/Deputes.json')
      const data = await response.json()
      console.log('Alternate endpoint returned data with keys:', Object.keys(data).slice(0, 5))
    } catch (err2) {
      console.error('Alternate also failed:', err2.message)
    }
  }
}

fetchGroupDefinitions()
