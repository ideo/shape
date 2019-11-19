import CustomizableQuestion from '~/ui/test_collections/CustomizableQuestion'
import {
  fakeQuestionItem,
  fakeQuestionAnswer,
  fakeQuestionChoice,
  fakeQuestionSecondChoice,
} from '#/mocks/data'

let wrapper, props
describe('CustomizableQuestion', () => {
  describe('when editing single choice question', () => {
    beforeEach(() => {
      props = {
        question: fakeQuestionItem,
        questionAnswer: fakeQuestionAnswer,
        question_choices: [fakeQuestionChoice, fakeQuestionSecondChoice],
        editing: true,
        onAnswer: jest.fn(),
        handleAnswerSelection: jest.fn(),
        isTestDraft: true,
      }

      props.question.isSingleChoiceQuestion = true

      wrapper = mount(<CustomizableQuestion {...props} />)
    })

    it('renders', () => {
      expect(wrapper.find('Question').exists()).toBe(true)
      expect(wrapper.find('Question').get(0).props.editing).toEqual(true)

      expect(wrapper.find('TextInput').exists()).toBe(true)
      expect(wrapper.find('TextInput').get(0).props.value).toEqual('')

      expect(wrapper.find('CustomizableQuestionChoice').exists()).toBe(true)
      expect(
        wrapper.find('CustomizableQuestionChoice').get(0).props.choice.text
      ).toEqual(fakeQuestionChoice.text)

      expect(wrapper.find('StyledRadio').exists()).toBe(true)
    })

    it('updates state when edited', () => {
      expect(wrapper.state('questionContent')).toEqual('')

      const questionText = 'Who watches the watchmen?'

      wrapper
        .find('TextInput')
        .at(0) // https://github.com/airbnb/enzyme/issues/907#issuecomment-349794615
        .simulate('change', {
          target: { value: questionText },
        })

      expect(wrapper.state('questionContent')).toEqual(questionText)
    })

    it('removes an option when a choice is deleted', () => {
      expect(wrapper.find('[data-cy="TrashIconHolder"]').exists()).toBe(true)
      wrapper
        .find('[data-cy="TrashIconHolder"]')
        .at(0)
        .simulate('click')
      expect(
        wrapper.props().question.API_destroyQuestionChoice
      ).toHaveBeenCalled()
    })
  })

  describe('when not editing single choice question', () => {
    beforeEach(() => {
      props = {
        question: fakeQuestionItem,
        questionAnswer: fakeQuestionAnswer,
        question_choices: [fakeQuestionChoice, fakeQuestionSecondChoice],
        editing: false,
        onAnswer: jest.fn(),
        handleAnswerSelection: jest.fn(),
      }

      props.question.isSingleChoiceQuestion = true

      wrapper = mount(<CustomizableQuestion {...props} />)
    })

    it('renders', () => {
      expect(wrapper.find('Question').exists()).toBe(true)
      expect(wrapper.find('Question').get(0).props.editing).toEqual(false)

      expect(wrapper.find('TextInput').exists()).toBe(true)
      expect(wrapper.find('TextInput').get(0).props.value).toEqual('')
      // https://github.com/airbnb/enzyme/issues/336#issuecomment-526357088
      expect(
        wrapper
          .find('TextInput')
          .at(0)
          .props()['disabled']
      ).toBe(true)

      expect(wrapper.find('CustomizableQuestionChoice').exists()).toBe(true)
      expect(
        wrapper.find('CustomizableQuestionChoice').get(0).props.choice.text
      ).toEqual(fakeQuestionChoice.text)

      expect(wrapper.find('StyledRadio').exists()).toBe(true)
    })

    it('updates selected choice when selected', () => {
      const choice = wrapper.find('CustomizableQuestionChoice').at(0)
      const radioInput = choice.find('StyledRadio').find('input')
      radioInput.simulate('change', { checked: true })

      const fakeEvent = {
        preventDefault: jest.fn(),
      }
      wrapper.instance().handleAnswerSelection(fakeQuestionChoice)(fakeEvent)
      wrapper.update()

      expect(wrapper.state('selected_choice_ids')).toEqual([1])
    })
  })

  describe('when editing multiple choice question', () => {
    beforeEach(() => {
      props = {
        question: fakeQuestionItem,
        questionAnswer: fakeQuestionAnswer,
        question_choices: [fakeQuestionChoice, fakeQuestionSecondChoice],
        editing: true,
        onAnswer: jest.fn(),
        handleAnswerSelection: jest.fn(),
      }

      props.question.isSingleChoiceQuestion = false

      wrapper = mount(<CustomizableQuestion {...props} />)
    })

    it('renders', () => {
      expect(wrapper.find('StyledCheckbox').exists()).toBe(true)
    })
  })

  describe('when not editing multiple choice question', () => {
    beforeEach(() => {
      props = {
        question: fakeQuestionItem,
        questionAnswer: fakeQuestionAnswer,
        question_choices: [fakeQuestionChoice, fakeQuestionSecondChoice],
        editing: false,
        onAnswer: jest.fn(),
        handleAnswerSelection: jest.fn(),
      }

      props.question.isSingleChoiceQuestion = false

      wrapper = mount(<CustomizableQuestion {...props} />)
    })

    it('renders', () => {
      expect(wrapper.find('StyledCheckbox').exists()).toBe(true)
    })

    it('updates selected choice', () => {
      const choice = wrapper.find('CustomizableQuestionChoice').at(0)
      const firstCheckbox = choice
        .find('StyledCheckbox')
        .at(0)
        .find('input')
      const secondCheckbox = choice
        .find('StyledCheckbox')
        .at(0)
        .find('input')
      firstCheckbox.simulate('change', { checked: true })
      secondCheckbox.simulate('change', { checked: true })

      const fakeEvent = {
        preventDefault: jest.fn(),
      }
      wrapper.instance().handleAnswerSelection(fakeQuestionChoice)(fakeEvent)
      wrapper.instance().handleAnswerSelection(fakeQuestionSecondChoice)(
        fakeEvent
      )
      wrapper.update()

      expect(wrapper.state('selected_choice_ids')).toEqual([1, 2])
    })
  })
})
