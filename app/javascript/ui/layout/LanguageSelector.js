import { Select } from '~/ui/global/styled/forms'
import { MenuItem } from '@material-ui/core'
import { DisplayText } from '~/ui/global/styled/typography'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

@inject('apiStore')
@observer
class LanguageSelector extends React.Component {
  handleChange = async ev => {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const locale = ev.target.value
    currentUser.locale = locale
    await currentUser.API_updateCurrentUser({
      locale,
    })
    // NOTE: simple way to do this for now
    window.location.reload()
  }

  get localeSelected() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const { locale } = currentUser
    return locale
  }

  render() {
    return (
      <Select value={this.localeSelected} onChange={this.handleChange}>
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
