import CustomizableQuestionChoice from '~/ui/test_collections/CustomizableQuestionChoice'
import { fakeQuestionAnswer, fakeQuestionChoice } from '#/mocks/data'

let wrapper, props
describe('CustomizableQuestionChoice', () => {
  beforeEach(() => {
    props = {
      onChange: () => {},
      isSingleChoiceQuestion: true,
      choice: fakeQuestionChoice,
      questionAnswer: fakeQuestionAnswer,
      isChecked: false,
      editing: false,
      onDelete: () => {},
    }
    wrapper = shallow(<CustomizableQuestionChoice {...props} />)
  })

  describe('when single choice', () => {
    beforeEach(() => {
      props.isSingleChoiceQuestion = true
    })

    describe('when editing', () => {
      beforeEach(() => {
        props.editing = true
        wrapper = shallow(<CustomizableQuestionChoice {...props} />)
      })

      describe('render()', () => {
        it('renders a radio button', () => {
          expect(wrapper.find('StyledRadio').exists()).toBe(true)
        })

        it('enables the text input', () => {
          // https://github.com/airbnb/enzyme/issues/336#issuecomment-526357088
          expect(wrapper.find('TextInput').props()['disabled']).toBe(false)
        })
      })
    })

    describe('when not editing', () => {
      beforeEach(() => {
        props.editing = false
        wrapper = shallow(<CustomizableQuestionChoice {...props} />)
      })

      describe('render()', () => {
        it('renders a radio button', () => {
          expect(wrapper.find('StyledRadio').exists()).toBe(true)
        })

        it('disables the text input', () => {
          expect(wrapper.find('TextInput').props()['disabled']).toBe(true)
        })
      })
    })
  })

  describe('when multiple choice', () => {
    beforeEach(() => {
      props.isSingleChoiceQuestion = false
    })

    describe('when editing', () => {
      beforeEach(() => {
        props.editing = true
        wrapper = shallow(<CustomizableQuestionChoice {...props} />)
      })

      describe('render()', () => {
        it('renders a checkbox', () => {
          expect(wrapper.find('StyledCheckbox').exists()).toBe(true)
        })

        it('enables the text input', () => {
          expect(wrapper.find('TextInput').props()['disabled']).toBe(false)
        })
      })
    })

    describe('when not editing', () => {
      beforeEach(() => {
        props.editing = false
        wrapper = shallow(<CustomizableQuestionChoice {...props} />)
      })

      describe('render()', () => {
        it('renders a checkbox', () => {
          expect(wrapper.find('StyledCheckbox').exists()).toBe(true)
        })

        it('disables the text input', () => {
          expect(wrapper.find('TextInput').props()['disabled']).toBe(true)
        })
      })
    })
  })
})
