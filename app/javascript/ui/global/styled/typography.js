import styled from 'styled-components'
import v from '~/utils/variables'

/** @component */
export const Heading1 = styled.h1`
  font-family: ${v.fonts.sans};
  font-size: 2.25rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 2px;
  color: black;
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
  white-space: ${props => (props.wrapLine ? 'normal' : 'nowrap')}; /* better this way for responsive? */
  text-transform: uppercase;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding: 1rem 0;
    font-size: 1.5rem;
  }
`
Heading1.displayName = 'Heading1'

/** @component */
export const SimpleHeading1 = Heading1.extend`
  margin-bottom: 2rem;
  text-transform: none;
`
SimpleHeading1.displayName = 'SimpleHeading1'

/** @component */
export const Heading2 = styled.h2`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1.5rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.14375rem;
  color: ${v.colors.blackLava};
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
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
`
DisplayText.displayName = 'StyledDisplayText'

export const SubduedHeading1 = styled.h1`
  color: ${v.colors.gray};
  display: inline-block;
  font-weight: 300;
  margin-bottom: 0;
  margin-left: 20px;
  padding-top: 8px;
  text-transform: none;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    font-size: 1.5rem;
    padding-top: 20px;
  }
`
SubduedHeading1.displayName = 'SubduedHeading1'

/** @component */
export const SubduedText = DisplayText.extend`
  color: ${v.colors.cloudy};
`
SubduedText.displayName = 'SubduedText'

/** @component */
export const DisplayLink = styled.a`
  color: ${v.colors.gray};
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  color: black;
`
DisplayLink.displayName = 'StyledDisplayLink'

/** @component */
export const SubduedTitle = styled.span`
  color: ${v.colors.gray};
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
`
SubText.displayName = 'StyledSubText'

/** @component */
export const Anchor = styled.a`
  cursor: pointer;
  color: ${v.colors.pacificBlue};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`
Anchor.displayName = 'StyledAnchor'

export const CardHeading = styled.h2`
  font-size: 2.25rem;
  line-height: 2.5rem;
  margin-bottom: 0.25rem;
  max-width: 100%;
  text-transform: none;
  transition: all 0.33s 0.25s;

  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
    font-size: 2rem;
  }
`
CardHeading.displayName = 'CardHeading'
