import { Fragment } from 'react'
import styled from 'styled-components'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Drawer from '@material-ui/core/Drawer'
import { Box } from 'reflexbox'
import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo.js'
import Hamburger from '~/ui/layout/Hamburger.js'
import { MarketingFlex } from '~/ui/global/styled/marketing.js'
import PropTypes from 'prop-types'
import { scroller } from 'react-scroll'
import VisibilitySensor from 'react-visibility-sensor'

const NavLink = styled.button`
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 12px;
  letter-spacing: 0.4px;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
}
`

const ToggleLogo = styled(Logo)`
  &.after-break {
    opacity: 1;
  }
  &.before-break {
    opacity: 0;
  }
`

const MenuWrapper = styled.div`
  height: 60px;
`

const MenuBar = styled(AppBar)`
    padding-left: 24px;
    padding-right: 24px;

  &.top{
    background: transparent;
    position: static;
    box-shadow: none;
  }

  &.after-top{
    background: white;
    position: fixed;
    box-shadow: none;
    transform: translateY(-100%);
    transition-property: all;
    transition-duration: .5s;
    transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
    overflow-y: hidden;
  }

  &.after-break {
    background: white;
    position: fixed;
    box-shadow: none;
    transform: translateY(0);
    transition-property: all;
    transition-duration: .5s;
    transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
    overflow-y: hidden;
  }

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    padding-left: 75px;
    padding-right: 75px;
  }

`

function handleScrollToContent() {
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
    offset: 0,
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

const MobileLinks = (
  <MarketingFlex
    align="left"
    justify="left"
    w={1}
    column
  >
    <Box>
      <NavLink align="center" onClick={handleScrollToTop}>
        <ToggleLogo width={48} />
      </NavLink>
    </Box>

    <Box>
      <NavLink align="left" onClick={handleScrollToContent}>PRODUCT</NavLink>
    </Box>

    <Box>
      <NavLink align="left" onClick={handleScrollToFooter}>PRICING</NavLink>
    </Box>

    <Box>
      <NavLink align="left" onClick={handleScrollToFooter}>CONTACT</NavLink>
    </Box>

    <Box>
      <a href="/login" rel="noopener noreferrer">
        <NavLink align="left">LOGIN</NavLink>
      </a>
    </Box>
  </MarketingFlex>
)

class MarketingMenu extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      logoClass: 'before-break',
      menuClass: 'top',
      isTopVisible: true,
      width: window.innerWidth,
      drawerState: false,
    }
  }

  componentWillMount = () => {
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.state.isTopVisible !== prevState.isTopVisible) {
      this.handleTopVisibilityChange()
    } else if (this.props.isBigLogoVisible !== prevProps.isBigLogoVisible) {
      this.handleLogoVisibilityChange()
    }
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleWindowSizeChange)
  }

  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth })
  }

  handleLogoVisibilityChange = () => {
    this.setState({
      logoClass: this.props.isBigLogoVisible ? 'before-break' : 'after-break',
      menuClass: this.props.isBigLogoVisible ? 'after-top' : 'after-break',
    })
  }

  handleTopVisibilityChange = () => {
    this.setState({ menuClass: this.state.isTopVisible ? 'top' : 'after-top' })
  }

  handleTopVisibility = (isVisible) => {
    this.setState({ isTopVisible: isVisible })
  }

  toggleDrawer = (isOpen) => () => {
    this.setState({ drawerState: isOpen })
  }

  renderDesktop() {
    return (
      <MenuWrapper>
        <MenuBar className={`MenuBar ${this.state.menuClass}`}>
          <Toolbar>
            <MarketingFlex
              align="center"
              justify="center"
              w={1}
            >
              <Box w={15 / 32}>
                <section align="left">
                  <NavLink onClick={handleScrollToContent}>PRODUCT</NavLink>
                  <NavLink onClick={handleScrollToFooter}>PRICING</NavLink>
                </section>
              </Box>

              <Box w={2 / 32}>
                <section align="center" >
                  <button onClick={handleScrollToTop}>
                    <ToggleLogo className={`ToggleLogo ${this.state.logoClass}`} width={48} />
                  </button>
                </section>
              </Box>

              <Box w={15 / 32}>
                <section align="right">
                  <NavLink onClick={handleScrollToFooter}>CONTACT</NavLink>
                  <a href="/login" rel="noopener noreferrer">
                    <NavLink>LOGIN</NavLink>
                  </a>
                </section>
              </Box>

            </MarketingFlex>
          </Toolbar>
        </MenuBar>
        <VisibilitySensor
          scrollCheck
          intervalDelay={300}
          onChange={this.handleTopVisibility}
        />
      </MenuWrapper>
    )
  }

  renderMobile() {
    return (
      <MenuWrapper>
        <MenuBar className={`MenuBar ${this.state.menuClass}`}>
          <Toolbar disableGutters>
            <MarketingFlex
              align="center"
              w={1}
            >
              <Box ml={2}>
                <button onClick={handleScrollToTop}>
                  <ToggleLogo className={`ToggleLogo ${this.state.logoClass}`} width={48} />
                </button>
              </Box>

              <Box ml="auto" mr={2}>
                <Hamburger role="button" onClick={this.toggleDrawer(true)} float="right" />
              </Box>

            </MarketingFlex>
          </Toolbar>
        </MenuBar>

        <VisibilitySensor
          scrollCheck
          intervalDelay={300}
          onChange={this.handleTopVisibility}
        />

        <Drawer open={this.state.drawerState} onClose={this.toggleDrawer(false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer(false)}
            onKeyDown={this.toggleDrawer(false)}
          >
            {MobileLinks}
          </div>
        </Drawer>
      </MenuWrapper>
    )
  }

  render() {
    const { width } = this.state
    const isMobile = width <= v.responsive.smallBreakpoint

    return (isMobile ? this.renderMobile() : this.renderDesktop())
  }
}

MarketingMenu.propTypes = {
  isBigLogoVisible: PropTypes.bool,
}

MarketingMenu.defaultProps = {
  isBigLogoVisible: true,
}

export default MarketingMenu
