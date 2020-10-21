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
  initialSize: 'normal',
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
    let fakeCard
    beforeEach(() => {
      fakeCard = { id: '1', record: {} }
      apiStore.find = jest.fn().mockReturnValue(fakeCard)
    })

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

    it('calls uiStore.setTextEditingCard if can_edit_content', async () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, can_edit_content: true },
      })
      const result = await component.handleClick(e)
      expect(result).toBe(null)
      expect(uiStore.setTextEditingCard).toHaveBeenCalledWith(fakeCard, {
        hasTitleText: false,
      })
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
      item.content = '<p></p>'
      item.persisted = true
      item.API_updateWithoutSync = jest.fn()
    })

    describe('with content', () => {
      beforeEach(() => {
        item.content = '<p>some content</p>'
      })

      describe('with num_viewers === 1', () => {
        describe('with unpersisted item (for quick text creation)', () => {
          it('should not call API_updateWithoutSync', () => {
            item.persisted = false
            component.cancel({ item, ev: e })
            expect(item.API_updateWithoutSync).not.toHaveBeenCalled()
            // should clear out temp items
            expect(uiStore.clearTempTextCardItems).toHaveBeenCalled()
          })
        })

        describe('with item.persisted', () => {
          it('should call API_updateWithoutSync', () => {
            item.persisted = true
            component.cancel({ item, ev: e })
            expect(item.API_updateWithoutSync).toHaveBeenCalled()
          })
        })
      })

      describe('with num_viewers > 1', () => {
        it('should not call API_updateWithoutSync', () => {
          component.cancel({ item, ev: e, num_viewers: 2 })
          expect(item.API_updateWithoutSync).not.toHaveBeenCalled()
        })
      })
    })

    describe('with no content', () => {
      const card = { API_archiveSelf: jest.fn() }
      beforeEach(() => {
        item.content = ''
        item.version = null
        apiStore.find = jest.fn().mockReturnValue(card)
        card.API_archiveSelf.mockClear()
      })
      describe('and version === 1', () => {
        beforeEach(() => {
          item.version = 1
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
      describe('and a version > 1', () => {
        beforeEach(() => {
          item.version = 2
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
