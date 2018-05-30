import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog, { DialogContent } from 'material-ui/Dialog'
import Checkbox from 'material-ui/Checkbox'
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
} from 'material-ui/Form'

import {
  FormButton,
} from '~/ui/global/styled/forms'
import { Heading1, Anchor } from '~/ui/global/styled/typography'
import Link from '~/ui/global/Link'
import Logo from '~/ui/layout/Logo'
import v from '~/utils/variables'
import poweredByIdeo from '~/assets/Powered-by-IDEO.png'

const StyledDialog = styled(Dialog)`
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
      color: ${v.colors.orange};
    }
  }
  .checkbox--color {
    color: ${v.colors.pacificBlue};
  }
  .checkbox--error {
    color: ${v.colors.orange};
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
  @observable termsChecked = false
  @observable isLoading = false
  @observable submitted = false

  @action handleTermsCheck = (event) => {
    this.termsChecked = event.target.checked
  }

  @action handleSubmit = (e) => {
    e.preventDefault()
    this.submitted = true
    if (this.termsChecked) {
      const { currentUser } = this.props
      this.isLoading = true
      currentUser.API_acceptTerms()
        .finally(() => {
          runInAction(() => { this.isLoading = false })
        })
    }
  }

  render() {
    const { currentUser } = this.props
    const displayError = this.submitted && !this.termsChecked
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        open
        BackdropProps={{
          invisible: true
        }}
      >
        <DialogContent>
          <form onSubmit={this.handleSubmit}>
            <StyledLogo width={128} />
            <Heading1 wrapLine>
              Hello {currentUser.first_name}!
            </Heading1>
            <p>
              Welcome to Shape. Before you proceed, please take a moment to review our{' '}
              <Link target="_blank" to="/terms">Terms of Use</Link>.
            </p>

            <FormControl
              component="fieldset"
              required
              error={displayError}
            >
              <FormControlLabel
                classes={{ label: 'form-control' }}
                control={
                  <Checkbox
                    classes={{
                      checked: 'checkbox--color',
                      default: displayError ? 'checkbox--error' : ''
                    }}
                    checked={this.termsChecked}
                    onChange={this.handleTermsCheck}
                    value="yes"
                  />
                }
                label="I agree to the Terms of Use."
              />
              {!displayError &&
                <div style={{ height: '54px' }} />
              }
              {displayError &&
                <FormHelperText
                  classes={{
                    root: 'form-control',
                    error: 'form-control--error',
                  }}
                >
                  Please indicate you agree to the Terms of Use.
                </FormHelperText>
              }
            </FormControl>

            <div className="button--center">
              <FormButton disabled={this.isLoading}>
                Continue
              </FormButton>
            </div>
            <div className="footer">
              <p>
                Questions? Contact us at <Anchor href="mailto:productsupport@ideo.com">productsupport@ideo.com</Anchor>
              </p>

              <a href="https://www.ideo.com/" rel="noopener noreferrer" target="_blank">
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
