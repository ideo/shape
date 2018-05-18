import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

/** @component */
export const Row = styled.div`
  align-items: ${props => props.align};
  display: flex;
  justify-content: space-between;
  ${props => !props.noSpacing && 'margin-bottom: 15px'};
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

/** @component */
export const RowItemLeft = styled.span`
  margin-right: auto;
  margin-left: 14px;
`
RowItemLeft.displayName = 'StyledRowItemLeft'

/** @component */
export const RowItemRight = styled.span`
  margin-left: auto;
`
RowItemRight.displayName = 'StyledRowItemRight'

/** @component */
export const FloatRight = styled.span`
  float: right;
`
FloatRight.displayName = 'StyledFloatRight'

/** @component */
export const RowItem = styled.span`
  align-self: center;
  vertical-align: center;

  &:last-child {
    margin-right: auto;
  }
`
RowItem.displayName = 'StyledRowItem'

export const FixedHeader = styled.header`
  z-index: ${props => props.zIndex};
  position: fixed;
  top: 0;
  width: calc(100% - ${v.containerPadding.horizontal}*2);
  background: ${v.colors.cararra};
  padding: 1rem ${v.containerPadding.horizontal};
`
FixedHeader.displayName = 'FixedHeader'

export const MaxWidthContainer = styled.div`
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
`
MaxWidthContainer.displayName = 'MaxWidthContainer'
