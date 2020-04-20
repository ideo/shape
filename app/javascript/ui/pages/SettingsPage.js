import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import styled from 'styled-components'

import { Heading1 } from '~/ui/global/styled/typography'
import PageContainer from '~/ui/layout/PageContainer'
import OverdueBanner from '~/ui/layout/OverdueBanner'
import { Label } from '~/ui/global/styled/forms'
import v from '~/utils/variables'
import { apiStore } from '~/stores'

// TODO: Make separate component
const SettingsNavLink = styled(RouterLink)`
  margin-right: 50px;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  color: ${v.colors.black};
  display: inline-block;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

class SettingsPage extends React.Component {
  render() {
    return (
      <div>
        <OverdueBanner />
        <PageContainer>
          <Heading1>Settings</Heading1>
          <nav>
            <ul>
              <SettingsNavLink to="/settings">
                <Label>{apiStore.currentUserOrganizationName} Settings</Label>
              </SettingsNavLink>
              <SettingsNavLink to="/user_settings">
                <Label>My Settings</Label>
              </SettingsNavLink>
              <SettingsNavLink
                to="/org-settings"
                style={{
                  borderRadius: '26px',
                  background: v.colors.cDeltaBlue,
                }}
              >
                <Label style={{ padding: '0px 16px' }}>
                  C∆ Creative Difference
                </Label>
              </SettingsNavLink>
            </ul>
          </nav>
          {this.props.children}
        </PageContainer>
      </div>
    )
  }
}

SettingsPage.propTypes = {
  children: PropTypes.node,
}
SettingsPage.defaultProps = {
  children: null,
}

export default SettingsPage
