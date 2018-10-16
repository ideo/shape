import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import { fakeQuestionItem, fakeQuestionAnswer } from '#/mocks/data'
import v from '~/utils/variables'

let wrapper, props
const fakeEv = {
  preventDefault: jest.fn(),
}
describe('ScaleQuestion', () => {
  beforeEach(() => {
    props = {
      question: fakeQuestionItem,
      questionAnswer: null,
      editing: true,
      emojiSeries: 'usefulness',
      onAnswer: jest.fn(),
    }
    wrapper = shallow(<ScaleQuestion {...props} />)
  })

  describe('render()', () => {
    it('should render the 4 emojis from the emojiSeries', () => {
      expect(wrapper.find('Emoji').length).toEqual(4)
    })

    it('should render a tooltip for each emoji', () => {
      expect(wrapper.find('Tooltip').length).toEqual(4)
    })

    it('should not render EditableInput', () => {
      expect(props.question.question_type).not.toMatch(
        /question_category_satisfaction/
      )
      expect(
        wrapper
          .find('Question')
          .find('EditableInput')
          .exists()
      ).toEqual(false)
    })

    describe('on editing', () => {
      it('should disable all the buttons', () => {
        expect(
          wrapper
            .find('EmojiButton')
            .first()
            .props().disabled
        ).toBe(true)
      })

      it('should set the question border to commonMedium', () => {
        expect(wrapper.find('Question')).toHaveStyleRule(
          'border-color',
          v.colors.commonMedium
        )
      })
    })

    describe('when a answer is selected', () => {
      beforeEach(() => {
        props.questionAnswer = fakeQuestionAnswer
        props.questionAnswer.answer_number = 2
        wrapper = shallow(<ScaleQuestion {...props} />)
      })

      it('should set the emoji opacity to 1', () => {
        expect(wrapper.find('EmojiButton').at(1)).toHaveStyleRule(
          'opacity',
          '1'
        )
      })
    })

    describe('when a answer is not selected', () => {
      beforeEach(() => {
        props.questionAnswer = fakeQuestionAnswer
        props.questionAnswer.answer_number = 3
        wrapper = shallow(<ScaleQuestion {...props} />)
      })

      it('should set the emoji opacity to 0.5', () => {
        expect(wrapper.find('EmojiButton').at(0)).toHaveStyleRule(
          'opacity',
          '0.5'
        )
      })
    })

    describe('on category_satisfaction question', () => {
      beforeEach(() => {
        props.question.question_type = 'question_category_satisfaction'
        props.question.content = undefined
        wrapper = shallow(<ScaleQuestion {...props} />)
      })

      it('should have editable input field if no content', () => {
        const input = wrapper.find('Question').find('EditableInput')
        expect(input.exists()).toEqual(true)
        expect(input.props().value).toEqual(undefined)
      })

      describe('if not editable', () => {
        beforeEach(() => {
          props.question.question_type = 'question_category_satisfaction'
          props.question.content = 'magic wand'
          props.editable = false
          wrapper = shallow(<ScaleQuestion {...props} />)
        })

        it('should have text, and not editable input field', () => {
          expect(
            wrapper
              .find('Question')
              .find('StyledDisplayText')
              .props().alt
          ).toEqual('How satisifed are you with your current magic wand?')
          expect(
            wrapper
              .find('Question')
              .find('EditableInput')
              .exists()
          ).toEqual(false)
        })
      })

      describe('if it has content', () => {
        beforeEach(() => {
          props.question.question_type = 'question_category_satisfaction'
          props.question.content = 'magic wand'
          wrapper = shallow(<ScaleQuestion {...props} />)
        })

        it('should render content', () => {
          expect(
            wrapper
              .find('Question')
              .find('StyledDisplayText')
              .props().alt
          ).toEqual('How satisifed are you with your current magic wand?')
        })

        it('should not render input', () => {
          expect(
            wrapper
              .find('Question')
              .find('EditableInput')
              .exists()
          ).toEqual(false)
        })
      })
    })
  })

  describe('on vote', () => {
    beforeEach(() => {
      wrapper
        .find('EmojiButton')
        .first()
        .simulate('click', fakeEv)
    })

    it('should call onAnswer prop', () => {
      expect(props.onAnswer).toHaveBeenCalledWith({ number: 1 })
    })
  })
})
