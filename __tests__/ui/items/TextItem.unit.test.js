import TextItem from '~/ui/items/TextItem'

import fakeActionCableConsumer from '#/mocks/fakeActionCableConsumer'

import {
  fakeTextItem,
  fakeActionCableUser,
  fakeUser
} from '#/mocks/data'

const actionCableReceived = message => message
const actionCableConnected = message => message
const actionCableDisconnected = message => message

const props = {
  item: fakeTextItem,
  currentUserId: fakeUser.id.toString(),
  onSave: jest.fn(),
  onUpdatedData: jest.fn(),
  actionCableConsumer: fakeActionCableConsumer({
    connectedFn: actionCableConnected,
    receivedFn: actionCableReceived,
    disconnectedFn: actionCableDisconnected,
  })
}

let wrapper
describe('TextItem', () => {
  beforeEach(() => {
    wrapper = shallow(
      <TextItem {...props} />
    )
  })

  it('passes the text content to Quill', () => {
    expect(wrapper.find('Quill').props().value).toEqual(fakeTextItem.text_data)
  })

  describe('can view', () => {
    beforeEach(() => {
      props.item.can_edit = false
      wrapper = shallow(
        <TextItem {...props} />
      )
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
        wrapper.instance().channelReceivedData({
          current_editor: fakeActionCableUser,
          num_viewers: 2
        })
        wrapper.update()
      })

      it('shows editor pill if someone else is editing', () => {
        // Make sure user ID's are not the same
        expect(fakeUser.id).not.toEqual(fakeActionCableUser.id)
        expect(wrapper.find('EditorPill').exists()).toBe(true)
        expect(wrapper.find('EditorPill').props().editor).toEqual(fakeActionCableUser)
      })

      it('locks quill', () => {
        expect(wrapper.find('Quill').props().readOnly).toBe(true)
      })
    })
  })

  describe('can edit', () => {
    beforeEach(() => {
      props.item.can_edit_content = true
      props.item.parentPath = '/collections/99'
      wrapper = shallow(
        <TextItem {...props} />
      )
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

    describe('with someone else editing', () => {
      beforeEach(() => {
        wrapper.instance().channelReceivedData({
          current_editor: fakeActionCableUser,
          num_viewers: 2
        })
        wrapper.update()
      })

      it('shows editor pill', () => {
        expect(wrapper.find('EditorPill').exists()).toBe(true)
        expect(wrapper.find('EditorPill').props().editor).toEqual(fakeActionCableUser)
      })

      it('locks quill', () => {
        expect(wrapper.find('Quill').props().readOnly).toBe(true)
      })
    })
  })
})
