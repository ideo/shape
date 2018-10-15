import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import { fakeQuestionAnswer } from '#/mocks/data'
import v from '~/utils/variables'

let wrapper, props
const fakeEv = {
  preventDefault: jest.fn(),
}
describe('ScaleQuestion', () => {
  beforeEach(() => {
    props = {
      questionAnswer: fakeQuestionAnswer,
      questionText: 'What do you think?',
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
