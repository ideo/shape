// eslint-disable-next-line no-unused-vars
import React from 'react'
import { StyledRowFlexParent, StyledRowFlexHeader } from './styled'
import { SmallHelperText } from '~/ui/global/styled/typography'

const AudienceTableHeader = () => (
  <StyledRowFlexParent>
    <StyledRowFlexHeader>
      <SmallHelperText>$/Response</SmallHelperText>
    </StyledRowFlexHeader>
    <StyledRowFlexHeader>
      <SmallHelperText>Size</SmallHelperText>
    </StyledRowFlexHeader>
    <StyledRowFlexHeader>
      <SmallHelperText>Price</SmallHelperText>
    </StyledRowFlexHeader>
  </StyledRowFlexParent>
)

export default AudienceTableHeader
