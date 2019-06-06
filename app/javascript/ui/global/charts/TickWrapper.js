import PropTypes from 'prop-types'
import TickLabel from '~/ui/global/charts/TickLabel'

class TickWrapper extends React.Component {
  renderEmojis() {
    const children = React.Children.toArray(this.props.children)
    return children.map(child => {
      return React.cloneElement(
        child,
        Object.assign({}, child.props, this.props)
      )
    })
  }

  renderLabels() {
    const { children, title } = this.props
    const _children = React.Children.toArray(children)
    return _children.map(child => {
      const { props } = child
      const { x, y } = props
      return <TickLabel key={title} title={title} x={x} y={y} dx={-20} />
    })
  }

  render() {
    return (
      <g>
        {this.renderEmojis()}
        {this.renderLabels()}
      </g>
    )
  }
}

TickWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired,
}

export default TickWrapper
