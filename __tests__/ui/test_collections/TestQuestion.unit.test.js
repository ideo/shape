import TestQuestion from '~/ui/test_collections/TestQuestion'
import { fakeCollection, fakeItemCard, fakeQuestionItem } from '#/mocks/data'

let wrapper, props
const rerender = () => {
  wrapper = shallow(<TestQuestion.wrappedComponent {...props} />)
}
describe('TestQuestion', () => {
  beforeEach(() => {
    props = {
      parent: fakeCollection,
      card: fakeItemCard,
      editing: true,
      numberOfQuestions: 4,
      apiStore: {},
    }
    props.card.record = fakeQuestionItem
  })

  describe('with "useful" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'question_useful'
      rerender()
    })

    it('renders ScaleQuestion', () => {
      expect(wrapper.find('ScaleQuestion').exists()).toBeTruthy()
    })
  })

  describe('with "idea" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'question_idea'
      rerender()
    })

    it('renders IdeaQuestion', () => {
      expect(wrapper.find('IdeaQuestion').exists()).toBeTruthy()
    })
  })

  describe('with "description" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'question_description'
      rerender()
    })

    it('renders QuestionContentEditor', () => {
      expect(wrapper.find('QuestionContentEditor').props().item).toEqual(
        props.card.record
      )
    })
  })

  describe('with "question_finish" type', () => {
    beforeEach(() => {
      props.parent.gives_incentive = true
      props.card.card_question_type = 'question_finish'
      rerender()
    })

    it('renders QuestionContentEditor', () => {
      const finishQuestion = wrapper.find('FinishQuestion')
      expect(finishQuestion.props().givesIncentive).toEqual(
        props.parent.gives_incentive
      )
    })
  })
})
