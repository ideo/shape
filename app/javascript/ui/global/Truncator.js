import PropTypes from 'prop-types'

class Truncator extends React.Component {
  constructor(props) {
    super(props)
    this.elRef = React.createRef()
    this.state = {
      truncated: false,
      alteredText: props.text,
      passes: 0,
    }
  }

  componentDidMount() {
    this.truncate()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.passes < 2) {
      this.truncate()
    }
  }

  truncate() {
    const text = this.state.alteredText
    const el = this.elRef.current
    const width = el.offsetWidth
    const overage = el.scrollWidth - el.offsetWidth
    const typefaceModifier = width / text.length
    let lettersToRemove = parseInt(overage / typefaceModifier) + 1
    if (lettersToRemove > 1) {
      if (lettersToRemove > text.length) {
        lettersToRemove = (width / typefaceModifier) * 0.65
      }
      const mid = parseInt((text.length - lettersToRemove) / 2)
      const first = text.slice(0, mid)
      const rest = text.slice(mid + lettersToRemove, text.length)
      const truncated = `${first}…${rest}`
      this.setState({ alteredText: truncated, truncated: true, passes: this.state.passes += 1 })
    } else {
      this.setState({ alteredText: text, truncated: true, passes: this.state.passes += 1 })
    }
  }

  get mainStyles() {
    const { paddingRight } = this.props
    const { passes } = this.state

    if (passes > 1) return {}
    return {
      overflowX: 'scroll',
      maxWidth: `calc(100% - ${paddingRight}px)`,
      width: '100%',
      whiteSpace: 'nowrap'
    }
  }

  render() {
    const { text } = this.props
    const { alteredText, truncated } = this.state
    return (
      <div style={this.mainStyles} ref={this.elRef}>
        { truncated ? alteredText : text }
      </div>
    )
  }
}

Truncator.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node,
  paddingRight: PropTypes.number,
}
Truncator.defaultProps = {
  children: null,
  paddingRight: 0,
}

export default Truncator
