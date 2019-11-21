import { Fragment } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Headroom from 'react-headroom'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Drawer from '@material-ui/core/Drawer'
import { Box } from 'reflexbox'
import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo.js'
import Hamburger from '~/ui/layout/Hamburger.js'
import MenuDropdown from '~/ui/layout/MenuDropdown'
import {
  MarketingFlex,
  MarketingMainBtn,
} from '~/ui/global/styled/marketing.js'
import { scroller } from 'react-scroll'
import { browserHistory } from '~/ui/MarketingRoutes'

export const NavLink = styled.a`
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 12px;
  letter-spacing: 0.4px;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  text-decoration: none;
}
`

const ToggleLogo = styled(Logo)`
  margin-top: 15px;
`

const MenuWrapper = styled.div`
  height: 60px;

  .headroom {
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
  }
  .headroom--unfixed {
    position: relative;
    transform: translateY(0);
    .ToggleLogo {
      display: none;
    }
  }

  @keyframes appear {
    from {
      background: transparent;
      transform: translateY(-100%);
    }
    to {
      background: white;
      transform: translateY(0);
    }
  }

  .headroom--scrolled {
    position: fixed;
    background: white;
    animation-name: appear;
    animation-duration: 0.5s;
    transform: translateY(0);
  }
  .headroom--unpinned {
    /* position: fixed; */
    /* transform: translateY(-100%); */
  }
  .headroom--pinned {
    /* position: fixed; */
    /* transform: translateY(0); */
  }
`

const MenuBar = styled(AppBar)`
  padding-left: 24px;
  padding-right: 24px;

  &.top {
    background: transparent;
    position: static;
    box-shadow: none;
  }

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    padding-left: 75px;
    padding-right: 75px;
  }
`

function handleScrollToContent(isHome) {
  if (!isHome) {
    browserHistory.push('/')
    return
  }
  scroller.scrollTo('ContentAnchor', {
    duration: 1500,
    delay: 100,
    smooth: true,
    offset: 0,
  })
}

function handleScrollToFooter() {
  scroller.scrollTo('FooterAnchor', {
    duration: 1500,
    delay: 100,
    smooth: true,
    offset: -125,
  })
}

function handleScrollToTop() {
  scroller.scrollTo('TopAnchor', {
    duration: 1500,
    delay: 100,
    smooth: true,
    offset: -150,
  })
}

const MobileSubNavLink = styled(NavLink)`
  position: relative;
  left: 10px;
`

const MobileLinks = ({ isHome }) => {
  return (
    <MarketingFlex align="left" justify="left" w={1} column>
      <Box>
        <NavLink align="center" onClick={handleScrollToTop}>
          <ToggleLogo className="ToggleLogo" width={48} />
        </NavLink>
      </Box>

      <Box>
        <NavLink align="left" onClick={() => handleScrollToContent(isHome)}>
          PRODUCT
        </NavLink>
      </Box>

      <Box>
        <MobileSubNavLink
          align="left"
          onClick={() => handleScrollToContent(isHome)}
        >
          OVERVIEW
        </MobileSubNavLink>
      </Box>

      <Box>
        <MobileSubNavLink href="/product/feedback" align="left">
          FEEDBACK
        </MobileSubNavLink>
      </Box>

      <Box>
        <NavLink align="left" href="/product/pricing">
          PRICING
        </NavLink>
      </Box>

      <Box>
        <NavLink align="left" href="/product/open-innovation">
          CHALLENGES AND OPEN INNOVATION
        </NavLink>
      </Box>

      <Box>
        <NavLink align="left" onClick={handleScrollToFooter}>
          CONTACT
        </NavLink>
      </Box>

      <Box>
        <NavLink href="/login" align="left">
          Login
        </NavLink>
      </Box>

      <Box>
        <NavLink href="/sign_up" align="left">
          Signup
        </NavLink>
      </Box>
    </MarketingFlex>
  )
}

MobileLinks.propTypes = {
  isHome: PropTypes.bool.isRequired,
}

class MarketingMenu extends React.PureComponent {
  constructor(props) {
    super(props)
    this.isHome = location.pathname === '/'
    this.state = {
      width: window.innerWidth,
      drawerState: false,
    }
  }

  componentWillMount = () => {
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleWindowSizeChange)
  }

  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth })
  }

  toggleDrawer = isOpen => () => {
    this.setState({ drawerState: isOpen })
  }

  renderDesktop = () => {
    const { isHome } = this
    const items = [{ label: 'Overview' }, { label: 'Feedback' }]
    return (
      <Fragment>
        <MenuBar className="MenuBar top">
          <Toolbar>
            <MarketingFlex align="center" justify="center" w={1}>
              <Box w={15 / 32}>
                <MarketingFlex align="center" justify="flex-start">
                  <MenuDropdown
                    items={items}
                    isHome={isHome}
                    handleScrollToContent={() => handleScrollToContent(isHome)}
                  />
                  <NavLink href="/product/pricing">Pricing</NavLink>
                  <NavLink href="/product/open-innovation">
                    CHALLENGES AND OPEN INNOVATION
                  </NavLink>
                </MarketingFlex>
              </Box>

              <Box w={2 / 32}>
                <section align="center">
                  <button onClick={handleScrollToTop}>
                    <ToggleLogo className="ToggleLogo" width={48} />
                  </button>
                </section>
              </Box>

              <Box w={15 / 32}>
                <MarketingFlex align="center" justify="flex-end">
                  <NavLink onClick={handleScrollToFooter}>Contact</NavLink>
                  <NavLink href="/login">Login</NavLink>
                  <MarketingMainBtn
                    id="header-sign-up"
                    onClick={() => {
                      window.location = `${process.env.BASE_HOST}/sign_up`
                    }}
                  >
                    Sign up
                  </MarketingMainBtn>
                </MarketingFlex>
              </Box>
            </MarketingFlex>
          </Toolbar>
        </MenuBar>
      </Fragment>
    )
  }

  renderMobile = () => {
    const { isHome } = this
    return (
      <Fragment>
        <MenuBar className={`MenuBar top`}>
          <Toolbar disableGutters>
            <MarketingFlex align="center" w={1}>
              <Box ml={2}>
                <button onClick={handleScrollToTop}>
                  <ToggleLogo className="ToggleLogo" width={48} />
                </button>
              </Box>

              <Box ml="auto">
                <Hamburger
                  role="button"
                  onClick={this.toggleDrawer(true)}
                  float="right"
                  style={{ marginBottom: 0 }}
                />
              </Box>
            </MarketingFlex>
          </Toolbar>
        </MenuBar>
        <Drawer
          open={this.state.drawerState}
          onClose={this.toggleDrawer(false)}
        >
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer(false)}
            onKeyDown={this.toggleDrawer(false)}
          >
            <MobileLinks isHome={isHome} />
          </div>
        </Drawer>
      </Fragment>
    )
  }

  render() {
    const { width } = this.state
    const isMobile = width <= v.responsive.medBreakpoint

    return (
      <MenuWrapper>
        <Headroom disableInlineStyles pinStart={400}>
          {isMobile ? this.renderMobile() : this.renderDesktop()}
        </Headroom>
      </MenuWrapper>
    )
  }
}

export default MarketingMenu
