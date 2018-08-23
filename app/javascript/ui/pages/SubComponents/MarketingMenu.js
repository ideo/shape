import { Fragment } from 'react'
import styled from 'styled-components'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import { Flex, Box } from 'reflexbox'
import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo.js'

const NavLink = styled.button`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  cursor: pointer;

    &:hover {
    color: ${v.colors.gray};
  }
`

class MarketingMenu extends React.PureComponent {
  render() {
    return (
      <Fragment>
        <AppBar position="static" style={{ background: 'transparent', boxShadow: 'none' }}>
          <Toolbar>
            <Flex
              align="center"
              justify="center"
              wrap
              w={1}
            >
              <Box w={15 / 32}><section align="left">
                <NavLink>ABOUT</NavLink>
                <NavLink>PRODUCT</NavLink>
                <NavLink>PRICING</NavLink>
              </section></Box>
              <Box w={2 / 32}><section align="center">
                <Logo width={48} />
              </section></Box>
              <Box w={15 / 32}><section align="right">
                <NavLink>CONTACT</NavLink>
                <NavLink>LOGIN</NavLink>
              </section></Box>
            </Flex>
          </Toolbar>
        </AppBar>
      </Fragment>
    )
  }
}

export default MarketingMenu
