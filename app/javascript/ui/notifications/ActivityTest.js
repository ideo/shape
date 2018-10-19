import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { ActivityContainer } from '~/ui/global/styled/layout'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'

@inject('apiStore', 'uiStore')
@observer
class ActivityTest extends React.Component {
  state = {
    surveyResponse: null,
    testCollection: null,
  }

  async componentDidMount() {
    const res = await this.fetchTestCollection()
    const testCollection = res.data
    const surveyResponse = testCollection.current_user_survey_response
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
    const { surveyResponse, testCollection } = this.state
    let inner
    if (!testCollection) return null
    if (testCollection.test_status === 'live') {
      inner = (
        <TestSurveyResponder
          collection={testCollection}
          surveyResponse={surveyResponse}
          createSurveyResponse={createSurveyResponse}
          editing={false}
        />
      )
    } else {
      inner = <span>next one </span>
    }
    return (
      <ActivityContainer moving={uiStore.activityLogMoving}>
        {inner}
      </ActivityContainer>
    )
  }
}

ActivityTest.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ActivityTest
