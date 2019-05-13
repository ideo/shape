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
    padding: 20px;
    padding-top: 35px;
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

const StyledDialogContent = styled(DialogContent)`
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding-bottom: 120px !important;
  }
`

const StyledDisplayText = styled(DisplayText)`
  font-size: 0.75rem;
`

const StyledModalCloseButton = styled(ModalCloseButton)`
  top: 35px;
`

const FeedbackTermsModal = ({ onSubmit, open, handleClose }) => (
  <StyledDialog
    classes={{ root: 'root__dialog', paper: 'modal__paper' }}
    open={open}
    BackdropProps={{
      invisible: true,
    }}
  >
    <StyledModalCloseButton onClick={handleClose}>
      <CloseIcon />
    </StyledModalCloseButton>
    <DialogContent>
      <form onSubmit={onSubmit}>
        <PaperAirplane />
        <SpecialDisplayHeading wrapLine>
          Before you launch your first test, please review and agree to the
          terms below.
        </SpecialDisplayHeading>
        <StyledDiv>
          <StyledDisplayText>
            You understand that as a human-centered business, Shape expects you
            to behave ethically to other users and people who respond to your
            surveys anonymously, and in accordance with the Terms of Use and
            applicable law. You also understand that IDEO does not have any
            control over the contents of your surveys which are intended to be
            anonymous, but requires the following house rules:
          </StyledDisplayText>
        </StyledDiv>
        <StyledDiv>
          <List>
            <ListItem>
              <StyledDisplayText>
                1. You agree not to ask for personally identifiable or sensitive
                information from users including their name or image.{' '}
              </StyledDisplayText>
            </ListItem>
            <ListItem>
              <StyledDisplayText>
                2. You agree that Shape is not responsible for the contents of
                the survey, and that these are your/your organization’s
                responsibility.
              </StyledDisplayText>
            </ListItem>
            <ListItem>
              <StyledDisplayText>
                3. You agree not to include offensive or discriminatory language
                or intent in the surveys or include content or style likely to
                affect Shape’s reputation as an ethical business.
              </StyledDisplayText>
            </ListItem>
            <ListItem>
              <StyledDisplayText>
                4. You agree that Shape may remove, modify, terminate your
                access to surveys or the Platform if you breach the above rules,
                in addition to its rights under the Terms of Use.
              </StyledDisplayText>
            </ListItem>
          </List>
        </StyledDiv>
        <StyledDiv>
          <StyledDisplayText>
            You can find the full terms of use for Shape at{' '}
            <Link to="/terms" target="_blank">
              shape.space/terms
            </Link>
            .
          </StyledDisplayText>
        </StyledDiv>
        <StyledDiv style={{ textAlign: 'center' }}>
          <FormButton width={300}>I agree to these terms</FormButton>
        </StyledDiv>
      </form>
    </DialogContent>
  </StyledDialog>
)

const StyledDiv = styled.div`
  margin: 1.5rem 0;
`

FeedbackTermsModal.propTypes = {
  children: PropTypes.node.isRequired,
  close: PropTypes.func.isRequired,
}

export default FeedbackTermsModal
