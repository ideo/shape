import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'
import { withStyles } from 'material-ui/styles'
import Avatar from 'material-ui/Avatar'

import Logo from '~/ui/layout/Logo'

const materialStyles = {
  smallAvatar: {
    width: 34,
    height: 34,
  }
}

const StyledHeader = styled.header`
  z-index: 9999;
  position: fixed;
  top: 0;
  width: calc(100% - 4rem);
  background: #f2f2f2;
  padding: 1rem 2rem;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.25);
`

@withStyles(materialStyles)
class Header extends React.PureComponent {
  render() {
    const { classes } = this.props
    return (
      <StyledHeader>
        <Flex align="center" justify="space-between">
          <Box>
            <Logo />
          </Box>

          <Box>
            <Avatar
              className={classes.smallAvatar}
              src="https://picsum.photos/38"
            />
          </Box>
        </Flex>
      </StyledHeader>

    )
  }
}

export default Header
