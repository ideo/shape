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
import {
  organizationsStore,
  // TODO: replace with contentVersionsStore
} from 'c-delta-organization-settings'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'
// Fetch all the categories and render the one with the ID of API
// match org subcategory to show current option
// update on change
const ContentVersionSelectField = ({ organization }) => {
  const [contentVersions, setContentVersions] = useState([])
  const [contentVersion, setContentVersion] = useState({
    name: '--None--', // TODO: update if needed
  })
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    async function getContentVersions() {
      try {
        setIsLoading(true)
        // const result = await contentVersionsStore.fetch()
        // console.log('contentversions fetch: ', result)
        // setSubcategories(result)
        setContentVersions([
          { name: 'foo', id: 1 },
          { name: 'bar', id: 2 },
        ])
        setIsLoading(false)
      } catch (err) {
        console.log('content version request failed')
        setIsError(err)
      }
    }

    getContentVersions()
  }, [organization])

  const handleChange = async e => {
    e.preventDefault()
    console.log('handle change', e.target.value)
    try {
      setIsLoading(true)
      const orgModel = new organizationsStore.model()
      const orgModelInstance = new orgModel({
        id: organization.id,
      })
      console.log('isNew?: ', orgModelInstance.isNew)
      const promise = orgModelInstance.save(
        {
          organization: {
            default_content_version: e.target.value,
          },
        },
        {
          optimistic: false,
          // , patch: false
        }
        // need patch false because the fetch adapter does not support PATCH
      )
      const result = await promise
      setContentVersion(result)
      setIsLoading(false)
    } catch (err) {
      console.log('content version update failed: ', err)
      setIsError(true)
      setIsLoading(false)
    }
  }

  return (
    <div>
      {isError && <div> Something went wrong... </div>}
      {isLoading ? (
        <div>Loading... </div>
      ) : (
        <Fragment>
          {/* TODO: Should these labels be their own component? */}
          <Label
            style={{
              fontSize: '13px',
              marginTop: '28px',
            }}
            id="content-version-select-label"
          >
            Content Version {''}
            <HoverableDescriptionIcon
              description={
                'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
              }
              width={16}
            />
          </Label>
          <Select
            labelId="content-version-select-label"
            classes={{
              root: 'select',
              selectMenu: 'selectMenu',
            }}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            onChange={e => handleChange(e)}
            value={contentVersion}
            open={open}
            // inline
          >
            {/* TODO: deal with placeholder if org has no subcategory */}
            {contentVersions.map(option => (
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

ContentVersionSelectField.propTypes = {
  organization: PropTypes.object,
}

export default ContentVersionSelectField
