import { Select } from '~/ui/global/styled/forms'
import { MenuItem } from '@material-ui/core'
import { DisplayText } from '~/ui/global/styled/typography'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

@inject('apiStore')
@observer
class LanguageSelector extends React.Component {
  handleChange = ev => {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const language = ev.target.value
    currentUser.language = language
    currentUser.API_updateCurrentUser({
      language,
    })
  }

  get languageSelected() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const { language } = currentUser
    return language
  }

  render() {
    return (
      <Select value={this.languageSelected} onChange={this.handleChange}>
        <MenuItem key="en" value={'en'}>
          <DisplayText>EN</DisplayText>
        </MenuItem>
        <MenuItem key="es" value={'es'}>
          <DisplayText>ES</DisplayText>
        </MenuItem>
        <MenuItem key="ja" value={'ja'}>
          <DisplayText>JP</DisplayText>
        </MenuItem>
        <MenuItem key="zh_cn" value={'zh_cn'}>
          <DisplayText>CH</DisplayText>
        </MenuItem>
      </Select>
    )
  }
}
LanguageSelector.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
export default LanguageSelector
