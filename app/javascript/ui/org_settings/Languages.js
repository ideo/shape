import PropTypes from 'prop-types'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import StyledReactTags from '~/ui/pages/shared/StyledReactTags'
import Pill from '~/ui/global/Pill'
import { Label } from '~/ui/global/styled/forms'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'

const Languages = ({ organization, supportedLanguages, updateRecord }) => {
  const languagesFromOrg = () => {
    const languages = _.filter(supportedLanguages, option =>
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
    const allowed = _.reject(supportedLanguages, option =>
      organization.supported_languages.includes(option.handle)
    )
    console.log('allowed languages: ', allowed)
    return tagsFromLanguages(allowed)
  }

  const addLanguage = tag => {
    event.preventDefault()

    const params = {
      supported_languages: organization.supported_languages.concat([
        tag.handle,
      ]),
    }
    updateRecord(params)
  }

  const removeLanguage = tag => {
    event.preventDefault()

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
      <Label
        style={{
          fontSize: '13px',
          marginTop: '22px',
          marginBottom: '10px', // Not 16 because react tags has padding already
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
    </div>
  )
}

Languages.defaultProps = {
  organization: {},
  supported_languages: [],
  updateRecord: () => null,
}

Languages.propTypes = {
  organization: PropTypes.object,
  supportedLanguages: PropTypes.arrayOf(PropTypes.object),
  updateRecord: PropTypes.func,
}

export default Languages
