import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import { fakeCollection, fakeItemCard, fakeQuestionAnswer } from '#/mocks/data'

jest.mock('../../../app/javascript/stores/jsonApi/SurveyResponse')

let wrapper, props, component
const cardTypes = [
  'question_media',
  'question_context',
  'question_useful',
  'question_open',
  'question_finish',
]

describe('TestSurveyResponder', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.collection_cards = []
    cardTypes.forEach((type, i) => {
      props.collection.collection_cards.push(
        Object.assign({}, fakeItemCard, { card_question_type: type })
      )
    })
    wrapper = shallow(<TestSurveyResponder {...props} />)
    component = wrapper.instance()
  })

  it('renders TestQuestions for each visible card', () => {
    // Should render media and context question
    expect(wrapper.find('TestQuestion').length).toEqual(2)
  })

  describe('after answering a question', () => {
    beforeEach(() => {
      const mockQuestionAnswerForCard = jest.fn()
      mockQuestionAnswerForCard.mockReturnValue(fakeQuestionAnswer)
      // This is kind of dirty to mock internals,
      // but no easy way to simulate creating a response and saving answers
      component.questionAnswerForCard = mockQuestionAnswerForCard
      // Hack to get it to use the mock after shallow mount
      // wrapper.update() or wrapper.instance().forceUpdate() did not work
      // Issue: https://github.com/airbnb/enzyme/issues/1245
      wrapper.setState({})
    })

    it('renders additional question', () => {
      expect(wrapper.find('TestQuestion').length).toEqual(
        props.collection.collection_cards.length
      )
    })
  })

  describe('createSurveyResponse', () => {
    it('creates a new response', () => {
      component.createSurveyResponse()
      expect(SurveyResponse).toHaveBeenCalledTimes(1)
    })
  })
})
