import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import { fakeTextItem, fakeActionCableUser, fakeUser } from '#/mocks/data'
import Delta from 'quill-delta'

const props = {
  item: fakeTextItem,
  currentUserId: '1',
  onCancel: jest.fn(),
  onExpand: jest.fn(),
  fullPageView: false,
  fullyLoaded: true,
}

let wrapper, component
describe('TextItem', () => {
  beforeEach(() => {
    wrapper = shallow(<RealtimeTextItem {...props} />)
    component = wrapper.instance()
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

  describe('realtime text methods', () => {
    const hello = new Delta({ ops: [{ insert: 'Hello' }] })
    const world = new Delta({ ops: [{ retain: 5 }, { insert: ', World.' }] })
    const aloha = new Delta({ ops: [{ retain: 13 }, { insert: ' Aloha.' }] })
    const lorem = new Delta({ ops: [{ insert: 'Lorem. ' }] })
    const helloWorld = new Delta({ ops: [{ insert: 'Hello, World.' }] })
    const helloWorldAloha = new Delta({
      ops: [{ insert: 'Hello, World. Aloha.' }],
    })
    // const loremHelloWorldAloha = new Delta({
    //   ops: [{ insert: 'Lorem. Hello, World. Aloha.' }],
    // })
    const error = {
      // current user
      current_editor: { id: '1' },
      data: { error: true },
    }
    const success = {
      // current user
      current_editor: { id: '1' },
      data: {},
    }

    beforeEach(() => {
      component.version = 1
    })

    it('combines and buffers input text changes', () => {
      component.combineAwaitingDeltas(hello)
      component.combineAwaitingDeltas(world)
      expect(component.combinedDelta).toEqual(helloWorld)
      expect(component.bufferDelta).toEqual(helloWorld)

      component._sendCombinedDelta()
      expect(component.combinedDelta).toEqual(helloWorld)
      expect(component.bufferDelta).toEqual(new Delta())

      component.handleReceivedDelta(error)
      // error confirmation back, we keep typing
      component.combineAwaitingDeltas(aloha)
      expect(component.combinedDelta).toEqual(helloWorldAloha)
      expect(component.bufferDelta).toEqual(aloha)

      component.handleReceivedDelta(success)
      // success confirmation -- combinedDelta becomes a copy of buffer
      expect(component.combinedDelta).toEqual(aloha)
      expect(component.bufferDelta).toEqual(aloha)

      component.combineAwaitingDeltas(lorem)
      expect(component.combinedDelta).toEqual(aloha.compose(lorem))
      expect(component.bufferDelta).toEqual(aloha.compose(lorem))
    })

    it('merges received changes', () => {
      component.combineAwaitingDeltas(helloWorld)
      expect(component.combinedDelta).toEqual(helloWorld)
      expect(component.bufferDelta).toEqual(helloWorld)

      component._sendCombinedDelta()
      expect(component.combinedDelta).toEqual(helloWorld)
      expect(component.bufferDelta).toEqual(new Delta())

      expect(component.version).toEqual(1)
      // we receive someone else's response
      component.handleReceivedDelta({
        current_editor: { id: '88' },
        data: {
          version: 2,
          last_10: [{ version: 2, delta: lorem }],
        },
      })
      expect(component.version).toEqual(2)
      expect(component.contentSnapshot).toEqual(lorem)
      // now our "Hello, World" should now be after "Lorem."
      expect(component.combinedDelta).toEqual(
        new Delta({
          ops: [{ retain: 7 }, { insert: 'Hello, World.' }],
        })
      )
    })
  })
})
