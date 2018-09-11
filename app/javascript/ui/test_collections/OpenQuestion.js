import PropTypes from 'prop-types'
import TextareaAutosize from 'react-autosize-textarea'
import styled from 'styled-components'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

// TODO reused in ScaleQuestion
const Question = styled.div`
  background-color: #5698AE;
  color: white;
  padding: 12px 12px 16px 12px;
  width: 310px;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    width: calc(100% - 23px);
  }
`

const TextInputHolder = StyledCommentTextarea.extend`
  width: 95%;
`

const TextInput = styled(TextareaAutosize)`
  color: #5698AE;
  font-family: ${v.fonts.sans} !important;
  width: 282px;
`

const TextEnterButton = styled.button`
  color: #5698AE;
  vertical-align: super;
  width: 15px;
`

class OpenQuestion extends React.Component {
  answer = (name) => (ev) => {
  }

  render() {
    const { questionText } = this.props
    return (
      <div>
        <Question>
          <DisplayText>
            { questionText }
          </DisplayText>
        </Question>
        <div>
          <TextInputHolder>
            <TextInput placeholder="Write response here" />
            <TextEnterButton>
              <ReturnArrowIcon />
            </TextEnterButton>
          </TextInputHolder>
        </div>
      </div>
    )
  }
}

OpenQuestion.propTypes = {
  questionText: PropTypes.string.isRequired,
}
export default OpenQuestion
