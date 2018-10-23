import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
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

@inject('apiStore', 'uiStore')
@observer
class ActivityTest extends React.Component {
  state = {
    surveyResponse: null,
    testCollection: null,
    noTestCollection: false,
  }

  async componentDidMount() {
    if (!this.collection.live_test_collection_id) {
      this.setState({
        noTestCollection: true,
      })
      return
    }
    const res = await this.fetchTestCollection()
    const testCollection = res.data
    const surveyResponseResult =
      testCollection.survey_response_for_user_id &&
      (await this.fetchSurveyResponse(
        testCollection.survey_response_for_user_id
      ))
    const surveyResponse = surveyResponseResult
      ? surveyResponseResult.data
      : null
    this.setState({
      surveyResponse,
      testCollection,
    })
  }

  get collection() {
    return this.props.uiStore.viewingCollection
  }

  fetchTestCollection() {
    const { apiStore } = this.props
    return apiStore.fetch(
      'test_collections',
      this.collection.live_test_collection_id
    )
  }

  fetchSurveyResponse(surveyResponseId) {
    const { apiStore } = this.props
    return apiStore.fetch('survey_responses', surveyResponseId)
  }

  createSurveyResponse = async () => {
    const { apiStore } = this.props
    const newResponse = new SurveyResponse(
      {
        test_collection_id: this.state.testCollection.id,
        user_id: apiStore.currentUserId,
      },
      apiStore
    )
    const surveyResponse = await newResponse.save()
    if (surveyResponse) {
      this.setState({ surveyResponse })
    }
    return surveyResponse
  }

  render() {
    const { uiStore } = this.props
    const { createSurveyResponse } = this
    const { noTestCollection, surveyResponse, testCollection } = this.state
    if (noTestCollection) {
      return (
        <ActivityContainer moving={uiStore.activityLogMoving}>
          <SurveyClosed>
            <DisplayText>Thank you for stopping by!</DisplayText>
            <br />
            <br />
            <DisplayText>
              Feedback on {this.collection.name} is finished.
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
        </ActivityContainer>
      )
    }
    if (!testCollection) return <div />
    if (testCollection.test_status === 'live') {
      return (
        <ActivityContainer moving={uiStore.activityLogMoving}>
          <TestSurveyResponder
            collection={testCollection}
            surveyResponse={surveyResponse}
            createSurveyResponse={createSurveyResponse}
            editing={false}
          />
        </ActivityContainer>
      )
    }
    return null
  }
}

ActivityTest.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ActivityTest
