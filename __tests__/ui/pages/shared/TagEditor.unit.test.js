import TagEditor from '~/ui/pages/shared/TagEditor'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection } from '#/mocks/data'

let wrapper, props, records, afterAddTag, afterRemoveTag
describe('TagEditor', () => {
  beforeEach(() => {
    records = [fakeCollection]
    afterAddTag = jest.fn()
    afterRemoveTag = jest.fn()
    const apiStore = fakeApiStore()
    props = {
      records,
      afterAddTag,
      afterRemoveTag,
      apiStore,
      canEdit: true,
      tagField: 'tag_list',
    }
    wrapper = shallow(<TagEditor.wrappedComponent {...props} />)
  })

  it('renders ReactTags with records[tagField]', () => {
    expect(wrapper.find('ReactTags').exists()).toBe(true)
    expect(wrapper.find('ReactTags').props().tags.length).toEqual(
      records[0].tag_list.length
    )
    expect(wrapper.find('ReactTags').props().tags[0].name).toEqual(
      records[0].tag_list[0]
    )
  })
})
