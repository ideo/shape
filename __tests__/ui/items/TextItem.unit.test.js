import TextItem from '~/ui/items/TextItem'

import {
  fakeTextItem,
} from '#/mocks/data'

const props = {
  item: fakeTextItem,
}

let wrapper
describe('TextItem', () => {
  describe('general usage', () => {
    beforeEach(() => {
      wrapper = shallow(
        <TextItem {...props} />
      )
    })

    it('renders the Quill editor', () => {
      expect(wrapper.find('Quill').exists()).toBe(true)
    })

    it('passes the text content to Quill', () => {
      expect(wrapper.find('Quill').props().value).toEqual(fakeTextItem.text_data)
    })
  })

  describe('readOnly', () => {
    beforeEach(() => {
      props.editable = false
      wrapper = shallow(
        <TextItem {...props} />
      )
    })

    it('does not render the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(false)
    })
  })

  describe('editable', () => {
    beforeEach(() => {
      props.editable = true
      props.item.parentPath = '/collections/99'
      wrapper = shallow(
        <TextItem {...props} />
      )
    })

    it('renders the TextItemToolbar', () => {
      expect(wrapper.find('TextItemToolbar').exists()).toBe(true)
    })
  })
})
