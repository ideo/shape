import PropTypes from 'prop-types'
import { Select } from '~/ui/global/styled/forms'
import { MenuItem } from '@material-ui/core'
import { SmallHelperText } from '~/ui/global/styled/typography'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import v from '~/utils/variables'

const SelectText = ({ children }) => (
  <SmallHelperText fontWeight={v.weights.medium} color={v.colors.black}>
    {children}
  </SmallHelperText>
)
SelectText.propTypes = {
  children: PropTypes.node.isRequired,
}

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
    // guard for anonymous / public pages -- language selector won't really work
    if (!this.props.apiStore.currentUser) return null

    return (
      <Select
        disableUnderline
        value={this.localeSelected}
        onChange={this.handleChange}
      >
        <MenuItem key="en" value={'en'}>
          <SelectText>EN</SelectText>
        </MenuItem>
        <MenuItem key="es" value={'es'}>
          <SelectText>ES</SelectText>
        </MenuItem>
        <MenuItem key="ja" value={'ja'}>
          <SelectText>日本語</SelectText>
        </MenuItem>
        <MenuItem key="zh_cn" value={'zh_cn'}>
          <SelectText>中文</SelectText>
        </MenuItem>
      </Select>
    )
  }
}
LanguageSelector.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
export default LanguageSelector
