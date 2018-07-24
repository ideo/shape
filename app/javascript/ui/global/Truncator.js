import PropTypes from 'prop-types'

class Truncator extends React.Component {
  constructor(props) {
    super(props)
    this.elRef = React.createRef()
    this.state = {
      truncated: false,
      alteredText: ''
    }
  }

  componentDidMount() {
    console.log('trunc, mount', this.elRef)
    this.truncate()
  }

  truncate() {
    const { children } = this.props
    const el = this.elRef.current
    const text = el.textContent
    const width = el.offsetWidth
    const overage = el.scrollWidth - el.offsetWidth
    const typefaceModifier = width / text.length
  }

  get mainStyles() {
    const { paddingRight } = this.props

    return {
      overflowX: 'scroll',
      maxWidth: `calc(100% - 150px)`,
      width: '100%',
    }
  }

  render() {
    const { children } = this.props
    return (
      <div style={this.mainStyles} ref={this.elRef}>
        { children }
      </div>
    )
  }
}

Truncator.propTypes = {
  text: PropTypes.text.isRequired,
  children: PropTypes.node,
  paddingRight: PropTypes.number,
}
Truncator.defaultProps = {
  children: null,
  paddingRight: 0,
}

export default Truncator
