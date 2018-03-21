import TagEditor from '~/ui/pages/shared/TagEditor'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeCollection
} from '#/mocks/data'

let wrapper, props, uiStore, record
describe('TagEditor', () => {
  beforeEach(() => {
    record = fakeCollection
    uiStore = fakeUiStore
    props = { record, uiStore }
    wrapper = shallow(
      <TagEditor.wrappedComponent {...props} />
    )
  })

  it('renders Modal', () => {
    expect(wrapper.find('Modal').exists()).toBe(true)
  })

  it('renders ReactTags', () => {
    expect(wrapper.find('ReactTags').exists()).toBe(true)
    expect(wrapper.find('ReactTags').props().tags.length).toEqual(record.tag_list.length)
    expect(wrapper.find('ReactTags').props().tags[0].name).toEqual(record.tag_list[0])
  })
})
