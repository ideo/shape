import styled from 'styled-components'
import Dialog, { DialogContent } from 'material-ui/Dialog'

const StyledDialog = styled(Dialog)`
  .modal__paper {
    padding: 20px;
    max-width: 475px;
    width: 100%;
  }
`

class TermsOfUseModal extends React.Component {
  render() {
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        open
        BackdropProps={{
          invisible: true
        }}
      >
        <DialogContent>
          <h1>hi</h1>
        </DialogContent>
      </StyledDialog>
    )
  }
}

TermsOfUseModal.propTypes = {}

export default TermsOfUseModal
