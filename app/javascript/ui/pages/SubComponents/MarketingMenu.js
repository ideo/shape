import { Fragment } from 'react'
import styled from 'styled-components'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Drawer from '@material-ui/core/Drawer'
import { Box } from 'reflexbox'
import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo.js'
import { MarketingFlex } from '~/ui/global/styled/marketing.js'
import PropTypes from 'prop-types'
import { scroller } from 'react-scroll'

const NavLink = styled.button`
  font-weight: ${v.weights.medium};
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
const NavMenu = styled.div`{
    position: relative;
    padding-left: 1.25em;
    top: -1.2em;
    left: 3em;
  }
  &:before {
    content: "";
    position: absolute;
    top: 0.25em;
    left: 0;
    width: 1em;
    height: 0.125em;
    border-top: 0.375em double #000;
    border-bottom: 0.125em solid #000;
  }
`

const ToggleLogo = styled(Logo)`
  &.small-visible {
    opacity: 1;
  }
  &.small-not-visible {
    opacity: 0;
  }
`

function handleScrollToContent() {
  scroller.scrollTo('ContentAnchor', {
    duration: 1500,
    delay: 100,
    smooth: true,
    offset: 50,
  })
}

function handleScrollToFooter() {
  scroller.scrollTo('FooterAnchor', {
    duration: 1500,
    delay: 100,
    smooth: true,
    offset: 50,
  })
}

function handleScrollToTop() {
  scroller.scrollTo('TopAnchor', {
    duration: 1500,
    delay: 100,
    smooth: true,
    offset: -50,
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
      <a href="https://profile.ideo.com" rel="noopener noreferrer" target="_blank">
        <NavLink align="left" >LOGIN</NavLink>
      </a>
    </Box>
  </MarketingFlex>
)

class MarketingMenu extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      logoClass: 'small-not-visible',
      width: window.innerWidth,
      drawerState: false,
    }
  }

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentDidUpdate(prevProps) {
    if (this.props.isBigLogoVisible !== prevProps.isBigLogoVisible) {
      this.handleLogoVisibilityChange()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange)
  }

  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth })
  }

  handleLogoVisibilityChange() {
    this.setState({ logoClass: this.props.isBigLogoVisible ? 'small-not-visible' : 'small-visible' })
  }

  toggleDrawer = (open) => () => {
    this.setState({
      drawerState: open,
    })
  }

  renderDesktop() {
    return (
      <AppBar position="fixed" style={{ background: 'white', boxShadow: 'none' }}>
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
                <a href="https://profile.ideo.com" rel="noopener noreferrer" target="_blank">
                  <NavLink>LOGIN</NavLink>
                </a>
              </section>
            </Box>

          </MarketingFlex>
        </Toolbar>
      </AppBar>
    )
  }

  renderMobile() {
    return (
      <Fragment>
        <AppBar position="fixed" style={{ background: 'white', boxShadow: 'none' }}>
          <Toolbar>
            <MarketingFlex
              align="center"
              justify="center"
              w={1}
            >
              <Box w={1 / 4}>
                <section align="left" >
                  <button onClick={handleScrollToTop}>
                    <ToggleLogo className={`ToggleLogo ${this.state.logoClass}`} width={48} />
                  </button>
                </section>
              </Box>

              <Box w={2 / 4} />

              <Box w={1 / 4}>
                <section align="right">
                  <NavMenu role="button" onClick={this.toggleDrawer('left', true)} />
                </section>
              </Box>

            </MarketingFlex>
          </Toolbar>
        </AppBar>
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
      </Fragment>
    )
  }

  render() {
    const { width } = this.state
    const isMobile = width <= v.responsive.smallBreakpoint

    return (isMobile ? this.renderMobile() : this.renderDesktop()
    )
  }
}

MarketingMenu.propTypes = {
  isBigLogoVisible: PropTypes.bool,
}

MarketingMenu.defaultProps = {
  isBigLogoVisible: true,
}

export default MarketingMenu
