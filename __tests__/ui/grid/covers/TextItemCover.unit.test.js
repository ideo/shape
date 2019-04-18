import TextItemCover from '~/ui/grid/covers/TextItemCover'
import { apiStore, uiStore } from '~/stores'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

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

let wrapper, component
describe('TextItemCover', () => {
  beforeEach(() => {
    props.editable = false
    wrapper = shallow(<TextItemCover {...props} />)
    component = wrapper.instance()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders Quill with item.data_content', () => {
    expect(wrapper.find('Quill').props().value).toBe(item.data_content)
  })

  it('renders Read More if text height exceeds the viewable area', () => {
    const inst = wrapper.instance()
    inst.quillEditor = {
      getEditingArea: () => ({ offsetHeight: 900 }),
    }
    inst.componentDidMount()
    // force re-render to pick up state update
    wrapper.update()
    expect(wrapper.state().readMore).toBe(true)
    expect(wrapper.find('StyledReadMore').exists()).toBe(true)
  })

  it('does not render Read More if text height fits within the viewable area', () => {
    const inst = wrapper.instance()
    inst.quillEditor = {
      getEditingArea: () => ({ offsetHeight: 50 }),
    }
    inst.componentDidMount()
    wrapper.update()
    expect(wrapper.state().readMore).toBe(false)
    expect(wrapper.find('StyledReadMore').exists()).toBe(false)
  })

  describe('handleClick', () => {
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
  })
})
