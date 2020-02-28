import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'
import { fakeQuestionItem } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props, InputComponentSelector
describe('QuestionContentEditor', () => {
  beforeEach(() => {
    props = {
      item: fakeQuestionItem,
      itemAttribute: 'content',
      canEdit: true,
      onAnswer: jest.fn(),
      maxLength: 500,
      singleLine: false,
      placeholder: 'add text here',
      uiStore: fakeUiStore,
    }
    InputComponentSelector = '[data-cy="QuestionContentEditorText"]'

    wrapper = shallow(<QuestionContentEditor.wrappedComponent {...props} />)
  })

  describe('render()', () => {
    describe('when editing', () => {
      it('renders a text input', () => {
        expect(wrapper.find(InputComponentSelector).exists()).toBe(true)
      })

      it('enables the text input', () => {
        expect(wrapper.find(InputComponentSelector).props()['disabled']).toBe(
          false
        )
      })
    })

    describe('when passed single line prop', () => {
      beforeEach(() => {
        props.singleLine = true
        props.maxLength = 40

        wrapper = shallow(<QuestionContentEditor.wrappedComponent {...props} />)
      })

      it('renders a <SingleLineInput/>', () => {
        expect(wrapper.find(InputComponentSelector).props()['maxLength']).toBe(
          40
        )
      })
    })

    describe('when not passed single line prop', () => {
      it('renders a <TextInput/>', () => {
        expect(wrapper.find(InputComponentSelector).props()['maxLength']).toBe(
          500
        )
      })
    })

    describe('when not editing', () => {
      beforeEach(() => {
        props.canEdit = false
        wrapper = shallow(<QuestionContentEditor.wrappedComponent {...props} />)
      })

      it('renders the question with a simple question text', () => {
        expect(wrapper.find(InputComponentSelector).exists()).toBe(true)
      })

      it('disables the text input', () => {
        expect(wrapper.find(InputComponentSelector).props()['disabled']).toBe(
          true
        )
      })
    })
  })
  // TODO: cover these with tests
  // describe('handleBlur', () => {})
  // describe('handleChange', () => {})
})
