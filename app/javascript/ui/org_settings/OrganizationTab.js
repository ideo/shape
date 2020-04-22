import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { organizationsStore } from 'c-delta-organization-settings'

import {
  // LabelContainer,
  Select,
  SelectOption,
  // LabelTextStandalone,
  // LabelHint,
} from '~/ui/global/styled/forms'

const options = [
  { id: 1, name: 'foo' },
  {
    id: 2,
    name: 'bar',
  },
]

// TODO: Move all this BU stuff to the Teams tab
// Looks like the Org tab is for a C∆ org, not a business unit
const OrganizationTab = ({ orgId }) => {
  const [organization, setOrganization] = useState(0)

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
        console.log('fetching org id: ', orgId)
        // WHY IS THIS NOT FETCHING A SINGLE MODEL?
        const response = await orgModelInstance.fetch({
          id: orgId,
        })
        console.log('org response: ', response)
        setOrganization(response)
        console.log('user org', organization)
      } catch (err) {
        console.log('request org failed: ', err)
        return 'Error loading org'
      }
    }

    getUserOrganization()
  }, [])

  // TODO: extract industry subcategory select to component
  // since it will be used in both tabs
  return (
    <form>
      <input type="text" value={organization.name_display} />
      <Select
        label="Industry Subcategory"
        classes={{
          root: 'select',
          selectMenu: 'selectMenu',
        }}
        displayEmpty
        disableUnderline
        // onChange={handleIndustrySubcategoryChange}
        // onClose={() => setSubcategoryMenu(false)}
        // value={industrySubcategory.name}
        // open={subcategoryMenu}
        // inline
      >
        {options.map(option => (
          <SelectOption
            classes={{
              root: 'selectOption',
              selected: 'selected',
            }}
            key={option.id}
            value={option.name}
          >
            {option.name}
          </SelectOption>
        ))}
      </Select>
    </form>
  )
}

OrganizationTab.propTypes = {
  orgId: PropTypes.number,
}

export default OrganizationTab
