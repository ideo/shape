import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { organizationsStore } from 'c-delta-organization-settings'

import IndustrySubcategorySelectField from './IndustrySubcategory'

// TODO: Move all this BU stuff to the Teams tab
// Looks like the Org tab is for a C∆ org, not a business unit
const OrganizationTab = ({ orgId }) => {
  const [organization, setOrganization] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    console.log('in orgtab use effect: ', orgId)
    async function getUserOrganization() {
      console.log('in getUserOrg, orgStore: ', organizationsStore)
      // debugger
      const orgModel = new organizationsStore.model()
      const orgModelInstance = new orgModel()
      orgModelInstance.set({
        id: orgId,
        collection: organizationsStore,
      })
      console.log('orgmodelinstance: ', orgModelInstance.toJS())
      try {
        setIsLoading(true)
        console.log('fetching org id: ', orgId)
        const response = await orgModelInstance.fetch({
          id: orgId,
        })
        console.log('org response: ', response)
        setOrganization(response)
        setIsLoading(false)
        console.log('user org', organization)
      } catch (err) {
        console.log('request org failed: ', err)
        setIsError(true)
      }
    }

    getUserOrganization()
  }, [])

  return (
    <div>
      {isError && <div> Something went wrong... </div>}
      {isLoading ? (
        <div> Loading... </div>
      ) : (
        <form>
          <IndustrySubcategorySelectField organization={organization} />
        </form>
      )}
    </div>
  )
}

OrganizationTab.propTypes = {
  orgId: PropTypes.number,
}

export default OrganizationTab
