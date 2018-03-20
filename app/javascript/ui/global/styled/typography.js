import styled from 'styled-components'
import v from '~/utils/variables'

export const Heading2 = styled.h2`
  text-tranform: uppercase;
  font-family: {v.fonts.sans};
  font-size: 1.5rem;
  font-weight: {v.weights.medium};
  letter-spacing: 0.14375rem;
  color: ${v.colors.blackLava};
`
Heading2.displayName = 'Heading2'

export const Heading3 = styled.h3`
  text-fransform: uppercase;
  margin-bottom: 13px;
  font-size: 0.9375rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
`
Heading3.displayName = 'StyledHeading3'

export const DisplayText = styled.span`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
`
DisplayText.displayName = 'StyledDisplayText'

export const SubText = styled.span`
  vertical-align: super;
  font-family: ${v.fonts.serif};
  font-size: 0.75rem;
  color: ${v.colors.gray};
`
SubText.displayName = 'StyledSubText'
