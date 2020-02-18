import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import PaperAirplane from '~/ui/test_collections/PaperAirplane'
import { ModalCloseButton } from '~/ui/global/modals/Modal'
import Button from '~/ui/global/Button'
import TextButton from '~/ui/global/TextButton'
import {
  DisplayText,
  SpecialDisplayHeading,
} from '~/ui/global/styled/typography'
import PlainLink from '~/ui/global/PlainLink'
import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'
import CardBrandIcon from '~shared/components/atoms/CardBrandIcon'

const StyledSpecialDisplayHeading = styled(SpecialDisplayHeading)`
  margin-bottom: 0;
  padding: 30px 0;
  width: 422px;
`

const StyledDialog = styled(Dialog)`
  .modal__paper {
    text-align: center;
    padding: 20px 35px;
    padding-top: 35px;
    max-width: 560px;
    max-height: 75vh;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      margin: 0;
      max-width: 100%;
      max-height: 100vh;
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

class ConfirmPriceModal extends React.Component {
  renderMissingPaymentContent() {
    const { close } = this.props
    return (
      <React.Fragment>
        <StyledSpecialDisplayHeading wrapLine>
          Oh no! It looks like you don't have a valid payment method for this
          feedback request. Please ask an administrator to add a payment method.
        </StyledSpecialDisplayHeading>
        <StyledDiv style={{ textAlign: 'center' }}>
          <TextButton onClick={close} width={200}>
            Close
          </TextButton>
        </StyledDiv>
      </React.Fragment>
    )
  }

  renderPaymentMethodContent() {
    const { onSubmit, testName, totalPrice } = this.props
    const buttonProps = {
      disabled: !this.hasPaymentMethod,
      minWidth: 200,
    }

    return (
      <form onSubmit={onSubmit}>
        <StyledSpecialDisplayHeading wrapLine>
          "{testName}" is about to be launched. You will receive an email
          notification when your results are ready in 2-5 business days. Your
          payment method will be charged <strong>{totalPrice}</strong> for this
          feedback.
        </StyledSpecialDisplayHeading>
        <StyledDiv
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '2rem',
          }}
        >
          {this.renderPaymentMethodToCharge()}
        </StyledDiv>
        <StyledDiv style={{ textAlign: 'center' }}>
          <Button {...buttonProps}>Get Feedback</Button>
        </StyledDiv>
      </form>
    )
  }

  renderPaymentMethodToCharge() {
    const { paymentMethod, organization } = this.props

    const message = paymentMethod
      ? `${paymentMethod.brand} ending in ${paymentMethod.last4} will be
            charged.`
      : `${organization.name}'s default payment method will be charged.`
    const paymentBrand = paymentMethod ? paymentMethod.brand : null

    if (this.hasPaymentMethod) {
      return (
        <React.Fragment>
          <CardBrandIcon brand={paymentBrand} width={32} height={30} />{' '}
          <DisplayText>{message}</DisplayText>
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        <CardBrandIcon brand={null} width={32} height={30} />
        <DisplayText>
          <PlainLink to={'/billing'}>
            Please add a payment method to continue.
          </PlainLink>
        </DisplayText>
      </React.Fragment>
    )
  }

  get isOrgAdmin() {
    const { organization } = this.props
    return organization.primary_group
      ? organization.primary_group.can_edit
      : false
  }

  get hasPaymentMethod() {
    const { organization } = this.props
    return organization.has_payment_method
  }

  render() {
    const { open, close } = this.props

    return (
      <StyledDialog
        classes={{ root: 'root__dialog', paper: 'modal__paper' }}
        open={open}
        BackdropProps={{ invisible: true }}
      >
        <StyledModalCloseButton onClick={close}>
          <CloseIcon />
        </StyledModalCloseButton>
        <StyledDialogContent classes={{ root: 'root__dialog-content' }}>
          <PaperAirplane />
          {this.hasPaymentMethod || this.isOrgAdmin
            ? this.renderPaymentMethodContent()
            : this.renderMissingPaymentContent()}
        </StyledDialogContent>
      </StyledDialog>
    )
  }
}

ConfirmPriceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  organization: MobxPropTypes.objectOrObservableObject,
  paymentMethod: PropTypes.shape({
    last4: PropTypes.number,
    brand: PropTypes.string,
  }),
  testName: PropTypes.string.isRequired,
  totalPrice: PropTypes.string.isRequired,
}

ConfirmPriceModal.defaultProps = {
  organization: null,
  paymentMethod: null,
}

export default ConfirmPriceModal
