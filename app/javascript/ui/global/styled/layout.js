import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import hexToRgba from '~/utils/hexToRgba'
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
  align: 'flex-start',
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

export const InlineRow = styled(Flex)`
  & > * {
    display: inline-block;
    margin-left: 10px;
  }
  & > *:first-child {
    margin-left: 0;
  }
`
InlineRow.displayName = 'StyledInlineRow'

export const StyledHeader = styled.header`
  width: calc(100% - ${v.containerPadding.horizontal}rem * 2);
  padding: 1rem ${v.containerPadding.horizontal}rem;
  @media print {
    display: none;
  }
`
StyledHeader.displayName = 'StyledHeader'

export const FixedHeader = styled(StyledHeader)`
  z-index: ${props => props.zIndex};
  position: fixed;
  top: 0;
  background: ${v.colors.commonLight};
`
FixedHeader.displayName = 'FixedHeader'

export const MaxWidthContainer = styled.div`
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
  @media print {
    margin: 0;
    max-width: none;
  }
`
MaxWidthContainer.displayName = 'MaxWidthContainer'

export const ActivityContainer = styled.div`
  margin-top: 12px;
  overflow-y: ${props => (props.moving ? 'hidden' : 'scroll')};
  overflow-x: hidden;
  margin-bottom: 10px;
  height: 100%;
  padding-left: 10px;
  padding-right: 10px;
  position: relative;
`
ActivityContainer.displayName = 'ActivityContainer'

export const FadeHeader = styled.div`
  border-radius: 1px;
  background: linear-gradient(
    ${v.colors.secondaryDark} 0,
    ${v.colors.secondaryDark} 40%,
    ${hexToRgba(v.colors.secondaryDark, 0)} 100%
  );
  height: 27px;
  position: fixed;
  top: ${v.zIndex.floatOverContent};
  width: 100%;
  z-index: 100;
`

export const FullAbsoluteParent = styled.div`
  height: 100%;
  position: relative;
  width: 100%;
`

export const FullAbsolute = styled.div`
  height: 100%;
  position: absolute;
  top: 0;
  width: 100%;
`

export const SmallBreak = styled.div`
  display: block;
  height: 5px;
`
