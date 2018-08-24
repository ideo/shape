import PropTypes from 'prop-types'
import FlipMove from 'react-flip-move'

const rotation = {
  from: {
    transform: 'rotate(180deg) translateY(80px)',
    transformOrigin: '110px 140px',
  },
  to: {
    transform: 'none',
    transformOrigin: '110px 140px',
  },
}

const BctButtonRotation = ({ children, disabled }) => (
  <FlipMove
    appearAnimation={!disabled ? rotation : false}
  >
    <div>
      { children }
    </div>
  </FlipMove>
)

BctButtonRotation.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
}
BctButtonRotation.defaultProps = {
  disabled: false,
}

export default BctButtonRotation
