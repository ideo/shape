import PropTypes from 'prop-types'
import { Fragment, useState, useEffect } from 'react'

import {
  // LabelContainer,
  Select,
  SelectOption,
  Label,
  // LabelTextStandalone,
  // LabelHint,
} from '~/ui/global/styled/forms'
import { organizationsStore } from 'c-delta-organization-settings'
// Fetch all the categories and render the one with the ID of API
// match org subcategory to show current option
// update on change
const IndustrySubcategorySelectField = ({
  organization,
  industrySubcategories,
}) => {
  const [selectedCategory, setSelectedCategory] = useState({ name: '--None--' })
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {}, [organization])

  const handleChange = async e => {
    // TODO: this needs to open a confirmation modal before making the API call
    e.preventDefault()
    console.log('handle change', e.target.value)
    try {
      setIsLoading(true)
      const orgModel = new organizationsStore.model()
      const orgModelInstance = new orgModel({ id: organization.id })
      const data = {
        organization: {
          industry_subcategory_id: e.target.value,
        },
      }
      const promise = orgModelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      setSelectedCategory(result)
      setIsLoading(false)
    } catch (err) {
      console.log('subcategory update failed: ', err)
      setIsError(true)
      setIsLoading(false)
    }
    console.log(selectedCategory)
  }

  return (
    <div>
      {isError && <div>Something went wrong...</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Fragment>
          {/* Should these labels be their own component? */}
          <Label style={{ fontSize: '13px' }} id="subindustry-select-label">
            Industry
          </Label>
          <Select
            labelId="subindustry-select-label"
            classes={{
              root: 'select',
              selectMenu: 'selectMenu',
            }}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            onChange={e => handleChange(e)}
            value={selectedCategory.id}
            open={open}
            inline
          >
            {/* TODO: deal with placeholder if org has no subcategory */}
            {industrySubcategories.map(option => (
              <SelectOption
                classes={{
                  root: 'selectOption',
                  selected: 'selected',
                }}
                key={option.id} // TODO: need actual unique key here?
                value={option.id}
              >
                {option.name}
              </SelectOption>
            ))}
          </Select>
        </Fragment>
      )}
    </div>
  )
}

IndustrySubcategorySelectField.propTypes = {
  organization: PropTypes.object,
  industrySubcategories: PropTypes.arrayOf(PropTypes.object),
}

export default IndustrySubcategorySelectField
