import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { Heading2 } from '~/ui/global/styled/typography'
import Header from '~/ui/layout/Header'
import { MenuItem } from 'material-ui/Menu'
import { Label, Select } from '~/ui/global/styled/forms'
import PageContainer from '~/ui/layout/PageContainer'
import TagEditor from '~/ui/pages/shared/TagEditor'

@inject('apiStore', 'routingStore')
@observer
class OrganizationSettings extends React.Component {
  render() {
    return (
      <div>
        <Heading2>Notifications</Heading2>
        <Label style={{ display: 'inline-block', marginRight: '25px' }}>
          Email notifications
        </Label>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="email_notifications"
          onChange={this.handleEmailNotifications}
          value={true}
        >
          <MenuItem key={"on"} value={true}>
            On
          </MenuItem>
          <MenuItem key={"off"} value={false}>
            Off
          </MenuItem>
        </Select>
      </div>
    )
  }
}

OrganizationSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationSettings
