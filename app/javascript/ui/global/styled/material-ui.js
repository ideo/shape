import styled from 'styled-components'
import Snackbar from '@material-ui/core/Snackbar'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import v from '~/utils/variables'

/** @component */
export const StyledSnackbar = styled(Snackbar)`
  &.Snackbar {
    width: 100%;
    top: auto;
    max-width: 673px;
    margin-bottom: 35px;
    flex-grow: 1;
    color: white;
    background-color: transparent;
  }
`
StyledSnackbar.displayName = 'StyledSnackbar'

/** @component */
export const StyledSnackbarContent = styled(SnackbarContent)`
  &.SnackbarContent {
    background-color: ${v.colors.cloudy};
    max-width: none;
    padding: 15px 30px;
    width: 100%;
  }
`
StyledSnackbarContent.displayName = 'StyledSnackbarContent'

/** @component */
export const SnackbarBackground = styled.div`
  background-color: ${v.colors.cloudy};
  min-height: 36px;
  padding: 15px 30px;
  width: 100%;
`
SnackbarBackground.displayName = 'SnackbarBackground'
