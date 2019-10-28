import TagEditor, { tagsInCommon } from '~/ui/pages/shared/TagEditor'
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

  describe('tagsInCommon', () => {
    it('returns tags in common across records', () => {
      const records = [
        { tag_list: ['bananas', 'apples'] },
        { tag_list: ['peaches', 'bananas'] },
      ]
      expect(tagsInCommon(records, 'tag_list')).toEqual(
        expect.arrayContaining(['bananas'])
      )

      // Alter so first record is empty
      records[0].tag_list = []

      expect(tagsInCommon(records, 'tag_list')).toEqual([])
    })
  })
})
