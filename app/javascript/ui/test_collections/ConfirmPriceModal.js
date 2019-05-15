import PropTypes from 'prop-types'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'

import PaperAirplane from '~/ui/test_collections/PaperAirplane'
import { ModalCloseButton } from '~/ui/global/modals/Modal'
import { FormButton } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'
import CardBrandIcon from '~shared/components/atoms/CardBrandIcon'

// Extract children from here
// Reuse for both Agree to Terms and Confirm Payment?
const ConfirmPriceModal = ({
  onSubmit,
  open,
  close,
  paymentMethod,
  totalPrice,
  testName,
}) => (
  <StyledDialog
    classes={{ root: 'root__dialog', paper: 'modal__paper' }}
    open={open}
    BackdropProps={{
      invisible: true,
    }}
  >
    <StyledModalCloseButton onClick={close}>
      <CloseIcon />
    </StyledModalCloseButton>
    <StyledDialogContent classes={{ root: 'root__dialog-content' }}>
      <form onSubmit={onSubmit}>
        <PaperAirplane />
        <SpecialDisplayHeading wrapLine>
          Your test "{testName}" is about to be launched. Your payment method
          will be charged <strong>${totalPrice}</strong> for this feedback.
        </SpecialDisplayHeading>
        <StyledDiv
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '2rem',
          }}
        >
          <CardBrandIcon brand={paymentMethod.brand} width={32} height={30} />{' '}
          <DisplayText>
            {paymentMethod.brand} ending in {paymentMethod.last4} will be
            charged.
          </DisplayText>
        </StyledDiv>
        <StyledDiv style={{ textAlign: 'center' }}>
          <FormButton width={200}>Get Feedback</FormButton>
        </StyledDiv>
      </form>
    </StyledDialogContent>
  </StyledDialog>
)

const SpecialDisplayHeading = styled.p`
  padding: 30px 0;
  line-height: 1.625rem;
  font-family: ${v.fonts.sans};
  font-size: 1.25rem;
  font-weight: ${v.weights.book};
  color: ${v.colors.black};
`

const StyledDialog = styled(Dialog)`
  .modal__paper {
    text-align: center;
    padding: 20px 35px;
    padding-top: 35px;
    max-width: 560px;
    max-height: 480px;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      margin: 0;
      max-width: 100%;
      min-height: 100vh;
    }
  }
`
StyledDialog.displayName = 'StyledDialog'

const StyledDialogContent = styled(DialogContent)`
  &.root__dialog-content {
    padding: 20px 35px;
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding-bottom: 120px !important;
  }
`

const StyledModalCloseButton = styled(ModalCloseButton)`
  top: 35px;
`

const StyledDiv = styled.div`
  padding: 1rem 0;
`

ConfirmPriceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  paymentMethod: PropTypes.shape({
    last4: PropTypes.number,
    brand: PropTypes.string,
  }).isRequired,
  testName: PropTypes.string.isRequired,
  totalPrice: PropTypes.string.isRequired,
}

export default ConfirmPriceModal
