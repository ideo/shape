import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import {
  fakeCollection,
  fakeQuestionItemCard,
  fakeQuestionItem,
  fakeSurveyResponse,
  fakeQuestionAnswer,
} from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

jest.mock('../../../app/javascript/stores/jsonApi/SurveyResponse')

let wrapper, props, component, rerender, apiStore
const cardTypes = [
  'question_media',
  'question_context',
  'question_useful',
  'question_different',
  'question_clarity',
  'question_excitement',
  'question_open',
  'question_finish',
]

describe('TestSurveyResponder', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    apiStore.currentUser = null
    // setup the appropriate card type
    props = {
      collection: fakeCollection,
      createSurveyResponse: jest.fn(),
      apiStore,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.question_cards = []
    cardTypes.forEach((type, i) => {
      props.collection.question_cards.push({
        ...fakeQuestionItemCard,
        id: `${i}`,
        card_question_type: type,
        record: {
          ...fakeQuestionItem,
          id: `${i}`,
        },
      })
    })
    rerender = async () => {
      wrapper = shallow(<TestSurveyResponder.wrappedComponent {...props} />)
      component = wrapper.instance()
      // not quite sure why we need to explicitly do this + update() in order to get it to render...
      await component.initializeCards()
      wrapper.update()
    }
    rerender()
  })

  it('renders TestQuestions for each visible card', () => {
    // Should render media and context question
    expect(wrapper.find('TestQuestion').length).toEqual(2)
  })

  describe('after creating SurveyResponse', () => {
    beforeEach(() => {
      props = {
        ...props,
        surveyResponse: fakeSurveyResponse,
      }
      // Mock for answering the first context question
      props.surveyResponse.question_answers = [
        Object.assign({}, fakeQuestionAnswer, {
          question_id: props.collection.collection_cards[1].record.id,
        }),
      ]
      rerender()
    })

    it('renders additional question', () => {
      expect(wrapper.find('TestQuestion').length).toEqual(3)
    })
  })
})
