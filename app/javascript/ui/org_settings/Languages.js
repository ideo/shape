import { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  // organizationsStore,
  supportedLanguagesStore,
} from 'c-delta-organization-settings'

import { Label } from '~/ui/global/styled/forms'
import TagEditor from '~/ui/pages/shared/TagEditor'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'

const Languages = ({ organization }) => {
  const [languageOptions, setLanguageOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const getSupportedLanguages = async () => {
      try {
        setIsLoading(true)
        const response = await supportedLanguagesStore.fetch()
        console.log(response)
        // const response = options
        setLanguageOptions(response)
        setIsLoading(false)
      } catch (err) {
        console.log('failed to fetch languages')
        setIsError(true)
        setIsLoading(false)
      }
    }
    getSupportedLanguages()
  }, [])

  const validateTag = language => {
    console.log('validate language: ', language)
    console.log('language options: ', languageOptions)
    let error = null
    let tag = null
    tag = _.find(languageOptions, option => option.name === tag)
    console.log('found tag: ', tag)
    if (!tag) error = 'Please enter a valid language option.'

    console.log(tag, error)
    return {
      tag,
      error,
    }
  }

  const afterAddRemoveTag = language => {
    console.log('afteraddremove: ', language)
    // capture value
    // patch organization
    // const updateLanguages = async () => {
    //   try {
    //     setIsLoading(true)
    //     const orgModel = new organizationsStore.model()
    //     const orgModelInstance = new orgModel({
    //       id: organization.id,
    //     })
    //     const promise = orgModelInstance.save(
    //       {
    //         organization: {
    //           supported_languages: selectedLanguages,
    //         },
    //       },
    //       {
    //         optimistic: false,
    //       }
    //     )
    //     const result = await promise
    //     setSelectedLanguages(result)
    //     setIsLoading(false)
    //   } catch (err) {
    //     console.log('language update failed: ', err)
    //     setIsError(true)
    //     setIsLoading(false)
    //   }
    // }
    // updateLanguages()
  }

  return (
    <div>
      {isError && <div>Something went wrong... </div>}
      {isLoading ? (
        <div>Loading... </div>
      ) : (
        <Fragment>
          <Label
            style={{
              fontSize: '13px',
              marginTop: '28px',
            }}
            id="content-version-select-label"
          >
            Languages{''}
            <HoverableDescriptionIcon
              description={
                'Please select the primary language(s) used at your organization.'
              }
              width={16}
            />
          </Label>
          <TagEditor
            canEdit
            validateTag={validateTag}
            placeholder="add additional available languages"
            records={[organization]}
            tagField="supported_languages"
            tagColor="white"
            afterAddTag={afterAddRemoveTag}
            afterRemoveTag={afterAddRemoveTag}
          />
        </Fragment>
      )}
    </div>
  )
}

Languages.propTypes = {
  organization: PropTypes.object,
}

export default Languages
