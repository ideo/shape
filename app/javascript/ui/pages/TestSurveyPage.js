import styled from 'styled-components'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import v from '~/utils/variables'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import ClosedSurvey from '~/ui/test_collections/ClosedSurvey'

const StyledBg = styled.div`
  background: #e3edee;
  padding-top: 36px;
  padding-bottom: 70px;
  min-height: 100vh;
`

const LogoWrapper = styled.div`
  width: 83px;
  margin: 0 auto 24px;
`

const StyledSurvey = styled.div`
  background-color: ${v.colors.primaryMedium};
  border-radius: 7px;
  border: 10px solid ${v.colors.primaryMedium};
  box-sizing: border-box;
  width: 100%;
  margin: 0 auto;
  max-width: 580px; /* responsive but constrain media QuestionCards to 420px tall */
`

@observer
class TestSurveyPage extends React.Component {
  state = {
    surveyResponse: null,
  }

  constructor(props) {
    super(props)
    this.collection = props.collection || apiStore.sync(window.collectionData)
    if (window.nextAvailableId) {
      this.collection.setNextAvailableTestPath(
        `/tests/${window.nextAvailableId}`
      )
    }
    apiStore.filestackToken = window.filestackToken
    if (window.invalid) {
      this.collection.test_status = 'closed'
    }
  }

  async componentDidMount() {
    await apiStore.loadCurrentUser()
  }

  createSurveyResponse = async () => {
    const newResponse = new SurveyResponse(
      {
        test_collection_id: this.collection.id,
      },
      apiStore
    )
    try {
      const surveyResponse = await newResponse.save()
      if (surveyResponse) {
        this.setState({ surveyResponse })
      }
      return surveyResponse
    } catch (e) {
      this.collection.test_status = 'closed'
    }
  }

  get currentUser() {
    const { currentUser } = apiStore

    return currentUser
  }

  get includeRecontactQuestion() {
    return (
      !this.collection.live_test_collection &&
      (!this.currentUser ||
        this.currentUser.feedback_contact_preference ===
          'feedback_contact_unanswered')
    )
  }

  get renderSurvey() {
    const { collection, createSurveyResponse } = this
    const { surveyResponse } = this.state
    if (!collection) return null

    return (
      <StyledSurvey data-cy="StandaloneTestSurvey">
        <TestSurveyResponder
          collection={collection}
          surveyResponse={surveyResponse}
          createSurveyResponse={createSurveyResponse}
          editing={false}
          includeRecontactQuestion={this.includeRecontactQuestion}
        />
      </StyledSurvey>
    )
  }

  get sessionUid() {
    const { surveyResponse } = this.state

    surveyResponse ? surveyResponse.session_uid : null
  }

  render() {
    return (
      <StyledBg>
        <LogoWrapper>
          <Logo withText width={83} />
        </LogoWrapper>
        <DialogWrapper />
        {this.collection.test_status === 'live' ? (
          this.renderSurvey
        ) : (
          <ClosedSurvey
            includeRecontactQuestion={this.includeRecontactQuestion}
            currentUser={this.currentUser}
            sessionUid={this.sessionUid}
          />
        )}
      </StyledBg>
    )
  }
}

TestSurveyPage.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject,
}

TestSurveyPage.defaultProps = {
  collection: undefined,
}

export default TestSurveyPage
