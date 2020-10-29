import PropTypes from 'prop-types'
import styled from 'styled-components'

const Square = styled.div`
  background-color: ${props => props.color || '#ffffff'};
  display: block;
  height: 16px;
  width: 16px;
`

const ColorSquare = props => <Square color={props.color} />

ColorSquare.propTypes = {
  color: PropTypes.string,
}
ColorSquare.defaultProps = {
  color: '#ffffff',
}

export default ColorSquare
