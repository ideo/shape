import TagEditor, { tagsInCommon } from '~/ui/pages/shared/TagEditor'
import { fakeCollection } from '#/mocks/data'

let wrapper, props, records, afterAddTag, afterRemoveTag
describe('TagEditor', () => {
  beforeEach(() => {
    records = [fakeCollection]
    afterAddTag = jest.fn()
    afterRemoveTag = jest.fn()
    props = {
      records,
      afterAddTag,
      afterRemoveTag,
      canEdit: true,
      tagField: 'tag_list',
    }
    wrapper = shallow(<TagEditor {...props} />)
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
    let records
    beforeEach(() => {
      records = [
        { tag_list: ['bananas', 'apples'] },
        { tag_list: ['peaches', 'bananas'] },
      ]
    })

    it('returns tags in common across records', () => {
      expect(tagsInCommon(records, 'tag_list')).toEqual(
        expect.arrayContaining(['bananas'])
      )
    })

    it('returns no intersection if a record has no tags', () => {
      records[0].tag_list = []
      expect(tagsInCommon(records, 'tag_list')).toEqual([])
    })
  })
})
