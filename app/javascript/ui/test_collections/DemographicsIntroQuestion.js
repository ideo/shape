import styled from 'styled-components'

import { DisplayText } from '~/ui/global/styled/typography'
import Emoji from '~/ui/icons/Emoji'
import v from '~/utils/variables'

// TODO duplication
const Question = styled.div`
  border-color: ${props => props.theme.borderColor};
  border-bottom-style: solid;
  border-bottom-width: 4px;
  box-sizing: border-box;
  color: white;
  padding: 12px 12px 16px 12px;
  width: 100%;
  .editable-text {
    margin: -1px -1px -1px 5px;
    padding: 2px 3px;
    transition: background-color 250ms;
    display: inline-block;
  }
  &:hover .editable-text {
    background-color: rgba(255, 255, 255, 0.5);
  }
`
Question.displayName = 'Question'

class DemographicsIntroQuestion extends React.Component {
  render() {
    return (
      <div style={{ width: '100%' }}>
        <Question
          editing={false}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Emoji
            name="A telescope mounted on a tripod."
            symbol="🔭"
            scale={1.5}
          />
          <DisplayText color={v.colors.white}>
            Please answer a few questions to help us direct you to the next
            survey. The more you answer, the more opportunities we can find for
            you.
          </DisplayText>
        </Question>
      </div>
    )
  }
}

export default DemographicsIntroQuestion
