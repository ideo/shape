import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import { fakeTextItem, fakeActionCableUser, fakeUser } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import Delta from 'quill-delta'
import ColorPicker from '~/ui/global/ColorPicker'
import ChannelManager from '~/utils/ChannelManager'

jest.mock('../../../app/javascript/utils/ChannelManager')

const props = {
  item: fakeTextItem,
  currentUserId: '1',
  cardId: '1',
  onCancel: jest.fn(),
  onExpand: jest.fn(),
  fullPageView: false,
  fullyLoaded: true,
  initialSize: 'normal',
  uiStore: fakeUiStore,
  routingStore: fakeRoutingStore,
  apiStore: fakeApiStore(),
}

let wrapper, component
const rerender = (merge = {}) => {
  ChannelManager.subscribe.mockClear()
  const mergedProps = { ...props, ...merge }
  wrapper = shallow(<RealtimeTextItem.wrappedComponent {...mergedProps} />)
  component = wrapper.instance()
  component.quillEditor = {
    getSelection: jest.fn(),
    getContents: jest.fn().mockReturnValue(fakeTextItem.quill_data),
    setContents: jest.fn(),
    formatText: jest.fn(),
    format: jest.fn(),
    updateContents: jest.fn(),
    history: {
      clear: jest.fn(),
    },
    root: {
      innerHTML: '',
    },
  }
}
describe('RealtimeTextItem', () => {
  beforeEach(() => {
    rerender()
  })

  it('passes the text content to Quill', () => {
    expect(wrapper.find('Quill').props().value).toEqual(
      fakeTextItem.data_content
    )
  })

  describe('render()', () => {
    describe('when color picker is open', () => {
      beforeEach(() => {
        props.item.can_edit_content = true
        props.item.background_color = '#A85751'
        props.item.background_color_opacity = 1
        rerender()
        component.colorPickerOpen = true
        wrapper.update()
      })

      it('should render the ColorPicker', () => {
        expect(wrapper.find(ColorPicker).exists()).toBe(true)
      })

      it('should give the color picker the background_color in rgb', () => {
        const picker = wrapper.find(ColorPicker)
        expect(picker.props().color).toEqual({ a: 1, b: 81, g: 87, r: 168 })
      })
    })
  })

  describe('can view', () => {
    beforeEach(() => {
      props.item.can_edit = false
      props.item.can_edit_content = false
      rerender()
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
        const inst = wrapper.instance()
        inst.channelReceivedData({
          current_editor: fakeActionCableUser,
          data: {
            num_viewers: 2,
            version: 99,
            last_10: [{ version: 99, delta: {} }],
          },
          collaborators: [fakeUser],
        })
        wrapper.update()
      })

      it('updates collaborators', () => {
        expect(props.item.setCollaborators).toHaveBeenCalledWith([fakeUser])
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
      rerender()
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

  describe('initialSize', () => {
    beforeEach(() => {
      rerender()
      component.reactQuillRef = {}
      // re-call with fake reactQuillRef set
      component.componentDidMount()
    })

    describe('with default (size normal)', () => {
      it('should not affect initial quill format', () => {
        expect(component.quillEditor.format).not.toHaveBeenCalled()
      })
    })

    describe('with "huge" and a new text item', () => {
      beforeEach(async () => {
        rerender({
          item: { ...fakeTextItem, quill_data: { ops: [] }, version: 1 },
          initialSize: 'huge',
        })
        component.version = 1
        component.reactQuillRef = {}
        // re-call with fake reactQuillRef set
        await component.componentDidMount()
      })

      it('should begin with huge size format', () => {
        expect(component.quillEditor.format).toHaveBeenCalledWith(
          'size',
          'huge'
        )
      })
    })
  })

  describe('cancel', () => {
    beforeEach(() => {
      props.uiStore.viewingCollection = { id: '1' }
      rerender()
    })

    it('should flush debounced methods', () => {
      component.sendCombinedDelta.flush = jest.fn()
      component.instanceTextContentUpdate.flush = jest.fn()
      component.cancel()
      expect(component.sendCombinedDelta.flush).toHaveBeenCalled()
      expect(component.instanceTextContentUpdate.flush).toHaveBeenCalled()
    })

    it('should call props.onCancel with all the relevant params', () => {
      const fakeEv = {}
      component.cancel(fakeEv)
      expect(props.onCancel).toHaveBeenCalledWith({
        item: props.item,
        ev: fakeEv,
        route: true,
        num_viewers: 1,
      })

      rerender()
      props.onCancel.mockClear()
      component.num_viewers = 2
      component.cancel(fakeEv)
      expect(props.onCancel).toHaveBeenCalledWith({
        item: props.item,
        ev: fakeEv,
        route: true,
        num_viewers: 2,
      })
    })

    it('should not call item pushTextUndo unless text has changed', () => {
      component.cancel()
      expect(props.item.pushTextUndo).not.toHaveBeenCalled()
    })

    it('should call item pushTextUndo if text has changed', () => {
      // fake that the starting data was different
      component.quillData = { ops: [{ insert: 'xyz old data' }] }
      component.cancel()
      expect(props.item.pushTextUndo).toHaveBeenCalledWith({
        previousData: component.quillData,
        currentData: props.item.quill_data,
        redirectTo: props.uiStore.viewingCollection,
      })
    })
  })

  describe('with unpersisted item', () => {
    beforeEach(() => {
      props.item.persisted = false
      rerender()
    })
    afterEach(() => {
      props.item.persisted = true
    })

    it('does not subscribe to ItemRealtimeChannel', () => {
      expect(ChannelManager.subscribe).not.toHaveBeenCalled()
      expect(component.version).toBe(null)
    })

    it('does subscribe and set version after receiving persisted item', () => {
      wrapper.setProps({ item: { ...props.item, version: 1, persisted: true } })
      expect(ChannelManager.subscribe).toHaveBeenCalled()
      expect(component.version).toEqual(1)
      expect(component.initiateHotSwap).toBeTruthy()
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
    const error = {
      // current user
      current_editor: { id: '1' },
      data: { error: 'locked' },
    }
    const success = {
      // current user
      current_editor: { id: '1' },
      data: {},
    }

    beforeEach(() => {
      props.item = { ...fakeTextItem, version: 1 }
      rerender()
    })

    it('subscribes to ItemRealtimeChannel', () => {
      expect(ChannelManager.subscribe).toHaveBeenCalled()
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
      expect(component.version).toEqual(null)

      component._sendCombinedDelta()
      expect(component.combinedDelta).toEqual(helloWorld)
      expect(component.bufferDelta).toEqual(new Delta())

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

  describe('onSelectColor', () => {
    beforeEach(() => {
      props.item.can_edit_content = true
      rerender()
      component.onSelectColor({
        hex: '#83fa21',
        rgb: { a: 0.35 },
      })
    })

    it('should set the item background color and opacity', () => {
      expect(props.item.background_color).toEqual('#83fa21')
      expect(props.item.background_color_opacity).toEqual(0.35)
    })
  })
})
