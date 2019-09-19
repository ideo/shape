import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { ThemeProvider } from 'styled-components'

import { ActivityContainer } from '~/ui/global/styled/layout'
import Emoji from '~/ui/icons/Emoji'
import {
  EmojiMessageContainer,
  SurveyClosed,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import { DisplayText } from '~/ui/global/styled/typography'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import Tooltip from '~/ui/global/Tooltip'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import { threadTitleCss } from '~/ui/threads/CommentThread'

const StyledTestHeader = styled.div`
  ${threadTitleCss};
  position: sticky;
`

@inject('apiStore', 'uiStore')
@observer
class InlineCollectionTest extends React.Component {
  @observable
  testCollection = null

  componentDidMount() {
    if (!this.hasLiveTestCollection) {
      return
    }
    this.fetchTestCollection()
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  get collection() {
    return this.props.uiStore.viewingCollection
  }

  get hasLiveTestCollection() {
    return !!this.collection.live_test_collection
  }

  async fetchTestCollection() {
    const { apiStore } = this.props
    const res = await apiStore.request(
      `test_collections/${this.collection.live_test_collection.id}`
    )
    const testCollection = res.data
    runInAction(() => {
      this.testCollection = testCollection
    })
    // for submission tests, want to know if any other tests can be taken next
    if (testCollection.is_submission_test) {
      // don't need to `await` this, can happen async
      // this will also set nextAvailableTestPath on the testCollection
      testCollection.API_getNextAvailableTest()
    }
  }

  get containerId() {
    return 'InlineTestContainer'
  }

  renderInner() {
    const { collection, testCollection } = this
    if (!collection) return null
    if (!this.hasLiveTestCollection) {
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
          <ThemeProvider theme={styledTestTheme('secondary')}>
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
          </ThemeProvider>
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
            // for scrolling purposes
            containerId={this.containerId}
            inline
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
        id={this.containerId}
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
