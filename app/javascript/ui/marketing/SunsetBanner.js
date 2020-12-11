import styled from 'styled-components'
import { Link } from 'react-router-dom'

import v from '~/utils/variables'
import { DisplayLink } from '~/ui/global/styled/typography'
import Banner from '~/ui/layout/Banner'

const StyledText = styled.p`
  font-size: 1rem;
`

const StyledDisplayLink = styled(DisplayLink)`
  font-size: 0.75rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 1px;
  text-decoration: none;
  text-transform: uppercase;
  &:hover {
    text-decoration: underline;
  }
`

const SunsetBanner = () => {
  const leftComponent = (
    <StyledText>
      IDEO has made the difficult decision to wind down operations of the Shape
      offering. We will end service on February 25, 2021. Read more{' '}
      <Link to="/sunset">here</Link>.
    </StyledText>
  )

  const rightComponent = (
    <StyledDisplayLink href="/sunset">Learn More</StyledDisplayLink>
  )

  return (
    <Banner
      margin="none"
      color={v.colors.primaryDark}
      leftComponent={leftComponent}
      rightComponent={rightComponent}
    />
  )
}

export default SunsetBanner
