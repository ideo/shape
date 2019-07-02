import { StyledRowFlexParent, StyledRowFlexHeader } from './styled'
import { SmallHelperText } from '~/ui/global/styled/typography'
import styled from 'styled-components'

const AudienceHeader = styled(StyledRowFlexHeader)`
  text-align: right;
`

const AudienceTableHeader = () => (
  <StyledRowFlexParent>
    <AudienceHeader>
      <SmallHelperText>$/Response</SmallHelperText>
    </AudienceHeader>
    <AudienceHeader>
      <SmallHelperText>Size</SmallHelperText>
    </AudienceHeader>
    <AudienceHeader>
      <SmallHelperText>Price</SmallHelperText>
    </AudienceHeader>
  </StyledRowFlexParent>
)

export default AudienceTableHeader
