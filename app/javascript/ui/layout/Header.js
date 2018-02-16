import styled from 'styled-components'
import { inject, observer } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import UserAvatar from '~/ui/layout/UserAvatar'

const StyledHeader = styled.header`
  z-index: 100;
  position: fixed;
  top: 0;
  width: calc(100% - 4rem);
  background: #f2f2f2;
  padding: 1rem 2rem;
`

const MaxWidthContainer = styled.header`
  max-width: 1340px;
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

            <Box>
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

export default Header
