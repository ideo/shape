import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'

// NOTE: While it would be wonderful to show/hide the badge when the Zendesk widget
// is opened, Zendesk's new web API for listening to events via zE('webWidget:on', 'open')
// and zE('webWidget:on', 'close') are currently useless because the "open" doesn't trigger
// when opened via API and the "close" event doesn't trigger when closed via the "Cancel" button :-(

const FloatingButton = styled.button`
  position: fixed;
  right: 0px;
  bottom: 60px;
  background-color: ${v.colors.black};
  color: ${v.colors.white};
  font-family: ${v.fonts.sans};
  padding: 5px;
  transform: rotate(-90deg) translateX(100%);
  transform-origin: right bottom;
  z-index: ${v.zIndex.aboveClickWrapper};

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    display: none;
  }
`

const MAX_RETRIES = 20

@inject('apiStore', 'uiStore')
@observer
class ZendeskWidget extends React.Component {
  state = {
    initialized: false,
    identified: false,
  }

  componentDidMount() {
    this.waitForZendesk()
  }

  get user() {
    const { apiStore } = this.props
    return apiStore.currentUser
  }

  get isMobile() {
    const { uiStore } = this.props
    return (
      uiStore.windowWidth && uiStore.windowWidth <= v.responsive.smallBreakpoint
    )
  }

  waitForZendesk = (count = 0) => {
    const { initialized } = this.state
    const { zE } = window
    if (initialized) return
    if (count > MAX_RETRIES) return

    if (zE) {
      zE('webWidget', 'hide')
      this.setState({ initialized: true })
    } else {
      setTimeout(() => this.waitForZendesk(count + 1), 1000)
    }
  }

  identify = user => {
    const { zE } = window
    if (user) {
      const { name, email } = user
      zE('webWidget', 'identify', { name, email })
      this.setState({ identified: true })
    }
  }

  handleClick = ev => {
    const { zE } = window
    // NOTE: We must use Zendesk's legacy web API here because there is not yet support for
    // hideOnClose in their new equivalent of .activate() and their event hooks are inconsistent
    zE.activate({ hideOnClose: true })
  }

  render() {
    const { initialized, identified } = this.state
    if (!initialized) return null

    if (!identified) this.identify(this.user)
    return <FloatingButton onClick={this.handleClick}>Support</FloatingButton>
  }
}

ZendeskWidget.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ZendeskWidget
