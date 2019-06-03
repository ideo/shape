import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import {
  fakeCollection,
  fakeSurveyResponse,
  fakeQuestionAnswer,
} from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

jest.mock('../../../app/javascript/stores/jsonApi/SurveyResponse')

let wrapper, props, rerender, apiStore
const cardTypes = ['question_media', 'question_useful']

describe('TestSurveyResponder', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    apiStore.currentUser = null
    // setup the appropriate card type
    props = {
      collection: fakeCollection,
      createSurveyResponse: jest.fn(),
      apiStore,
      user: apiStore.currentUser,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.question_cards = []
    cardTypes.forEach((type, i) => {
      props.collection.question_cards.push({
        id: `${i}`,
        card_question_type: type,
        record: {
          id: `${i}`,
          disableMenu: jest.fn(),
        },
      })
    })
    rerender = () => {
      wrapper = shallow(<TestSurveyResponder.wrappedComponent {...props} />)
    }
    rerender()
  })

  describe('if the terms have not been accepted yet', () => {
    beforeEach(() => {
      props.includeTerms = true
      rerender()
    })

    it('renders the terms question', () => {
      expect(
        wrapper.find('TestQuestion').props().card.card_question_type
      ).toEqual('question_terms')
    })
  })

  describe('if the terms have been accepted', () => {
    beforeEach(() => {
      props.includeTerms = false
      rerender()
    })

    it('renders TestQuestions for each visible card', () => {
      expect(wrapper.find('TestQuestion').length).toEqual(2)
    })
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
      expect(wrapper.find('TestQuestion').length).toEqual(2)
    })
  })
})
