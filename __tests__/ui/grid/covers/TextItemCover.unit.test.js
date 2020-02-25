import TextItemCover from '~/ui/grid/covers/TextItemCover'
import { apiStore, uiStore } from '~/stores'

import { fakeTextItem } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores/index')

const item = fakeTextItem
const props = {
  item,
  dragging: false,
  height: 200,
  cardId: '1',
  handleClick: jest.fn(),
  initialFontTag: 'P',
}
const e = {
  stopPropagation: jest.fn(),
}
const fakeReactQuillRef = {
  editingArea: {
    getElementsByClassName: jest.fn().mockReturnValue([{ scrollHeight: 500 }]),
  },
  getEditor: jest.fn(),
}

let wrapper, component
describe('TextItemCover', () => {
  beforeEach(() => {
    props.editable = false
    wrapper = shallow(<TextItemCover {...props} />)
    component = wrapper.instance()
  })

  it('renders Quill with item.quill_data', () => {
    expect(wrapper.find('Quill').props().value).toBe(item.quill_data)
  })

  it('renders Read More if text height exceeds the viewable area', () => {
    const inst = wrapper.instance()
    inst.reactQuillRef = fakeReactQuillRef
    inst.componentDidMount()
    // force re-render to pick up state update
    wrapper.update()
    expect(wrapper.state().readMore).toBe(true)
    expect(wrapper.find('StyledReadMore').exists()).toBe(true)
  })

  it('does not render Read More if text height fits within the viewable area', () => {
    const inst = wrapper.instance()
    inst.reactQuillRef = {
      ...fakeReactQuillRef,
      editingArea: {
        getElementsByClassName: jest
          .fn()
          .mockReturnValue([{ scrollHeight: 100 }]),
      },
    }
    inst.componentDidMount()
    wrapper.update()
    expect(wrapper.state().readMore).toBe(false)
    expect(wrapper.find('StyledReadMore').exists()).toBe(false)
  })

  describe('handleClick', () => {
    it('calls props handleClick if it exists', () => {
      component.handleClick(e)
      expect(props.handleClick).toHaveBeenCalled()
    })

    it('returns false if you are dragging', async () => {
      wrapper.setProps({ dragging: true })
      const result = await component.handleClick(e)
      expect(result).toBe(false)
    })

    it("returns false if you can't edit content", async () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, can_edit_content: false },
      })
      const result = await component.handleClick(e)
      expect(result).toBe(false)
    })

    it('returns false if searchResult is true', async () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, searchResult: true },
      })
      const result = await component.handleClick(e)
      expect(result).toBe(false)
    })

    it('calls uiStore.update textEditingItem if can_edit_content', async () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, can_edit_content: true },
      })
      const result = await component.handleClick(e)
      expect(result).toBe(null)
      expect(uiStore.update).toHaveBeenCalledWith(
        'textEditingItem',
        expect.any(Object)
      )
    })

    it('calls apiStore.fetch item if can_edit_content', async () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, can_edit_content: true },
      })
      const result = await component.handleClick(e)
      expect(result).toBe(null)
      expect(apiStore.fetch).toHaveBeenCalledWith('items', item.id, true)
    })

    it('calls uiStore.showPermissionsAlert if cannot view', () => {
      wrapper.setProps({
        item: { ...item, can_view: false },
      })
      component.handleClick(e)
      expect(uiStore.showPermissionsAlert).toHaveBeenCalled()
    })
  })

  describe('cancel', () => {
    beforeEach(() => {
      item.content = '<p>'
      item.API_updateWithoutSync = jest.fn()
    })

    it('calls item.API_updateWithoutSync', async () => {
      component.cancel({ item, ev: e })
      expect(props.item.API_updateWithoutSync).toHaveBeenCalledWith({
        cancel_sync: true,
      })
    })

    describe('with no content', () => {
      const card = { API_archiveSelf: jest.fn() }
      beforeEach(() => {
        item.content = ''
        item.version = null
        item.API_updateWithoutSync = jest.fn()
        apiStore.find = jest.fn().mockReturnValue(card)
        card.API_archiveSelf.mockClear()
      })
      describe('and no version', () => {
        beforeEach(() => {
          item.version = null
          wrapper = shallow(<TextItemCover {...props} />)
          component = wrapper.instance()
        })
        it('calls card.API_archiveSelf', async () => {
          component.cancel({ item, ev: e })
          expect(apiStore.find).toHaveBeenCalledWith(
            'collection_cards',
            props.cardId
          )
          expect(card.API_archiveSelf).toHaveBeenCalled()
        })
      })
      describe('and a version', () => {
        beforeEach(() => {
          item.version = 1
          wrapper = shallow(<TextItemCover {...props} />)
          component = wrapper.instance()
        })
        it('does not call card.API_archiveSelf', async () => {
          component.cancel({ item, ev: e })
          expect(card.API_archiveSelf).not.toHaveBeenCalled()
        })
      })
    })
  })
})
