import TextItemCover from '~/ui/grid/covers/TextItemCover'
import { uiStore } from '~/stores'

import { fakeTextItem } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores/index')

const item = fakeTextItem
const props = {
  item,
  dragging: false,
  height: 200,
  cardId: '1',
  handleClick: jest.fn(),
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

  it('renders Quill with item.text_data', () => {
    expect(wrapper.find('Quill').props().value).toBe(item.text_data)
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
    it('returns false if you are dragging', () => {
      wrapper.setProps({ dragging: true })
      expect(component.handleClick(e)).toBe(false)
    })

    it("returns false if you can't edit content", () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, can_edit_content: false },
      })
      expect(component.handleClick(e)).toBe(false)
    })

    it('returns false if searchResult is true', () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, searchResult: true },
      })
      expect(component.handleClick(e)).toBe(false)
    })

    it('calls uiStore.update textEditingItem if can_edit_content', () => {
      wrapper.setProps({
        dragging: false,
        item: { ...item, can_edit_content: true },
      })
      expect(component.handleClick(e)).toBe(null)
      expect(uiStore.update).toHaveBeenCalledWith(
        'textEditingItem',
        expect.any(Object)
      )
    })
  })
})
