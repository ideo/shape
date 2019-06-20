import styled from 'styled-components'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import v from '~/utils/variables'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'

import ClosedSurvey from '~/ui/test_collections/ClosedSurvey'
import RespondentBanner from '~/ui/test_collections/RespondentBanner'

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
    if (!apiStore.currentUser) return
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

  get includeTerms() {
    return !this.currentUser || !this.currentUser.respondent_terms_accepted
  }

  get renderSurvey() {
    const { collection } = this
    if (!collection) return null

    return (
      <StyledSurvey data-cy="StandaloneTestSurvey">
        <TestSurveyResponder
          collection={collection}
          editing={false}
          includeRecontactQuestion={this.includeRecontactQuestion}
          includeTerms={this.includeTerms}
        />
      </StyledSurvey>
    )
  }

  render() {
    return (
      <React.Fragment>
        <StyledBg>
          {this.currentUser ? (
            <RespondentBanner user={this.currentUser} />
          ) : null}
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
              collection={this.collection}
            />
          )}
        </StyledBg>
      </React.Fragment>
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
