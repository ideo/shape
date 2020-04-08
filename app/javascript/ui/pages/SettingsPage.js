import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import styled from 'styled-components'

import { Heading1 } from '~/ui/global/styled/typography'
import PageContainer from '~/ui/layout/PageContainer'
import OverdueBanner from '~/ui/layout/OverdueBanner'
import { Label } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

// TODO: Make separate component
const SettingsNavLink = styled(RouterLink)`
  margin-right: 50px;
  color: ${v.colors.black};
  display: inline-block;
  text-decoration: none;
  background-color: ${props => (props.isActive ? v.colors.primaryCta : 'none')};
  border-radius: ${props => (props.isActive ? '26px' : '0px')};

  &:hover {
    text-decoration: underline;
  }
`

const isActive = path => {
  const regex = new RegExp(path, 'i')

  return regex.test(window.location.pathname)
}

class SettingsPage extends React.PureComponent {
  render() {
    console.log(isActive('/org-settings'))
    return (
      <div>
        <OverdueBanner />
        <PageContainer>
          <Heading1>Settings</Heading1>
          <nav>
            <ul>
              <SettingsNavLink to="/settings" isActive={isActive('/settings')}>
                <Label>"Organization" Settings</Label>
              </SettingsNavLink>
              <SettingsNavLink
                to="/user_settings"
                isActive={isActive('/user_settings')}
              >
                <Label>My Settings</Label>
              </SettingsNavLink>
              <SettingsNavLink
                to="/org-settings"
                isActive={isActive('/org-settings')}
              >
                <Label>C∆ Creative Difference</Label>
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
