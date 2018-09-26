import OpenQuestion from '~/ui/test_collections/OpenQuestion'
import { fakeQuestionItem } from '#/mocks/data'

let wrapper, props
describe('OpenQuestion', () => {
  beforeEach(() => {
    props = {
      item: fakeQuestionItem,
      editing: true,
      onAnswer: jest.fn(),
      canEdit: true,
    }
    wrapper = shallow(<OpenQuestion {...props} />)
  })

  describe('render()', () => {
    describe('on editing', () => {
      it('should render a description question', () => {
        expect(wrapper.find('DescriptionQuestion').exists()).toBe(true)
      })

      it('should enable the text input', () => {
        expect(wrapper.find('TextInput').props().disabled).toBe(true)
      })
    })

    describe('on not editing', () => {
      beforeEach(() => {
        props.editing = false
        wrapper = shallow(<OpenQuestion {...props} />)
      })

      it('should render the question with a simple question text', () => {
        expect(wrapper.find('QuestionTextWithSpacing').exists()).toBe(true)
      })

      it('should disable the text input', () => {
        expect(wrapper.find('TextInput').props().disabled).toBe(false)
      })
    })
  })

  describe('on submit', () => {
    beforeEach(() => {
      props.editing = false
      wrapper = shallow(<OpenQuestion {...props} />)
      wrapper.setState({ response: 'hello' })
      wrapper
        .find('QuestionEntryForm')
        .simulate('submit', { preventDefault: jest.fn() })
    })

    it('should call onAnswer prop', () => {
      expect(props.onAnswer).toHaveBeenCalledWith({ text: 'hello' })
    })
  })
})
