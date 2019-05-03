import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import { fakeTextItem, fakeActionCableUser, fakeUser } from '#/mocks/data'

const props = {
  item: fakeTextItem,
  currentUserId: fakeUser.id.toString(),
  onCancel: jest.fn(),
  onExpand: jest.fn(),
  fullPageView: false,
  fullyLoaded: true,
}

let wrapper
describe('TextItem', () => {
  beforeEach(() => {
    wrapper = shallow(<RealtimeTextItem {...props} />)
  })

  it('passes the text content to Quill', () => {
    expect(wrapper.find('Quill').props().value).toEqual(
      fakeTextItem.data_content
    )
  })

  describe('can view', () => {
    beforeEach(() => {
      props.item.can_edit = false
      wrapper = shallow(<RealtimeTextItem {...props} />)
    })

    it('does not render the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(false)
    })

    it('passes readOnly to ReactQuill', () => {
      expect(wrapper.find('Quill').props().readOnly).toBe(true)
    })

    it('does not render the editor pill', () => {
      expect(wrapper.find('EditorPill').exists()).toBe(false)
    })

    describe('with someone else editing', () => {
      beforeEach(() => {
        wrapper.instance().version = 1
        wrapper.instance().channelReceivedData({
          current_editor: fakeActionCableUser,
          data: {
            num_viewers: 2,
            version: 99,
            last_10: [{ version: 99, delta: {} }],
          },
        })
        wrapper.update()
      })

      it('applies last version delta', () => {
        // Make sure user ID's are not the same
        expect(fakeUser.id).not.toEqual(fakeActionCableUser.id)
        expect(wrapper.instance().version).toEqual(99)
      })
    })
  })

  describe('can edit', () => {
    beforeEach(() => {
      props.item.can_edit_content = true
      props.item.parentPath = '/collections/99'
      wrapper = shallow(<RealtimeTextItem {...props} />)
    })

    it('renders the Quill editor', () => {
      expect(wrapper.find('Quill').exists()).toBe(true)
      expect(wrapper.find('Quill').props().readOnly).toBe(false)
    })

    it('renders the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(true)
    })

    it('does not render the editor pill', () => {
      expect(wrapper.find('EditorPill').exists()).toBe(false)
    })
  })
})
