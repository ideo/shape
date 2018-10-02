import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores/jsonApi/SurveyResponse')

let wrapper, props, component
describe('TestSurveyResponder', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.collection_cards[0].card_question_type = 'question_useful'
    wrapper = shallow(<TestSurveyResponder {...props} />)
    component = wrapper.instance()
  })

  it('renders TestQuestions for each card', () => {
    expect(wrapper.find('TestQuestion').length).toEqual(
      fakeCollection.collection_cards.length
    )
  })

  describe('createSurveyResponse', () => {
    it('creates a new response', () => {
      component.createSurveyResponse()
      expect(SurveyResponse).toHaveBeenCalledTimes(1)
    })
  })
})
