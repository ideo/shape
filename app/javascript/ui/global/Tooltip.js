import PropTypes from 'prop-types'
import MuiTooltip from '@material-ui/core/Tooltip'
import { withStyles } from '@material-ui/core/styles'

import v from '~/utils/variables'

// Tooltip doesn't seem to respect styled-components, see:
// https://github.com/mui-org/material-ui/issues/11467
const styles = {
  tooltip: {
    backgroundColor: v.colors.blackLava,
    fontSize: '0.75rem',
    fontFamily: v.fonts.sans,
    borderRadius: 0,
    margin: '8px 0',
  },
}

@withStyles(styles)
class Tooltip extends React.PureComponent {
  render() {
    const { classes, ...otherProps } = this.props
    return (
      <MuiTooltip
        classes={{
          tooltip: classes.tooltip,
        }}
        {...otherProps}
      />
    )
  }
}

Tooltip.propTypes = {
  classes: PropTypes.shape({
    tooltip: PropTypes.string,
    open: PropTypes.string,
  }).isRequired,
}

Tooltip.displayName = 'Tooltip'

export default Tooltip
