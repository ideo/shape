import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'

import { FormButton } from '~/ui/global/styled/buttons'
import { Heading1, Anchor } from '~/ui/global/styled/typography'
import Link from '~/ui/global/Link'
import Logo from '~/ui/layout/Logo'
import v from '~/utils/variables'
import poweredByIdeo from '~/assets/Powered-by-IDEO.png'

const StyledDialog = styled(Dialog)`
  // This ensures terms of use dialog always stays on top of all others.
  &.root__dialog {
    position: absolute;
    z-index: 1500;
  }
  .modal__paper {
    padding: 20px;
    max-width: 475px;
    width: 100%;
  }
  p {
    margin-bottom: 30px;
  }
  input {
    display: inline-block;
    margin-right: 8px;
  }
  .button--center {
    margin-top: 20px;
    margin-bottom: 80px;
    text-align: center;
  }
  .form-control {
    font-size: 1rem;
    font-family: ${v.fonts.serif};
    &--error {
      font-size: 0.9rem;
      color: ${v.colors.alert};
      margin: 0;
      margin-top: -12px;
      margin-bottom: 5px;
      margin-left: 34px;
    }
  }
  .footer {
    text-align: center;
    img {
      width: 83px;
    }
  }
`
const StyledLogo = styled(Logo)`
  margin: 16px auto 50px;
`

@observer
class TermsOfUseModal extends React.Component {
  @observable
  isLoading = false
  @observable
  submitted = false

  @action
  handleSubmit = e => {
    e.preventDefault()
    this.submitted = true
    const { currentUser } = this.props
    this.isLoading = true
    currentUser.API_acceptCurrentOrgTerms().finally(() => {
      runInAction(() => {
        this.isLoading = false
      })
    })
  }

  render() {
    const { currentUser } = this.props
    const { current_org_terms_accepted } = currentUser
    const organization = currentUser.current_organization
    const outdated = current_org_terms_accepted === 'outdated'
    const introMessage = outdated
      ? `${organization.name}'s Terms for Shape have changed! Please take a moment to review the`
      : 'Welcome to Shape! Before you proceed, please take a moment to review the'

    const orgTermsOfUse = organization && organization.terms_text_item_id && (
      <span>
        {outdated && 'updated '}
        {organization.name}{' '}
        <Link target="_blank" to={`/terms/${organization.name}`}>
          Terms of Use
        </Link>
      </span>
    )

    return (
      <StyledDialog
        classes={{ root: 'root__dialog', paper: 'modal__paper' }}
        open
        BackdropProps={{
          invisible: true,
        }}
      >
        <DialogContent>
          <form onSubmit={this.handleSubmit}>
            <StyledLogo withText width={128} />
            <Heading1 wrapLine>Hello {currentUser.first_name}!</Heading1>
            <p>
              {introMessage} {orgTermsOfUse}.
            </p>
            <p>By clicking ‘Continue’ you agree to the {orgTermsOfUse}.</p>

            <div className="button--center">
              <FormButton disabled={this.isLoading}>Continue</FormButton>
            </div>
            <div className="footer">
              <p>
                Questions? Contact us at{' '}
                <Anchor href="mailto:productsupport@ideo.com">
                  productsupport@ideo.com
                </Anchor>
              </p>

              <a
                href="https://www.ideo.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <img src={poweredByIdeo} alt="Powered by IDEO" />
              </a>
            </div>
          </form>
        </DialogContent>
      </StyledDialog>
    )
  }
}

TermsOfUseModal.propTypes = {
  currentUser: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TermsOfUseModal
