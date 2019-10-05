import { EditorState, ContentState } from 'draft-js'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import { fakeThread } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, component, props
const ev = { preventDefault: () => null }
describe('CommentEntryForm', () => {
  beforeEach(() => {
    props = {
      uiStore: fakeUiStore,
      expanded: true,
      afterSubmit: jest.fn(),
      onHeightChange: jest.fn(),
      thread: fakeThread,
    }
    wrapper = shallow(<CommentEntryForm.wrappedComponent {...props} />)
    component = wrapper.instance()
    fakeThread.API_saveComment.mockClear()
  })

  it('renders the CommentInputWrapper', () => {
    expect(wrapper.find('StyledCommentInputWrapper').exists()).toBeTruthy()
  })

  describe('handleSubmit', () => {
    describe('with no message', () => {
      it('does not call API_saveComment', () => {
        component.handleSubmit(ev)
        expect(fakeThread.API_saveComment).not.toHaveBeenCalled()
      })
    })
    describe('with a message', () => {
      it('calls API_saveComment', () => {
        wrapper.setState({
          editorState: EditorState.createWithContent(
            ContentState.createFromText('foo!')
          ),
        })
        component.handleSubmit(ev)
        expect(fakeThread.API_saveComment).toHaveBeenCalled()
      })
    })
  })
})
