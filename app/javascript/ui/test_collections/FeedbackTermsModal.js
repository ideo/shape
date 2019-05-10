import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Modal from '~/ui/global/modals/Modal'
// Need to replace with actual asset => how to add to AWS?
import PaperAirplane from '~/ui/test_collections/PaperAirplane'
import { FormButton } from '~/ui/global/styled/forms'
import { Heading1, DisplayText } from '~/ui/global/styled/typography'
import { List, ListItem } from '~/ui/global/styled/lists'
import Link from '~/ui/global/Link'
import { colors } from '~shared/styles/index'

const FeedbackTermsModal = ({ children, close }) => (
  <Modal title="Feedback Terms and Conditions" open onClose={close}>
    <PaperAirplane />
    <Heading1 wrapLine>
      Before you launch your first test, please review and agree to the terms
      below.
    </Heading1>
    <StyledDiv>
      <DisplayText>
        You understand that as a human-centered business, Shape expects you to
        behave ethically to other users and people who respond to your surveys
        anonymously, and in accordance with the Terms of Use and applicable law.
        You also understand that IDEO does not have any control over the
        contents of your surveys which are intended to be anonymous, but
        requires the following house rules:
      </DisplayText>
    </StyledDiv>
    <StyledDiv>
      <List>
        <ListItem>
          <DisplayText>
            1. You agree not to ask for personally identifiable or sensitive
            information from users including their name or image.{' '}
          </DisplayText>
        </ListItem>
        <ListItem>
          <DisplayText>
            2. You agree that Shape is not responsible for the contents of the
            survey, and that these are your/your organization’s responsibility.
          </DisplayText>
        </ListItem>
        <ListItem>
          <DisplayText>
            3. You agree not to include offensive or discriminatory language or
            intent in the surveys or include content or style likely to affect
            Shape’s reputation as an ethical business.
          </DisplayText>
        </ListItem>
        <ListItem>
          <DisplayText>
            4. You agree that Shape may remove, modify, terminate your access to
            surveys or the Platform if you breach the above rules, in addition
            to its rights under the Terms of Use.
          </DisplayText>
        </ListItem>
      </List>
    </StyledDiv>
    <StyledDiv>
      <DisplayText>
        You can find the full terms of use for Shape at{' '}
        <Link to="/terms" target="_blank">
          shape.space/terms
        </Link>
        .
      </DisplayText>
    </StyledDiv>
    <StyledDiv style={{ textAlign: 'center' }}>
      <FormButton width={300}>I agree to these terms</FormButton>
    </StyledDiv>
  </Modal>
)

const StyledDiv = styled.div`
  margin: 1.5rem 0;
`

FeedbackTermsModal.propTypes = {
  children: PropTypes.node.isRequired,
  close: PropTypes.func.isRequired,
}

export default FeedbackTermsModal
