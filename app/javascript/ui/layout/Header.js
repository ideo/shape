import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'
import UserAvatar from '~/ui/layout/UserAvatar'
import v from '~/utils/variables'

const StyledHeader = styled.header`
  z-index: ${v.zIndex.header};
  position: fixed;
  top: 0;
  width: calc(100% - ${v.containerPadding.horizontal}*2);
  background: ${v.colors.cararra};
  padding: 1rem ${v.containerPadding.horizontal};
`

const MaxWidthContainer = styled.div`
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
`

@inject('apiStore')
@observer
class Header extends React.Component {
  render() {
    const { apiStore, children } = this.props
    const { currentUser } = apiStore
    return (
      <StyledHeader>
        <MaxWidthContainer>

          <Flex align="center" justify="space-between">
            <Box>
              <PlainLink to="/">
                <Logo />
              </PlainLink>
            </Box>

            <Box flex>
              <OrganizationAvatar
                organization={currentUser.current_organization}
              />
              <UserAvatar user={currentUser} />
            </Box>
          </Flex>

          <div>
            { children }
          </div>

        </MaxWidthContainer>
      </StyledHeader>

    )
  }
}

Header.propTypes = {
  children: PropTypes.node.isRequired,
}
Header.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Header
