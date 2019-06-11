import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import { CLASS_LOWER_RIGHT_CORNER } from '~/ui/global/LowerRightCorner'

class CornerPositioned extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      element: document.querySelector(`.${CLASS_LOWER_RIGHT_CORNER}`),
    }
  }

  componentDidMount() {
    this.setState({
      element: document.querySelector(`.${CLASS_LOWER_RIGHT_CORNER}`),
    })
  }

  render() {
    const { children } = this.props
    return ReactDOM.createPortal(children, this.state.element)
  }
}

CornerPositioned.propTypes = {
  children: PropTypes.node,
}
CornerPositioned.defaultProps = {
  children: null,
}

export default CornerPositioned
