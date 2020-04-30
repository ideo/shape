import { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import { supportedLanguagesStore } from 'c-delta-organization-settings'

import StyledReactTags from '~/ui/pages/shared/StyledReactTags'
import Pill from '~/ui/global/Pill'
import { Label } from '~/ui/global/styled/forms'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'
import Loader from '~/ui/layout/Loader'

const Languages = ({ organization, updateRecord }) => {
  const [languageOptions, setLanguageOptions] = useState([])
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

  const languagesFromOrg = () => {
    const languages = _.filter(languageOptions, option =>
      organization.supported_languages.includes(option.handle)
    )
    return tagsFromLanguages(languages)
  }

  const tagsFromLanguages = languages => {
    return languages.map(object => {
      object.label = object.string
      object.name = object.string
      object.onDelete = () => removeLanguage(object)
      object.onSelect = () => addLanguage(object)
      return object
    })
  }

  const availableLanguageOptions = () => {
    const allowed = _.reject(languageOptions, option =>
      organization.supported_languages.includes(option.handle)
    )
    console.log('allowed languages: ', allowed)
    return tagsFromLanguages(allowed)
  }

  const addLanguage = tag => {
    const params = {
      supported_languages: organization.supported_languages.concat([
        tag.handle,
      ]),
    }
    updateRecord(params)
  }

  const removeLanguage = tag => {
    const updatedLanguages = _.reject(
      organization.supported_languages,
      language => language === tag.handle
    )
    updateRecord({
      supported_languages: updatedLanguages,
    })
  }

  return (
    <div>
      {isError && <div>Something went wrong... </div>}
      {isLoading ? (
        <Loader />
      ) : (
        <Fragment>
          <Label
            style={{
              fontSize: '13px',
              marginBottom: '11px',
            }}
            id="languages-select-label"
          >
            Languages
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
              suggestions={availableLanguageOptions()}
              allowBackspace={false}
              delimiterChars={[',']}
              placeholder={'add additional available languages'}
              handleAddition={tag => tag.onSelect()}
              handleDelete={tag => tag.onDelete()}
              tagComponent={Pill}
              autofocus={false}
            />
          </StyledReactTags>
        </Fragment>
      )}
    </div>
  )
}

Languages.propTypes = {
  organization: PropTypes.object,
  updateRecord: PropTypes.func,
}

export default Languages
