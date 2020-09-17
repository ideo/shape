import PropTypes from 'prop-types'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import StyledReactTags from '~/ui/pages/shared/StyledReactTags'
import Pill from '~/ui/global/Pill'
import { Label } from '~/ui/global/styled/forms'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'

class Languages extends React.Component {
  constructor(props) {
    super(props)
  }

  languagesFromOrg = () => {
    const { orgLanguages, supportedLanguages } = this.props

    const languages = _.filter(supportedLanguages, option =>
      orgLanguages.includes(option.handle)
    )
    return this.tagsFromLanguages(languages)
  }

  tagsFromLanguages = languages => {
    const { removeLanguage, addLanguage } = this

    return languages.map(object => {
      object.label = object.string
      object.name = object.string
      object.onDelete = () => removeLanguage(object)
      object.onSelect = () => addLanguage(object)
      return object
    })
  }

  availableLanguageOptions = () => {
    const { orgLanguages, supportedLanguages } = this.props

    const allowed = _.reject(supportedLanguages, option =>
      orgLanguages.includes(option.handle)
    )
    return this.tagsFromLanguages(allowed)
  }

  addLanguage = tag => {
    const { orgLanguages, updateRecord } = this.props
    event.preventDefault()

    const params = {
      supported_languages: orgLanguages.concat([tag.handle]),
    }
    updateRecord(params)
  }

  removeLanguage = tag => {
    const { orgLanguages, updateRecord } = this.props
    event.preventDefault()

    const updatedLanguages = _.reject(
      orgLanguages,
      language => language === tag.handle
    )
    updateRecord({
      supported_languages: updatedLanguages,
    })
  }

  render() {
    // const { orgLanguages, supportedLanguages } = this.props

    return (
      <div>
        <Label
          style={{
            fontSize: '13px',
            marginTop: '22px',
            marginBottom: '10px', // Not 16 because react tags has 6px padding already
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
            tags={this.languagesFromOrg()}
            suggestions={this.availableLanguageOptions()}
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
}

Languages.defaultProps = {
  orgLanguages: [],
  supportedLanguages: [],
  updateRecord: () => null,
}
Languages.propTypes = {
  orgLanguages: MobxPropTypes.arrayOrObservableArrayOf(PropTypes.string),
  supportedLanguages: MobxPropTypes.arrayOrObservableArray,
  updateRecord: PropTypes.func,
}

export default Languages
