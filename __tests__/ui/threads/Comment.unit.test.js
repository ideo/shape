import Comment from '~/ui/threads/Comment'
import { fakeComment } from '#/mocks/data'

let wrapper, props
describe('Comment', () => {
  beforeEach(() => {
    props = {
      comment: fakeComment,
    }
    wrapper = shallow(
      <Comment {...props} />
    )
  })

  it('renders the author name and avatar', () => {
    expect(wrapper.find('.author').text()).toContain(props.comment.author.name)
    expect(wrapper.find('UserAvatar').props().user).toEqual(props.comment.author)
  })

  it('renders the message', () => {
    expect(wrapper.find('.message').text()).toEqual(props.comment.message)
  })
})
