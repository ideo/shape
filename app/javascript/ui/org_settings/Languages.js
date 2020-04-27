import { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import {
  organizationsStore,
  supportedLanguagesStore,
} from 'c-delta-organization-settings'

import StyledReactTags from '~/ui/pages/shared/StyledReactTags'
import Pill from '~/ui/global/Pill'
import { Label } from '~/ui/global/styled/forms'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'

const Languages = ({ organization = {} }) => {
  const [languageOptions, setLanguageOptions] = useState([])
  const [orgLanguages, setOrgLanguages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const getSupportedLanguages = async () => {
      try {
        setIsLoading(true)
        const response = await supportedLanguagesStore.fetch()
        console.log(response)
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

  // const typeaheadOptions = () => _.map(languageOptions, option => option.name)
  const languagesFromOrg = () =>
    _.filter(languageOptions, option =>
      organization.supported_languages.includes(option.handle)
    )

  // const validateTag = language => {
  //   console.log('validate language: ', language)
  //   console.log('language options: ', languageOptions)
  //   let error = null
  //   let tag = null
  //   tag = _.find(languageOptions, option => option.name === tag)
  //   console.log('found tag: ', tag)
  //   if (!tag) error = 'Please enter a valid language option.'

  //   console.log(tag, error)
  //   return {
  //     tag,
  //     error,
  //   }
  // }

  const afterAddRemoveTag = tag => {
    console.log('event add/remove', event)
    console.log('afteraddremove: ', tag)
    console.log(orgLanguages)
    // capture value
    // patch organization
    const updateLanguages = async () => {
      try {
        setIsLoading(true)
        const orgModel = new organizationsStore.model()
        const orgModelInstance = new orgModel({
          id: organization.id,
        })
        const promise = orgModelInstance.save(
          {
            organization: {
              supported_languages: organization.supported_languages.concat([
                tag.handle,
              ]),
            },
          },
          {
            optimistic: false,
          }
        )
        const result = await promise
        setOrgLanguages(result.supported_languages)
        setIsLoading(false)
      } catch (err) {
        console.log('language update failed: ', err)
        setIsError(true)
        setIsLoading(false)
      }
    }
    updateLanguages()
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
          <StyledReactTags>
            <ReactTags
              tags={languagesFromOrg()}
              suggestions={languageOptions}
              allowBackspace={false}
              delimiterChars={[',']}
              placeholder={'add additional available languages'}
              handleAddition={tag => afterAddRemoveTag(tag)}
              handleDelete={tag => ev => afterAddRemoveTag(tag)}
              // handleInputChange={this.onInputChange}
              tagComponent={Pill}
              // allowNew
            />
          </StyledReactTags>
        </Fragment>
      )}
    </div>
  )
}

Languages.propTypes = {
  organization: PropTypes.object,
}

export default Languages
