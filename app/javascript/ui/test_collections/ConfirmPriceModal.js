import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import { ModalCloseButton } from '~/ui/global/modals/Modal'
// Need to replace with actual asset => how to add to AWS?
import PaperAirplane from '~/ui/test_collections/PaperAirplane'
import { FormButton } from '~/ui/global/styled/forms'
import { Heading1, DisplayText } from '~/ui/global/styled/typography'
import { List, ListItem } from '~/ui/global/styled/lists'
import Link from '~/ui/global/Link'
import { colors, flexbox } from '~shared/styles/index'
import v from '~/utils/variables'
import CloseIcon from '../icons/CloseIcon'
import CardBrandIcon from '~shared/components/atoms/CardBrandIcon'

// Extract children from here
// Reuse for both Agree to Terms and Confirm Payment?
const FeedbackTermsModal = ({
  onSubmit,
  open,
  close,
  paymentMethod,
  price,
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
    <DialogContent>
      <form onSubmit={onSubmit}>
        <PaperAirplane />
        <SpecialDisplayHeading wrapLine>
          Your test "{testName}" is about to be launched. Your payment method
          will be charged {price} for this feedback.
        </SpecialDisplayHeading>
        <StyledDiv>
          <DisplayText>
            <CardBrandIcon brand={paymentMethod.brand} width={32} height={30} />{' '}
            {paymentMethod.brand} ending in {paymentMethod.last4} will be
            charged.
          </DisplayText>
        </StyledDiv>
        <StyledDiv style={{ textAlign: 'center', marginTop: '1rem' }}>
          <FormButton width={200}>Get Feedback</FormButton>
        </StyledDiv>
      </form>
    </DialogContent>
  </StyledDialog>
)

const SpecialDisplayHeading = styled.p`
  margin: 0;
  margin-top: 10px;
  margin-bottom: 20px;
  line-height: 1.625rem;
  font-family: ${v.fonts.sans};
  font-size: 1.25rem;
  font-weight: ${v.weights.book};
  color: ${v.colors.black};
`

const StyledDialog = styled(Dialog)`
  .modal__paper {
    text-align: center;
    padding: 20px;
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
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding-bottom: 120px !important;
  }
`

const StyledModalCloseButton = styled(ModalCloseButton)`
  top: 35px;
`

const StyledDiv = styled.div`
  margin: 1.5rem 0;
`

FeedbackTermsModal.propTypes = {
  close: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default FeedbackTermsModal
