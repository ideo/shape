import { useState, useEffect } from 'react'
import _ from 'lodash'

import { businessUnitsStore } from 'c-delta-organization-settings'
import { Row } from '../global/styled/layout'
import { Select, SelectOption } from '~/ui/global/styled/forms'

const options = [
  {
    id: 1,
    name: 'foo',
  },
  {
    id: 2,
    name: 'bar',
  },
]

const TeamsTab = () => {
  const [subcategoryMenu, setSubcategoryMenu] = useState(false)
  const [industrySubcategoryOptions, setIndustrySubcategoryOptions] = useState(
    []
  )
  const initialIndustrySubcategory = options[1]
  const [industrySubcategory, setIndustrySubcategory] = useState(
    initialIndustrySubcategory
  )

  function handleIndustrySubcategoryChange(e) {
    e.preventDefault()

    setIndustrySubcategory(e.target.value)
    // AJAX call to update value
  }

  useEffect(() => {
    // TODO: Extract to be a custom effect?
    // Filter data to just be subcategory names and ids?
    async function businessUnits() {
      console.log('fetching BUs')
      try {
        const response = await businessUnitsStore.fetch()
        console.log('BU response: ', response)
        const subcategories = _.pick(response, [
          'industry_subcategory_id',
          'industry_subcategory_name',
        ])
        setIndustrySubcategoryOptions(subcategories)
      } catch (err) {
        console.log('failed to fetch BUs: ', err)
      }
    }
    businessUnits()
  }, [])

  // TODO: figure out table implemenation
  return (
    <div>
      C∆ Teams
      {industrySubcategoryOptions.map(option => (
        <Row>
          <form>
            <Select
              label="Industry Subcategory"
              classes={{
                root: 'select',
                selectMenu: 'selectMenu',
              }}
              displayEmpty
              disableUnderline
              onChange={handleIndustrySubcategoryChange}
              onClose={() => setSubcategoryMenu(false)}
              value={industrySubcategory.name}
              open={subcategoryMenu}
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
                  {option.name}{' '}
                </SelectOption>
              ))}{' '}
            </Select>{' '}
          </form>
        </Row>
      ))}
    </div>
  )
}

export default TeamsTab
