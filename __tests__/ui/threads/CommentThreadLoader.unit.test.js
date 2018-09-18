import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'

import { fakeThread } from '#/mocks/data'

let wrapper, props, component
describe('CommentThreadContainer', () => {
  beforeEach(() => {
    props = {
      thread: fakeThread,
    }
    wrapper = shallow(<CommentThreadLoader {...props} />)
    component = wrapper.instance()
  })

  it('renders a RefreshIcon', () => {
    expect(wrapper.find('RefreshIcon').exists()).toBeTruthy()
  })

  it('does not render the loader by default', () => {
    expect(wrapper.find('InlineLoader').exists()).toBeFalsy()
  })

  it('calls fetch comments method on thread', () => {
    component.loadMore()
    expect(props.thread.API_fetchComments).toHaveBeenCalled()
  })

  describe('in loading state', () => {
    beforeEach(() => {
      component.setLoading(true)
      wrapper.update()
    })

    it('renders the loader', () => {
      expect(wrapper.find('InlineLoader').exists()).toBeTruthy()
    })
  })
})
