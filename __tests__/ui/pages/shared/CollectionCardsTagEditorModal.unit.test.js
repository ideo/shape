import CollectionCardsTagEditorModal from '~/ui/pages/shared/CollectionCardsTagEditorModal'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

let wrapper, props
describe('CollectionCardsTagEditorModal', () => {
  beforeEach(() => {
    fakeCollectionCard.record = fakeCollection
    const cards = [fakeCollectionCard]
    const cardIds = [fakeCollectionCard.id]
    const uiStore = fakeUiStore
    const apiStore = fakeApiStore()
    props = { cards, uiStore, apiStore, canEdit: true, cardIds }
    wrapper = shallow(
      <CollectionCardsTagEditorModal.wrappedComponent {...props} />
    )
  })

  it('renders Modal', () => {
    expect(wrapper.find('Modal').exists()).toBe(true)
  })

  it('renders wrapped CollectionCardsTagEditor', () => {
    expect(wrapper.find('CollectionCardsTagEditor').exists()).toBe(true)
  })
})
