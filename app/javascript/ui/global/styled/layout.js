import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
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

export const StyledHeaderRow = styled(Row)`
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-left: 0;
  margin-bottom: 0;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 100%;
  }
`

/** @component */
export const RowItemLeft = styled.span`
  margin-right: auto;
  margin-left: 14px;
`
RowItemLeft.displayName = 'StyledRowItemLeft'

/** @component */
export const RowItemRight = styled.span`
  margin-left: auto;

  &:last-child {
    margin-left: 10px;
  }
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

export const RowItemGrid = styled(Grid)`
  align-self: center;
  margin-left: 14px;
`

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
  box-sizing: border-box;
  width: 100%;
  padding: 0 ${v.containerPadding.horizontal}rem 0.2rem;
  position: relative; /* necessary to get above the FixedBoundary */
  // Page headers should still show up in print styles
  @media print {
    ${props =>
      props.pageHeader &&
      `
      display: block;
      position: fixed;
      top: 0;
    `};
  }
`
StyledHeader.displayName = 'StyledHeader'
StyledHeader.defaultProps = {
  pageHeader: false,
}

export const FixedHeader = styled(StyledHeader)`
  position: fixed;
  top: 0;
  padding: 4px ${v.containerPadding.horizontal}rem 0;
  z-index: ${v.zIndex.globalHeader};
  background: ${({ darkBackground }) =>
    darkBackground
      ? hexToRgba(v.colors.commonMediumTint, 0.96)
      : hexToRgba(v.colors.commonLight, 0.96)};
  @supports (
    (-webkit-backdrop-filter: blur(4px)) or (backdrop-filter: blur(4px))
  ) {
    background: ${hexToRgba(v.colors.commonLight, 0.9)};
    backdrop-filter: blur(4px);
  }
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding-left: 5px;
    padding-right: 5px;
  }

  ${props =>
    props.sticky &&
    `
    background: ${hexToRgba(v.colors.commonLight, 0.96)};
    position: sticky;
    top: ${v.headerHeight + 4}px;
    z-index: ${v.zIndex.pageHeader};
  `}

  @media print {
    display: none !important;
  }
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
  margin-top: 20px;
  overflow-y: ${props => (props.moving ? 'hidden' : 'scroll')};
  overflow-x: hidden;
  margin-bottom: 10px;
  height: 100%;
  position: relative;
  /* NOTE: this padding is because we moved that out of the overall ActivityContainer */
  padding: 0 10px;
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

export const HeaderSpacer = styled.div`
  height: ${v.headerHeight}px;
`

export const ScrollArea = styled.div`
  flex: 1 1 auto;
  min-height: 220px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`
ScrollArea.displayName = 'ScrollArea'

export const FooterBreak = styled.div`
  border-top: 1px solid ${v.colors.commonMedium};
  width: 100%;
`

export const FooterArea = styled.div`
  flex: 0 0 auto;
  padding-top: 24px;
  padding-bottom: 30px;
`

export const StyleguideHolder = styled.div`
  height: ${props => props.height}px;
  padding-top: 20px;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  width: 500px;
  background-color: ${({ backgroundColor }) => backgroundColor};
`
StyleguideHolder.defaultProps = {
  height: 200,
  backgroundColor: 'white',
}
