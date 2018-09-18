import TextItemCover from '~/ui/grid/covers/TextItemCover'

import { fakeTextItem } from '#/mocks/data'

const item = fakeTextItem
const props = {
  item,
  height: 200,
}

let wrapper
describe('TextItemCover', () => {
  beforeEach(() => {
    props.editable = false
    wrapper = shallow(<TextItemCover {...props} />)
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
})
