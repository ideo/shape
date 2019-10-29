import CollectionCardsTagEditorModal from '~/ui/pages/shared/CollectionCardsTagEditorModal'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard } from '#/mocks/data'

let wrapper, props
describe('CollectionCardsTagEditorModal', () => {
  beforeEach(() => {
    const cards = [fakeCollectionCard]
    const uiStore = fakeUiStore
    props = { cards, uiStore, canEdit: true }
    wrapper = shallow(
      <CollectionCardsTagEditorModal.wrappedComponent {...props} />
    )
    wrapper.instance()
  })

  it('renders Modal', () => {
    expect(wrapper.find('Modal').exists()).toBe(true)
  })

  it('renders wrapped CollectionCardsTagEditor', () => {
    expect(
      wrapper.find('inject-CollectionCardsTagEditor-with-apiStore').exists()
    ).toBe(true)
  })
})
