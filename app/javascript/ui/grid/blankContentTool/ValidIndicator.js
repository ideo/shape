import PropTypes from 'prop-types'
import styled from 'styled-components'

const StyledValidIndicator = styled.div`
  position: absolute;
  top: 18px;
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

const ValidIndicator = ({ valid, loading }) => (
  <StyledValidIndicator className={valid ? 'valid' : 'invalid'}>
    {!loading && (valid ? '✔' : 'x')}
    {loading && '...'}
  </StyledValidIndicator>
)

ValidIndicator.propTypes = {
  valid: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
}

export default ValidIndicator
