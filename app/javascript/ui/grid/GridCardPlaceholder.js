import v from '~/utils/variables'
import { StyledGridCard } from './shared'

const GridCardPlaceholder = StyledGridCard.extend`
  background: ${v.colors.cyan};
`

// useful for doing unit testing e.g. wrapper.find('H1')
GridCardPlaceholder.displayName = 'GridCardPlaceholder'

export default GridCardPlaceholder
