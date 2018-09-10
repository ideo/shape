import TextareaAutosize from 'react-autosize-textarea'
import styled from 'styled-components'

import { SmallHelperText } from '~/ui/global/styled/typography'
import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

const TextInputHolder = StyledCommentTextarea.extend`
  background-color: #9FC1CB;
  color: white;
  padding-bottom: 6px;
  width: 334px;
`

const TextInput = styled(TextareaAutosize)`
  background-color: #9FC1CB;
  color: white !important;
  font-family: ${v.fonts.sans} !important;
  min-height: 105px;
  width: 100%;

  ::placeholder {
    color: white !important;
    opacity: 1;
  }
}
`

const StyledSmallText = SmallHelperText.extend`
  color: #5698AE;
  margin-left: calc(100% - 35px);
`

const MAX_LEN = 500

class DescriptionQuestion extends React.Component {
  state = { countLeft: MAX_LEN }

  handleChange = (ev) => {
    const len = ev.target.value.length
    this.setState({ countLeft: MAX_LEN - len })
  }

  render() {
    return (
      <div>
        <TextInputHolder>
          <TextInput
            onChange={this.handleChange}
            placeholder="Write Idea Description Here…"
          />
          <StyledSmallText>{ this.state.countLeft }</StyledSmallText>
        </TextInputHolder>
      </div>
    )
  }
}

export default DescriptionQuestion
