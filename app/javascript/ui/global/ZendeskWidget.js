import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import v from '~/utils/variables'

const MAX_RETRIES = 20

@inject('apiStore', 'uiStore')
@observer
class ZendeskWidget extends React.Component {
  state = {
    initialized: false,
    identified: false,
    hidden: false,
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

  hide = () => {
    const { hidden } = this.state
    const { zE } = window
    if (hidden) return
    zE.hide()
    this.setState({ hidden: true })
  }

  show = () => {
    const { hidden } = this.state
    const { zE } = window
    if (!hidden) return
    zE.show()
    this.setState({ hidden: false })
  }

  render() {
    const { initialized, identified } = this.state
    if (!initialized) return null

    if (!identified) this.identify(this.user)
    this.isMobile ? this.hide() : this.show()
    return null
  }
}

ZendeskWidget.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ZendeskWidget
