import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { ActivityContainer } from '~/ui/global/styled/layout'
import Emoji from '~/ui/icons/Emoji'
import {
  EmojiMessageContainer,
  SurveyClosed,
} from '~/ui/test_collections/shared'
import { DisplayText } from '~/ui/global/styled/typography'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import Tooltip from '~/ui/global/Tooltip'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import { threadTitleCss } from '~/ui/threads/CommentThread'
import { observable } from 'mobx'

const StyledTestHeader = styled.div`
  ${threadTitleCss};
  position: sticky;
`

@inject('apiStore', 'uiStore')
@observer
class InlineCollectionTest extends React.Component {
  // I'm hung up on this
  // Not sure how it works, much less what I'm breaking
  async componentDidMount() {
    if (!this.testCollection) {
      return
    }
    const res = await this.fetchTestCollection()
    const testCollection = res.data
    // for submission tests, want to know if any other tests can be taken next
    if (testCollection.is_submission_test) {
      // don't need to `await` this, can happen async
      // this will also set nextAvailableTestPath on the testCollection
      testCollection.API_getNextAvailableTest()
    }
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  get collection() {
    const { collection } = this

    return collection.live_test_collection
      ? collection.live_test_collection
      : collection
  }

  get testCollection() {
    if (!this.collection) return null
    return this.collection.live_test_collection
  }

  fetchTestCollection() {
    const { apiStore } = this.props
    return apiStore.request(
      `test_collections/${this.collection.live_test_collection.id}`
    )
  }

  renderInner() {
    const { collection, testCollection } = this
    if (!collection) return null
    if (!testCollection) {
      return (
        <div>
          {/*
            NOTE: loading the test collection here would require some workarounds
            because it is no longer the "live" test collection.
            So as a fallback, the header here just displays the actual collection being tested
          */}
          <StyledTestHeader>
            <CommentThreadHeader record={collection} />
          </StyledTestHeader>
          <SurveyClosed>
            <DisplayText>Thank you for stopping by!</DisplayText>
            <br />
            <br />
            <DisplayText>
              Feedback on {collection.name} is finished.
            </DisplayText>
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title="Feedback finished"
              placement="bottom"
            >
              <EmojiMessageContainer>
                <Emoji name="Timer clock" symbol="⏲️" />
              </EmojiMessageContainer>
            </Tooltip>
          </SurveyClosed>
        </div>
      )
    }
    if (
      testCollection &&
      testCollection.test_status === 'live' &&
      testCollection.question_cards
    ) {
      return (
        <div>
          {testCollection && (
            <StyledTestHeader>
              <CommentThreadHeader record={testCollection} />
            </StyledTestHeader>
          )}
          <TestSurveyResponder
            collection={testCollection}
            editing={false}
            theme="secondary"
            // for scrolling purposes
            containerId="InlineTestContainer"
          />
        </div>
      )
    }
    return null
  }

  render() {
    const { uiStore } = this.props
    return (
      <ActivityContainer
        id="InlineTestContainer"
        data-cy="ActivityLogSurveyResponder"
        moving={uiStore.activityLogMoving}
      >
        {this.renderInner()}
      </ActivityContainer>
    )
  }
}

InlineCollectionTest.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default InlineCollectionTest
