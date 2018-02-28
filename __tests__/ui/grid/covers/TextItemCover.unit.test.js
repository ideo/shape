import TextItemCover from '~/ui/items/TextItem'

import {
  fakeTextItem,
} from '#/mocks/data'

const item = fakeTextItem
const props = {
  item,
}

let wrapper
describe('TextItemCover', () => {
  beforeEach(() => {
    props.editable = false
    wrapper = shallow(
      <TextItemCover {...props} />
    )
  })

  it('renders Quill with item.text_data', () => {
    expect(wrapper.find('Quill').props().value).toBe(item.text_data)
  })
})
