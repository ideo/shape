import _ from 'lodash'
import styled, { ThemeProvider } from 'styled-components'
import { observable, runInAction } from 'mobx'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import v from '~/utils/variables'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import Logo from '~/ui/layout/Logo'
import { apiStore } from '~/stores'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import ClosedSurvey from '~/ui/test_collections/ClosedSurvey'
import RespondentBanner from '~/ui/test_collections/RespondentBanner'
import GreetingMessage from '~/ui/test_collections/GreetingMessage'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import ProgressDots from '~/ui/global/ProgressDots'
import ProgressSquare from '~/ui/global/ProgressSquare'
import FlipMove from 'react-flip-move'
import { Element as ScrollElement, scroller } from 'react-scroll'
import { Flex } from 'reflexbox'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import WelcomeQuestion from '../test_collections/WelcomeQuestion'
import TermsQuestion from '../test_collections/TermsQuestion'

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

const UNANSWERABLE_QUESTION_TYPES = [
  'question_media',
  'question_description',
  'question_finish',
  'question_opt_in',
]

const NON_TEST_QUESTIONS = [
  'question_recontact',
  'question_terms',
  'question_welcome',
]

@observer
class TestSurveyPage extends React.Component {
  @observable
  surveyResponse = null
  @observable
  questionCards = []
  @observable
  currentCardIdx = 0
  // nonSurveyQuestions data
  @observable
  recontactAnswered = false
  @observable
  termsAnswered = false
  @observable
  welcomeAnswered = false
  @observable
  optInAnswered = false

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

  // Can't this be abstracted to SurveyResponse.js?
  // Or is this only saving the surveyResponse in MobX but not Rails?
  createSurveyResponse = async () => {
    const newResponse = new SurveyResponse(
      {
        test_collection_id: this.collection.id,
      },
      apiStore
    )
    console.log('creating survey response')
    try {
      const surveyResponse = await newResponse.save()
      if (surveyResponse) {
        this.surveyResponse = surveyResponse
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

  get includeTerms() {
    return !this.currentUser || !this.currentUser.respondent_terms_accepted
  }

  get numAnswerableQuestionItems() {
    const { question_cards } = this.collection
    return question_cards.filter(
      questionCard =>
        !_.includes(
          UNANSWERABLE_QUESTION_TYPES,
          questionCard.card_question_type
        )
    ).length
  }

  answerableCard = card =>
    UNANSWERABLE_QUESTION_TYPES.indexOf(card.card_question_type) === -1

  get answerableCards() {
    return this.questionCards.filter(card => this.answerableCard(card))
  }

  afterQuestionAnswered = (card, answer) => {
    if (['opt_in', 'welcome', 'recontact', 'terms'].includes(card.id)) {
      // handle this in the Terms question click handler
      if (!answer) {
        // If they didn't agree to the terms, send to marketing page
        // window.location.href = '/'
      }
      const questionName = `${_.camelCase(card.id)}Answered`
      console.log(questionName)
      runInAction(() => {
        this[questionName] = true
        console.log(this)
      })
    }

    setTimeout(() => {
      this.scrollToTopOfNextCard(card)
    }, 100)
  }

  // This could be an injectable service
  // If we don't end up consolidating TestSurveyPage into InlineCollectionTest
  scrollToTopOfNextCard = card => {
    const { questionCards } = this
    const containerId = null
    // const { containerId } = this.props
    // this is only used for InlineCollectionTest.js
    const index = questionCards.indexOf(card)
    const answerableIdx = this.answerableCards.indexOf(card)
    console.log(index, answerableIdx, this.currentCardIdx)
    // how to handle scrolling for non answerable cards?
    runInAction(() => {
      this.currentCardIdx = answerableIdx + 1
    })
    const nextCard = questionCards[index + 1]
    if (!nextCard) return
    scroller.scrollTo(`card-${nextCard.id}`, {
      duration: 400,
      smooth: true,
      // will default to document if none set (e.g. for standalone page)
      containerId,
      // when inside ActivityLog we want to account for the header at the top
      offset: containerId ? -75 : 0,
    })
  }

  renderSurveyQuestion({ card, children }) {
    // ScrollElement only gets the right offsetTop if outside the FlipMove
    return (
      <ScrollElement name={`card-${card.id}`} key={card.id}>
        <FlipMove appearAnimation="fade">
          <div>
            <Flex style={{ width: 'auto', flexWrap: 'wrap' }}>
              <TestQuestionHolder editing={false} userEditable={false}>
                {children}
              </TestQuestionHolder>
            </Flex>
          </div>
        </FlipMove>
      </ScrollElement>
    )
  }

  get renderSurvey() {
    const { collection, createSurveyResponse } = this
    const { surveyResponse } = this
    if (!collection) return null

    return (
      <StyledSurvey data-cy="StandaloneTestSurvey">
        <GreetingMessage />
        <ThemeProvider theme={styledTestTheme('primary')}>
          <div id="surveyContainer">
            <ProgressDots
              totalAmount={this.answerableCards.length + 1}
              currentProgress={this.currentCardIdx}
            />
            <ProgressSquare
              totalAmount={this.answerableCards.length + 1}
              currentProgress={this.currentCardIdx}
            />
            {this.renderSurveyQuestion({
              card: { id: 'welcome' },
              children: (
                <WelcomeQuestion
                  givesIncentive={collection.gives_incentive}
                  numberOfQuestions={this.numAnswerableQuestionItems}
                  onAnswer={this.afterQuestionAnswered}
                />
              ),
            })}
            {this.welcomeAnswered &&
              this.renderSurveyQuestion({
                card: { id: 'terms' },
                children: (
                  <TermsQuestion
                    user={apiStore.currentUser}
                    onAnswer={this.afterQuestionAnswered}
                  />
                ),
              })}
            {this.welcomeAnswered &&
              this.termsAnswered &&
              this.questionCards.map(card =>
                this.renderSurveyQuestion({
                  card,
                  children: (
                    <TestQuestion
                      // Why is this being created inside the test question?
                      // Why is the survey response not created on page load?
                      createSurveyResponse={createSurveyResponse}
                      surveyResponse={surveyResponse}
                      questionAnswer={this.questionAnswerForCard(card)}
                      afterQuestionAnswered={this.afterQuestionAnswered}
                      parent={collection}
                      card={card}
                      item={card.record}
                      order={card.order}
                      editing={false}
                      canEdit={this.canEdit}
                      numberOfQuestions={this.numAnswerableQuestionItems}
                    />
                  ),
                })
              )}
          </div>
        </ThemeProvider>
      </StyledSurvey>
    )
  }

  get sessionUid() {
    const { surveyResponse } = this

    surveyResponse ? surveyResponse.session_uid : null
  }

  render() {
    return (
      <React.Fragment>
        {this.currentUser ? <RespondentBanner user={this.currentUser} /> : null}
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
