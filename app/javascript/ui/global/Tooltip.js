import { default as MuiTooltip } from 'material-ui/Tooltip'
import styled from 'styled-components'
import v from '~/utils/variables'

const Tooltip = styled(MuiTooltip)`
  .Tooltip {
    font-size: 0.75rem;
    font-family: ${v.fonts.sans};
  }
`
Tooltip.displayName = 'StyledTooltip'

export default Tooltip
