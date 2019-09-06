import styled from 'styled-components'
import v from '~/utils/variables'
import { StyledGridCard } from './shared'

const GridCardPlaceholder = styled(StyledGridCard)`
  background: ${v.colors.primaryLight};
`

// useful for doing unit testing e.g. wrapper.find('H1')
GridCardPlaceholder.displayName = 'GridCardPlaceholder'

export default GridCardPlaceholder
