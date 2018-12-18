import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import v from '~/utils/variables'

const Heading1Css = css`
  color: ${v.colors.black};
  font-family: ${v.fonts.sans};
  font-size: 1.75rem;
  font-weight: ${v.weights.book};
  line-height: 2rem;
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
  text-transform: none;
  white-space: ${props =>
    props.wrapLine ? 'normal' : 'nowrap'}; /* better this way for responsive? */

  @media only screen and (max-width: ${v.responsive.largeBreakpoint}px) {
    padding: 1rem 0;
    font-size: 1.5rem;
    line-height: 1.75rem;
  }
`
/** @component */
export const Heading1 = styled.h1`
  ${Heading1Css};
`
Heading1.displayName = 'Heading1'

/** @component */
export const Heading2 = styled.h2`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1.5rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.14375rem;
  color: ${v.colors.black};
`
Heading2.displayName = 'Heading2'

/** @component */
export const Heading3 = styled.h3`
  text-transform: uppercase;
  margin-bottom: 13px;
  font-size: 0.9375rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
`
Heading3.displayName = 'StyledHeading3'

/** @component */
export const DisplayText = styled.span`
  color: ${props => props.color || v.colors.black};
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
`
DisplayText.displayName = 'StyledDisplayText'

export const NumberListText = DisplayText.extend`
  display: inline-block;
  font-weight: ${v.weights.medium};
  min-width: 25px;
`
NumberListText.displayName = 'NumberListText'

export const SubduedHeading1 = styled.h1`
  color: ${v.colors.commonMedium};
  font-size: 1.5rem;
  display: inline-block;
  font-weight: 300;
  margin-bottom: 0;
  margin-left: 8px;
  padding-top: 12px;
  text-transform: none;
  white-space: nowrap;
`
SubduedHeading1.displayName = 'SubduedHeading1'

/** @component */
export const SubduedText = DisplayText.extend`
  color: ${v.colors.commonDark};
`
SubduedText.displayName = 'SubduedText'

/** @component */
export const DisplayLink = styled.a`
  color: ${v.colors.commonMedium};
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  color: black;
`
DisplayLink.displayName = 'StyledDisplayLink'

export const LoudDisplayLink = DisplayLink.extend`
  text-transform: uppercase;
  text-decoration: none;
  font-weight: ${v.weights.medium};
  display: block;
`

/** @component */
export const SubduedTitle = styled.span`
  color: ${v.colors.commonMedium};
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
`
SubduedTitle.displayName = 'StyledSubduedTitled'

/** @component */
export const ConfirmText = styled.span`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1.25rem;
`

/** @component */
export const SubText = styled.span`
  vertical-align: super;
  font-family: ${v.fonts.serif};
  font-size: 0.75rem;
  ${props =>
    props.compact &&
    `
    display: block;
    margin-top: -7px;
  `};
`
SubText.displayName = 'StyledSubText'

/** @component */
export const SmallHelperText = styled.span`
  color: ${props => props.color};
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
`
SmallHelperText.displayName = 'SmallHelperText'
SmallHelperText.propTypes = {
  color: PropTypes.oneOf(Object.values(v.colors)),
}
SmallHelperText.defaultProps = {
  color: v.colors.commonMedium,
}

export const SmallActionText = SmallHelperText.extend`
  color: white;
  font-weight: 500;
  letter-spacing: 2.25px;
  text-transform: uppercase;
`
SmallActionText.displayName = 'SmallActionText'

/** @component */
export const Anchor = styled.a`
  cursor: pointer;
  color: ${v.colors.ctaPrimary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`
Anchor.displayName = 'StyledAnchor'

export const CardHeadingCss = css`
  ${Heading1Css};
  color: ${props => props.color || v.colors.commonLight};
  margin-bottom: 0.25rem;
  margin-top: 0;
  max-width: 100%;
  transition: all 0.33s 0.25s;
  white-space: normal;

  @media only screen and (min-width: ${v.responsive
      .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
    padding: 0;
  }
`
export const CardHeading = Heading1.extend`
  ${CardHeadingCss};
`
CardHeading.displayName = 'CardHeading'

export const TextItemHeading1Css = css`
  ${CardHeadingCss};

  && {
    color: ${v.colors.black};
    margin-bottom: 0.75rem;
  }
`

export const HugeNumber = Heading1.extend`
  font-size: 4.5rem;
  font-weight: ${v.weights.book};
  line-height: 3.75rem;
`

export const QuillStyleWrapper = styled.div`
  .quill {
    h1 {
      ${TextItemHeading1Css};
      color: ${v.colors.black};
    }

    h1,
    h3 {
      margin-bottom: 0.75rem;
    }

    p {
      margin-bottom: 0.625rem;
    }

    p + h3 {
      margin-top: 0.85rem;
    }
  }
`
