import PropTypes from 'prop-types'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'

import { ModalCloseButton } from '~/ui/global/modals/Modal'
import PaperAirplane from '~/ui/test_collections/PaperAirplane'
import Button from '~/ui/global/Button'
import {
  DisplayText,
  SpecialDisplayHeading,
} from '~/ui/global/styled/typography'
import Link from '~/ui/global/Link'
import v from '~/utils/variables'
import CloseIcon from '../icons/CloseIcon'

const StyledSpecialDisplayHeading = styled(SpecialDisplayHeading)`
  margin: 0;
  margin-top: 2rem;
  margin-bottom: 1.25rem;
`

const StyledDialog = styled(Dialog)`
  .modal__paper {
    padding-top: 65px;
    max-width: 680px;
    max-height: 692px;
    width: 100%;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      margin: 0;
      max-width: 100%;
      min-height: 100vh;
    }
  }
`
StyledDialog.displayName = 'StyledDialog'

const StyledDisplayText = styled(DisplayText)`
  font-size: 0.75rem;
`

const StyledListItem = styled.li`
  margin-top: 0.75rem;
`

const FeedbackTermsModal = ({ onSubmit, open, close }) => (
  <StyledDialog
    classes={{ root: 'root__dialog', paper: 'modal__paper' }}
    open={open}
    BackdropProps={{
      invisible: true,
    }}
  >
    <ModalCloseButton onClick={close}>
      <CloseIcon />
    </ModalCloseButton>
    <DialogContent>
      <form onSubmit={onSubmit} style={{ padding: '0 29px' }}>
        <PaperAirplane />
        <StyledSpecialDisplayHeading wrapLine>
          Before you launch your first test, please review and agree to the
          terms below.
        </StyledSpecialDisplayHeading>
        <div style={{ marginTop: '1.25rem' }}>
          <StyledDisplayText>
            You understand that as a human-centered business, Shape expects you
            to behave ethically to other users and people who respond to your
            surveys anonymously, and in accordance with the Terms of Use and
            applicable law. You also understand that IDEO does not have any
            control over the contents of your surveys which are intended to be
            anonymous, but requires the following house rules:
          </StyledDisplayText>
        </div>
        <div>
          <ul style={{ marginLeft: '1rem' }}>
            <StyledListItem>
              <StyledDisplayText>
                1. You agree not to ask for personally identifiable or sensitive
                information from users including their name or image.{' '}
              </StyledDisplayText>
            </StyledListItem>
            <StyledListItem>
              <StyledDisplayText>
                2. You agree that Shape is not responsible for the contents of
                the survey, and that these are your/your organization’s
                responsibility.
              </StyledDisplayText>
            </StyledListItem>
            <StyledListItem>
              <StyledDisplayText>
                3. You agree not to include offensive or discriminatory language
                or intent in the surveys or include content or style likely to
                affect Shape’s reputation as an ethical business.
              </StyledDisplayText>
            </StyledListItem>
            <StyledListItem>
              <StyledDisplayText>
                4. You agree that Shape may remove, modify, terminate your
                access to surveys or the Platform if you breach the above rules,
                in addition to its rights under the Terms of Use.
              </StyledDisplayText>
            </StyledListItem>
          </ul>
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: '12px',
            marginBottom: '22px',
          }}
        >
          <StyledDisplayText>
            You can find the full terms of use for Shape at{' '}
            <Link to="/terms" target="_blank">
              shape.space/terms
            </Link>
            .
          </StyledDisplayText>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <Button minWidth={300}>I agree to these terms</Button>
        </div>
      </form>
    </DialogContent>
  </StyledDialog>
)

FeedbackTermsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default FeedbackTermsModal
