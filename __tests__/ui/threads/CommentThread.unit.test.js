import CommentThread from '~/ui/threads/CommentThread'
import { fakeThread } from '#/mocks/data'

let wrapper, props
describe('CommentThread', () => {
  beforeEach(() => {
    props = {
      expanded: false,
      onClick: jest.fn(),
      afterSubmit: jest.fn(),
      thread: fakeThread,
    }
    wrapper = shallow(
      <CommentThread {...props} />
    )
  })

  it('renders a title with the record.name', () => {
    expect(wrapper.find('.name').text()).toContain(props.thread.record.name)
  })

  it('renders a textarea', () => {
    // NOTE: textarea is just shown/hidden via CSS so it should always "exist"
    expect(wrapper.find('CommentTextarea').exists()).toBeTruthy()
  })

  describe('with unexpanded thread', () => {
    it('renders unread comments if thread is unexpanded', () => {
      // fakeThread has 2 unread_comments
      expect(wrapper.find('Comment').length).toEqual(props.thread.unread_comments.length)
    })
  })

  describe('with expanded thread', () => {
    beforeEach(() => {
      props = {
        ...props,
        expanded: true,
      }
      wrapper = shallow(
        <CommentThread {...props} />
      )
    })

    it('renders all the comments if thread is expanded', () => {
      expect(wrapper.find('Comment').length).toEqual(props.thread.comments.length)
    })
  })
})
