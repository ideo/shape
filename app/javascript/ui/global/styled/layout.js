import PropTypes from 'prop-types'
import styled from 'styled-components'

export const Row = styled.div`
  align-items: ${props => props.align};
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  margin-left: 5px;
  width: 92%;
`
Row.displayName = 'StyledRow'
Row.propTypes = {
  align: PropTypes.oneOf(['flex-start', 'flex-end', 'center']),
}
Row.defaultProps = {
  align: 'flex-start'
}

export const RowItemLeft = styled.span`
  margin-right: auto;
  margin-left: 14px;
`
RowItemLeft.displayName = 'StyledRowItemLeft'

// TODO too large of a right margin, might have to make configurable
export const RowItemRight = styled.span`
  float: right;
  margin-left: auto;
`
RowItemRight.displayName = 'StyledRowItemRight'
