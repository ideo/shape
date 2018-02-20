import v from '~/utils/variables'
import { StyledGridCard } from './GridCard'

const GridCardPlaceholder = StyledGridCard.extend`
  background: ${v.colors.placeholder};
`

// useful for doing unit testing e.g. wrapper.find('H1')
GridCardPlaceholder.displayName = 'GridCardPlaceholder'

export default GridCardPlaceholder
