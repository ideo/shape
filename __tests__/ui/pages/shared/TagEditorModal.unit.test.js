import TagEditorModal from '~/ui/pages/shared/TagEditorModal'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeCollection
} from '#/mocks/data'

let wrapper, props, uiStore, record
describe('TagEditorModal', () => {
  beforeEach(() => {
    record = fakeCollection
    uiStore = fakeUiStore
    props = { record, uiStore, canEdit: true }

    wrapper = shallow(
      <TagEditorModal.wrappedComponent {...props} />
    )
    wrapper.instance()
  })

  it('renders Modal', () => {
    expect(wrapper.find('Modal').exists()).toBe(true)
  })

  it('renders TagEditor', () => {
    expect(wrapper.find('TagEditor').exists()).toBe(true)
  })
})
