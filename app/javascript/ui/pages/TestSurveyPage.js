import styled from 'styled-components'
import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import v from '~/utils/variables'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'

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
  @observable
  loadedCurrentUser = false

  constructor(props) {
    super(props)
    this.collection = apiStore.sync(window.collectionData)

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
    runInAction(() => {
      this.loadedCurrentUser = true
    })
  }

  get currentUser() {
    return apiStore.currentUser
  }

  get renderSurvey() {
    const { collection } = this
    if (!collection) return null

    return (
      <StyledSurvey data-cy="StandaloneTestSurvey">
        <TestSurveyResponder collection={collection} editing={false} />
      </StyledSurvey>
    )
  }

  render() {
    if (!this.loadedCurrentUser) return ''
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

          <StyledSurvey data-cy="StandaloneTestSurvey">
            <TestSurveyResponder collection={this.collection} editing={false} />
          </StyledSurvey>
        </StyledBg>
      </React.Fragment>
    )
  }
}

export default TestSurveyPage
