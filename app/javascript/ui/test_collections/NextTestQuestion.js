import PropTypes from 'prop-types'
import styled from 'styled-components'

import { uiStore, routingStore } from '~/stores'
import Tooltip from '~/ui/global/Tooltip'
import Emoji from '~/ui/icons/Emoji'
import { QuestionText } from './shared'

const FinishedEmojiHolder = styled.div`
  padding: 8px 0;
  text-align: center;
  display: flex;
  justify-content: space-around;
  margin: 0 auto;
  width: 200px;
`

const NextTestQuestion = ({ path }) => {
  const isStandalone = path.indexOf('/tests/') === 0
  const goToNextTest = () => {
    if (isStandalone) {
      window.location = path
    } else {
      routingStore.routeTo(path)
    }
  }

  return (
    <div>
      <QuestionText>
        Thanks! You&apos;ve reached the end of this feedback request. Go to the
        next idea?
      </QuestionText>
      <FinishedEmojiHolder>
        <Tooltip classes={{ tooltip: 'Tooltip' }} title="Stop giving feedback">
          <button onClick={() => uiStore.update('activityLogOpen', false)}>
            <Emoji scale={1.25} name="Stop giving feedback" symbol="✋" />
          </button>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Continue giving feedback"
        >
          <button onClick={goToNextTest}>
            <Emoji scale={1.25} name="Continue giving feedback" symbol="👉" />
          </button>
        </Tooltip>
      </FinishedEmojiHolder>
    </div>
  )
}

NextTestQuestion.propTypes = {
  path: PropTypes.string.isRequired,
}

export default NextTestQuestion
