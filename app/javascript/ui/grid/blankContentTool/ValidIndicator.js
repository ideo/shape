import PropTypes from 'prop-types'
import styled from 'styled-components'

const StyledValidIndicator = styled.div`
  position: absolute;
  top: ${props => props.top}px;
  right: -24px;
  font-size: 1.25rem;
  font-weight: bold;
  width: 20px;
  &.valid {
    color: green;
  }
  &.invalid {
    color: red;
  }
`

const ValidIndicator = ({ valid, loading, top }) => (
  <StyledValidIndicator className={valid ? 'valid' : 'invalid'} top={top}>
    {!loading && (valid ? '✔' : 'x')}
    {loading && '...'}
  </StyledValidIndicator>
)

ValidIndicator.propTypes = {
  valid: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  top: PropTypes.number,
}
ValidIndicator.defaultProps = {
  top: 18,
}

export default ValidIndicator
