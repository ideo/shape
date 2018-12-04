import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormHelperText from '@material-ui/core/FormHelperText'

import { FormButton, Checkbox } from '~/ui/global/styled/forms'
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
  margin: 16px auto 100px;
`

@observer
class TermsOfUseModal extends React.Component {
  @observable
  termsChecked = false
  @observable
  mailingListChecked = false
  @observable
  isLoading = false
  @observable
  submitted = false

  @action
  handleTermsCheck = event => {
    this.termsChecked = event.target.checked
  }

  @action
  handleMailingListCheck = event => {
    this.mailingListChecked = event.target.checked
  }

  @action
  handleSubmit = e => {
    e.preventDefault()
    this.submitted = true
    if (this.termsChecked) {
      const { currentUser } = this.props
      this.isLoading = true
      currentUser
        .API_acceptTerms({ mailing_list: this.mailingListChecked })
        .finally(() => {
          runInAction(() => {
            this.isLoading = false
          })
        })
    }
  }

  render() {
    const { currentUser } = this.props
    const organization = currentUser.current_organization
    const showBillingInformation =
      !organization ||
      (organization &&
        organization.in_app_billing &&
        organization.primary_group.can_edit)
    const displayError = this.submitted && !this.termsChecked
    const trialUsersCount =
      (organization && organization.trial_users_count) || 25
    const trialPricePerUser = (organization && organization.price_per_user) || 5
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
            <StyledLogo width={128} />
            <Heading1 wrapLine>Hello {currentUser.first_name}!</Heading1>
            <p>
              {showBillingInformation
                ? `Welcome to your 3 month free trial of Shape. The first ${trialUsersCount} people who use Shape at your organization will be free for the first 6 months. Shape licenses are $${trialPricePerUser} per person per month. Please take a moment to`
                : 'Welcome to Shape. Before you proceed, please take a moment to'}{' '}
              review our{' '}
              <Link target="_blank" to="/terms">
                Terms of Use
              </Link>
              .
            </p>

            <FormControl component="fieldset" required error={displayError}>
              <FormControlLabel
                classes={{ label: 'form-control' }}
                control={
                  <Checkbox
                    classes={{
                      root: displayError ? 'checkbox--error' : '',
                    }}
                    checked={this.termsChecked}
                    onChange={this.handleTermsCheck}
                    value="yes"
                  />
                }
                label="I agree to the Terms of Use."
              />
              {!displayError && <div style={{ height: '6px' }} />}
              {displayError && (
                <FormHelperText
                  classes={{
                    root: 'form-control',
                    error: 'form-control--error',
                  }}
                >
                  Please indicate you agree to the Terms of Use.
                </FormHelperText>
              )}
            </FormControl>
            <FormControl component="fieldset">
              <FormControlLabel
                classes={{ label: 'form-control' }}
                control={
                  <Checkbox
                    checked={this.mailingListChecked}
                    onChange={this.handleMailingListCheck}
                    value="yes"
                  />
                }
                label="Stay current on new features and case studies by signing up for our mailing list"
              />
            </FormControl>

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
