import _ from 'lodash'
import PropTypes from 'prop-types'

class Truncator extends React.Component {
  constructor(props) {
    super(props)
    this.elRef = React.createRef()
    this.state = {
      truncated: false,
      alteredText: props.text,
    }
    this.onResize = _.debounce(this._onResize, 100)
  }

  componentDidMount() {
    this.truncate()
    window.addEventListener('resize', this.onResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  _onResize = () => {
    this.setState({ truncated: false }, () => { this.truncate() })
  }

  truncate = () => {
    const { text } = this.props
    const el = this.elRef
    if (!el) return
    const width = el.offsetWidth
    const overage = el.scrollWidth - el.offsetWidth
    const typefaceModifier = el.scrollWidth / text.length
    let lettersToRemove = parseInt(overage / typefaceModifier) + 1
    if (lettersToRemove > 1) {
      if (lettersToRemove > text.length) {
        lettersToRemove = text.length - (width / typefaceModifier)
      }
      const mid = parseInt((text.length - lettersToRemove) / 2)
      const first = text.slice(0, mid)
      const rest = text.slice(mid + lettersToRemove, text.length)
      const truncated = `${first}…${rest}`
      this.setState({ alteredText: truncated, truncated: true })
    } else {
      this.setState({ alteredText: text, truncated: true })
    }
  }

  get mainStyles() {
    const { extraSpacing } = this.props
    const { truncated } = this.state

    if (truncated) return {}
    return {
      overflowX: 'scroll',
      maxWidth: `calc(100% - ${extraSpacing}px)`,
      width: '100%',
      whiteSpace: 'nowrap'
    }
  }

  render() {
    const { text } = this.props
    const { alteredText, truncated } = this.state
    return (
      <div style={this.mainStyles} ref={(el) => (this.elRef = el)}>
        { truncated ? alteredText : text }
      </div>
    )
  }
}

Truncator.propTypes = {
  text: PropTypes.string.isRequired,
  extraSpacing: PropTypes.number,
}
Truncator.defaultProps = {
  extraSpacing: 0,
}

export default Truncator
