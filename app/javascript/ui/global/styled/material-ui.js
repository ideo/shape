import styled from 'styled-components'
import Snackbar from '@material-ui/core/Snackbar'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import v from '~/utils/variables'

/** @component */
export const StyledSnackbar = styled(Snackbar)`
  &.Snackbar {
    max-width: 673px;
    margin-bottom: 35px;
    flex-grow: 1;
    color: white;
    background-color: transparent;
    ${props =>
      props.placement &&
      props.placement === 'bottom' &&
      `
      width: 100%
    `}
    ${props =>
      props.placement &&
      props.placement === 'top' &&
      `
      top: ${v.headerHeight + 12}px;
    `}
  }
`
StyledSnackbar.displayName = 'StyledSnackbar'

/** @component */
export const StyledSnackbarContent = styled(SnackbarContent)`
  &.SnackbarContent {
    background-color: ${props =>
      props.backgroundColor ? props.backgroundColor : v.colors.commonDark};
    max-width: none;
    padding: 15px 30px;
    width: 100%;
    margin-top: 0;
    &.autoWidth {
      width: auto;
    }
  }
`
StyledSnackbarContent.displayName = 'StyledSnackbarContent'

/** @component */
export const SnackbarBackground = styled.div`
  background-color: ${v.colors.commonDark};
  min-height: 36px;
  padding: 15px 30px;
  width: 100%;
`
SnackbarBackground.displayName = 'SnackbarBackground'

// This text is different from other typography
export const StyledSnackbarText = styled.span`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: ${v.weights.book};
  letter-spacing: 0.1rem;
  color: white;
`
StyledSnackbarText.displayName = 'StyledSnackbarText'
