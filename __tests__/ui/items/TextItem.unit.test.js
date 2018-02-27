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

  it('renders the Quill editor', () => {
    expect(wrapper.find('Quill').exists()).toBe(true)
  })

  it('passes the text content to Quill', () => {
    expect(wrapper.find('Quill').props().value).toEqual(fakeTextItem.text_data)
  })
})
