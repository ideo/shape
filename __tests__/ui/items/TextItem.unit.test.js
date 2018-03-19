import TextItem from '~/ui/items/TextItem'

import {
  fakeTextItem,
} from '#/mocks/data'

const props = {
  item: fakeTextItem,
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

  describe('as viewer', () => {
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
  })

  describe('as editor', () => {
    beforeEach(() => {
      props.item.can_edit = true
      props.item.parentPath = '/collections/99'
      wrapper = shallow(
        <TextItem {...props} />
      )
    })

    it('renders the Quill editor', () => {
      expect(wrapper.find('Quill').exists()).toBe(true)
      expect(wrapper.find('Quill').props().readOnly).toBeUndefined()
    })

    it('renders the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(true)
    })
  })
})
