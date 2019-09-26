import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import v from '~/utils/variables'

export const Heading1TypographyCss = css`
  color: ${v.colors.black};
  font-family: ${v.fonts.sans};
  font-size: 1.75rem;
  font-weight: ${v.weights.book};
  line-height: 2rem;
  text-transform: none;

  @media only screen and (max-width: ${v.responsive.largeBreakpoint}px) {
    font-size: 1.5rem;
    line-height: 1.75rem;
  }
`
const Heading1Css = css`
  ${Heading1TypographyCss};
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
  white-space: ${props =>
    props.wrapLine ? 'normal' : 'nowrap'}; /* better this way for responsive? */

  @media only screen and (max-width: ${v.responsive.largeBreakpoint}px) {
    /* Allow us not to have responsive behavior */
    ${props => (props.notResponsive ? '' : 'padding: 1rem 0;')};
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
  margin-bottom: ${({ noSpacing }) => (noSpacing ? 0 : 13)}px;
  font-size: 0.9375rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
  color: ${props => props.color || v.colors.black};
`
Heading3.displayName = 'StyledHeading3'

export const DisplayTextCss = css`
  color: ${props => props.color || v.colors.black};
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  text-transform: none;
`

/** @component */
export const DisplayText = styled.span`
  ${DisplayTextCss};
`
DisplayText.displayName = 'StyledDisplayText'

export const NumberListText = styled(DisplayText)`
  display: inline-block;
  font-weight: ${v.weights.medium};
  min-width: 25px;
`
NumberListText.displayName = 'NumberListText'

export const SpecialDisplayHeading = styled.p`
  color: ${v.colors.black};
  font-family: ${v.fonts.sans};
  font-size: 1.25rem;
  font-weight: ${v.weights.book};
  line-height: 1.625rem;
  text-align: center;
`

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
export const SubduedText = styled(DisplayText)`
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

export const LoudDisplayLink = styled(DisplayLink)`
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
  ${props => props.fontWeight && `font-weight: ${props.fontWeight};`}
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
`
SmallHelperText.displayName = 'SmallHelperText'
SmallHelperText.propTypes = {
  color: PropTypes.oneOf(Object.values(v.colors)),
  fontWeight: PropTypes.oneOf(Object.values(v.weights)),
}
SmallHelperText.defaultProps = {
  color: v.colors.commonMedium,
}

export const SmallActionText = styled(SmallHelperText)`
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
export const CardHeading = styled(Heading1)`
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

export const HugeNumber = styled(Heading1)`
  font-size: 4.5rem;
  font-weight: ${v.weights.book};
  line-height: 3.75rem;
`

export const QuillStyleWrapper = styled.div`
  ${props => {
    let margin = 40
    if (props.smallGrid) margin = 20
    return props.notEditing && props.hasTitleText
      ? `height: calc(100% - ${margin}px); margin-top: ${margin}px;`
      : 'height: 100%;'
  }}

  .quill {
    height: 100%;

    h1 {
      ${TextItemHeading1Css};
      color: ${v.colors.black};
    }

    h1,
    h2 {
      margin-bottom: 0.75rem;
    }

    h2 {
      font-size: 0.8125rem;
      letter-spacing: 1px;
      margin-bottom: 0.8125rem;
      text-transform: uppercase;
    }

    h5 {
      color: ${v.colors.black};
      font-size: 4rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 4rem;
      text-transform: none;
      vertical-align: bottom;
    }

    p {
      font-family: ${v.fonts.sans};
      font-size: 1rem;
      letter-spacing: 0;
      line-height: 1.5rem;
      margin-bottom: 0.625rem;
    }

    p + h2 {
      margin-top: 0.85rem;
    }

    a {
      color: ${v.colors.ctaPrimary};
    }

    @keyframes blink-animation {
      to {
        visibility: hidden;
      }
    }

    .ql-container {
      /* this overrides quill-cursors "display: flex" which was breaking IE */
      display: block;

      ${props => (props.notEditing ? '' : 'overflow: visible !important;')};
      ${props =>
        props.notEditing && props.hasTitleText
          ? 'justify-content: flex-end;'
          : ''};
    }

    .ql-cursor {
      cursor: text;
      .ql-cursor-caret {
        animation: blink-animation 1s steps(5, start) infinite;
        width: 3px;
      }
    }

    .ql-editor {
      overflow-x: hidden;
      ${props => (props.notEditing ? 'overflow-y: hidden;' : '')};
      ${props =>
        props.notEditing && props.hasTitleText
          ? 'display: block; height: auto; flex: initial;'
          : ''};
    }
  }
`
