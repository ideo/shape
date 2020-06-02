import CommentThread from '~/ui/threads/CommentThread'
import { fakeThread, fakeComment } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, props
describe('CommentThread', () => {
  beforeEach(() => {
    props = {
      thread: fakeThread,
      uiStore: fakeUiStore,
      apiStore: fakeApiStore(),
      afterSubmit: jest.fn(),
      onEditorHeightChange: jest.fn(),
      updateContainerSize: jest.fn(),
      loadingThreads: false,
    }
    wrapper = shallow(<CommentThread.wrappedComponent {...props} />)
  })

  it('renders a CommentThreadHeader with the thread', () => {
    expect(wrapper.find('CommentThreadHeader').exists()).toBeTruthy()
  })

  it('renders a CommentEntryForm', () => {
    // NOTE: textarea is just shown/hidden via "expanded" prop so it should always exist
    expect(wrapper.find('CommentEntryForm').exists()).toBeTruthy()
    expect(wrapper.find('CommentEntryForm').props().expanded).toEqual(
      props.expanded
    )
  })

  it('renders all the comments', () => {
    expect(wrapper.find('Comment').length).toEqual(props.thread.comments.length)
  })

  describe('with comments with subthread', () => {
    let comments
    beforeEach(() => {
      comments = [
        {
          ...fakeComment,
          persisted: true,
        },
      ]
      const thread = {
        ...fakeThread,
        comments,
      }

      props.thread = thread
      wrapper = shallow(<CommentThread.wrappedComponent {...props} />)
    })

    it('should render the parent comment', () => {
      expect(wrapper.find('Comment').length).toEqual(1)
    })
  })
})
