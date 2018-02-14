import styled from 'styled-components'
import { inject, observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import UserAvatar from '~/ui/layout/UserAvatar'

const StyledHeader = styled.header`
  z-index: 9999;
  position: fixed;
  top: 0;
  width: calc(100% - 4rem);
  background: #f2f2f2;
  padding: 1rem 2rem;
`
// box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.25);

@inject('apiStore')
@observer
class Header extends React.Component {
  render() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    return (
      <StyledHeader>
        <Flex align="center" justify="space-between">
          <Box>
            <Link className="text-link" to="/">
              <Logo />
            </Link>
          </Box>

          <Box>
            <UserAvatar user={currentUser} />
          </Box>
        </Flex>
      </StyledHeader>

    )
  }
}

export default Header
