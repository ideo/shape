import TagEditor from '~/ui/pages/shared/TagEditor'

let wrapper, props, recordTags, afterAddTag, afterRemoveTag
describe('TagEditor', () => {
  describe('with tag list', () => {
    beforeEach(() => {
      afterAddTag = jest.fn()
      afterRemoveTag = jest.fn()
      recordTags = [
        { label: 'paper', type: 'tag_list' },
        { label: 'box', type: 'tag_list' },
      ]
      props = {
        recordTags,
        afterAddTag,
        afterRemoveTag,
        canEdit: true,
        tagField: 'tag_list',
      }
      wrapper = shallow(<TagEditor {...props} />)
    })

    it('renders ReactTags with tags', () => {
      expect(wrapper.find('ReactTags').exists()).toBe(true)
      expect(wrapper.find('ReactTags').props().tags.length).toEqual(
        recordTags.length
      )
      expect(wrapper.find('ReactTags').props().tags[0].name).toEqual(
        recordTags[0].label
      )
    })
  })

  describe('with user tag list', () => {
    beforeEach(() => {
      afterAddTag = jest.fn()
      afterRemoveTag = jest.fn()
      recordTags = [{ label: 'msegreto', type: 'user_tag_list' }]
      props = {
        recordTags,
        afterAddTag,
        afterRemoveTag,
        canEdit: true,
        tagField: 'tag_list',
      }
      wrapper = shallow(<TagEditor {...props} />)
    })

    it('renders ReactTags with tags and avatar', () => {
      expect(wrapper.find('ReactTags').exists()).toBe(true)
      expect(wrapper.find('ReactTags').props().tags.length).toEqual(
        recordTags.length
      )
      expect(wrapper.find('ReactTags').props().tags[0].name).toEqual(
        recordTags[0].label
      )
      expect(wrapper.find('ReactTags').props().symbol).toBeTruthy()
    })
  })
})
