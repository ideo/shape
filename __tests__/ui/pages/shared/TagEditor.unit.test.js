import TagEditor from '~/ui/pages/shared/TagEditor'
import { fakeCollection } from '#/mocks/data'

let wrapper, props, record, component
describe('TagEditor', () => {
  beforeEach(() => {
    record = fakeCollection
    props = {
      record,
      canEdit: true,
      tagField: 'tag_list',
    }
    wrapper = shallow(<TagEditor {...props} />)
    component = wrapper.instance()
  })

  it('renders ReactTags with record[tagField]', () => {
    expect(wrapper.find('ReactTags').exists()).toBe(true)
    expect(wrapper.find('ReactTags').props().tags.length).toEqual(
      record.tag_list.length
    )
    expect(wrapper.find('ReactTags').props().tags[0].name).toEqual(
      record.tag_list[0]
    )
  })

  it('calls the patch method to save the model', () => {
    component._saveTags()
    expect(record.patch).toHaveBeenCalled()
  })
})
