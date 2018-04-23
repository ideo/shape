import PropTypes from 'prop-types'

const position = {
  xPos: PropTypes.number.isRequired,
  yPos: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
}

const muiBackdrop = {
  invisible: PropTypes.bool.isRequired,
  classes: PropTypes.object,
}

export default {
  position,
  muiBackdrop,
}
