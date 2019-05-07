import Comment from '~/ui/threads/Comment'
import { fakeComment, fakeUser } from '#/mocks/data'
import { apiStore, uiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, props
describe('Comment', () => {
  beforeEach(() => {
    props = {
      comment: {
        ...fakeComment,
        persisted: true,
      },
    }
    wrapper = shallow(<Comment {...props} />)
  })

  it('renders the author name and avatar', () => {
    expect(
      wrapper
        .find('.author')
        .children()
        .text()
    ).toContain(props.comment.author.name)
    expect(wrapper.find('Avatar').props().url).toEqual(
      props.comment.author.pic_url_square
    )
  })

  it('renders the message', () => {
    expect(wrapper.find('.message').text()).toEqual(props.comment.message)
  })

  it('renders the timestamp', () => {
    expect(wrapper.find('Moment').props().date).toEqual(
      props.comment.updated_at
    )
  })

  describe('when user is comment author', () => {
    beforeEach(() => {
      apiStore.currentUserId = '1'
    })

    it('renders an edit button', () => {
      expect(wrapper.find('.test-edit-comment').exists()).toBe(true)
    })

    it('renders a delete button', () => {
      expect(wrapper.find('.test-delete-comment').exists()).toBe(true)
    })

    describe('on click delete', () => {
      it('deletes the comment', () => {
        const deleteButton = wrapper.find('.test-delete-comment').first()
        deleteButton.simulate('click')
        expect(uiStore.confirm).toHaveBeenCalled()
      })
    })
  })

  describe('when user is not the comment author', () => {
    beforeEach(() => {
      apiStore.currentUserId = '1'
      props.comment.author = { ...fakeUser, id: '9' }
      wrapper.setProps(props)
    })
    it('does not render an edit button', () => {
      expect(wrapper.find('.test-edit-comment').exists()).toBe(false)
    })
    it('does not render a delete button', () => {
      expect(wrapper.find('.test-delete-comment').exists()).toBe(false)
    })
  })
})
