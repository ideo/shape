import TextItem from '~/ui/items/TextItem'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeActionCableConsumer from '#/mocks/fakeActionCableConsumer'

import {
  fakeTextItem,
  fakeActionCableUser
} from '#/mocks/data'

const actionCableReceived = message => message
const actionCableConnected = message => message
const actionCableDisconnected = message => message

const props = {
  apiStore: fakeApiStore(),
  item: fakeTextItem,
  currentUserId: fakeActionCableUser.id,
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
      <TextItem.wrappedComponent {...props} />
    )
  })

  it('passes the text content to Quill', () => {
    expect(wrapper.find('Quill').props().value).toEqual(fakeTextItem.text_data)
  })

  describe('as viewer', () => {
    beforeEach(() => {
      props.item.can_edit = false
      wrapper = shallow(
        <TextItem.wrappedComponent {...props} />
      )
    })

    it('does not render the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(false)
    })

    it('passes readOnly to ReactQuill', () => {
      expect(wrapper.find('Quill').props().readOnly).toBe(true)
    })

    it('shows editor if someone else is editing', () => {
      expect(wrapper.find('EditorPill').exists()).toBe(false)
      wrapper.instance().channelReceivedData({
        current_editor: fakeActionCableUser,
        num_viewers: 2
      })
      expect(wrapper.find('EditorPill').exists()).toBe(true)
    })
  })

  describe('as editor', () => {
    beforeEach(() => {
      props.item.can_edit = true
      props.item.parentPath = '/collections/99'
      wrapper = shallow(
        <TextItem.wrappedComponent {...props} />
      )
    })

    it('renders the Quill editor', () => {
      expect(wrapper.find('Quill').exists()).toBe(true)
      expect(wrapper.find('Quill').props().readOnly).toBe(false)
    })

    it('renders the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(true)
    })

    describe('with someone else editing', () => {
      it('shows editor pill', () => {
        expect(wrapper.find('EditorPill').exists()).toBe(false)
        wrapper.instance().channelReceivedData({
          current_editor: fakeActionCableUser,
          num_viewers: 2
        })
        expect(wrapper.find('EditorPill').exists()).toBe(true)
      })

      it('locks quill', () => {
        expect(wrapper.find('EditorPill').exists()).toBe(false)
        wrapper.instance().channelReceivedData({
          current_editor: fakeActionCableUser,
          num_viewers: 2
        })
        expect(wrapper.find('EditorPill').exists()).toBe(true)
      })
    })
  })
})
