import TestQuestion from '~/ui/test_collections/TestQuestion'
import {
  fakeCollection,
  fakeItemCard,
  fakeQuestionItem,
  fakeSurveyResponse,
} from '#/mocks/data'

let wrapper, props, component
const rerender = () => {
  wrapper = shallow(<TestQuestion.wrappedComponent {...props} />)
  component = wrapper.instance()
}
describe('TestQuestion', () => {
  beforeEach(() => {
    props = {
      parent: fakeCollection,
      surveyResponse: fakeSurveyResponse,
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
      props.surveyResponse.potential_incentive = 1.75
      props.card.card_question_type = 'question_finish'
      rerender()
    })

    it('renders QuestionContentEditor', () => {
      const finishQuestion = wrapper.find('FinishQuestion')
      expect(finishQuestion.props().incentiveAmount).toEqual(1.75)
    })
  })

  describe('handleInstanceQuestionContentUpdate', () => {
    describe('if parent is a template', () => {
      beforeEach(() => {
        props.parent.isTemplate = true
        props.parent.API_backgroundUpdateTemplateInstances = jest.fn()
        rerender()
        component.handleInstanceQuestionContentUpdate()
      })
      it('should call API_backgroundUpdateTemplateInstances', () => {
        expect(
          props.parent.API_backgroundUpdateTemplateInstances
        ).toHaveBeenCalled()
      })
    })

    describe('if parent is a live test', () => {
      beforeEach(() => {
        props.parent.isLiveTest = true
        props.parent.API_backgroundUpdateLiveTest = jest.fn()
        rerender()
        component.handleInstanceQuestionContentUpdate()
      })
      it('should call API_backgroundUpdateLiveTest', () => {
        expect(props.parent.API_backgroundUpdateLiveTest).toHaveBeenCalled()
      })
    })
  })
})
