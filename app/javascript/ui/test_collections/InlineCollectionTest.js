import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { ThemeProvider } from 'styled-components'

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

@inject('apiStore', 'uiStore')
@observer
class InlineCollectionTest extends React.Component {
  @observable
  testCollection = null

  componentDidMount() {
    this.fetchTestCollection()
  }

  componentDidUpdate(prevProps) {
    const { testCollectionId } = this.props
    if (testCollectionId && testCollectionId !== prevProps.testCollectionId) {
      runInAction(() => {
        this.fetchTestCollection()
      })
    }
  }

  async fetchTestCollection() {
    const { testCollectionId, apiStore } = this.props
    if (!testCollectionId) {
      return
    }

    const res = await apiStore.request(`test_collections/${testCollectionId}`)
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
    const { testCollectionId, uiStore } = this.props
    const { viewingCollection } = uiStore
    const { testCollection } = this

    if (!viewingCollection || !viewingCollection.fullyLoaded) {
      return null
    }
    if (!testCollectionId) {
      return (
        <div>
          {/*
            NOTE: loading the test collection here would require some workarounds
            because it is no longer the "live" test collection.
            So as a fallback, the header here just displays the actual collection being tested
          */}
          <CommentThreadHeader record={viewingCollection} sticky />
          <ThemeProvider theme={styledTestTheme('secondary')}>
            <SurveyClosed>
              <DisplayText color="white">
                Thank you for stopping by!
              </DisplayText>
              <br />
              <br />
              <DisplayText color="white">
                Feedback on {viewingCollection.name} is finished.
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
    } else if (
      testCollection &&
      testCollection.test_status === 'live' &&
      testCollection.question_cards
    ) {
      return (
        <div>
          {testCollection && (
            <CommentThreadHeader record={testCollection} sticky />
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

InlineCollectionTest.propTypes = {
  testCollectionId: PropTypes.string,
}
InlineCollectionTest.defaultProps = {
  testCollectionId: null,
}

InlineCollectionTest.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default InlineCollectionTest
