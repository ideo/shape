import CollectionCardsTagEditor from '~/ui/pages/shared/CollectionCardsTagEditor'
import TagEditor from '~/ui/pages/shared/TagEditor.js'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'

let wrapper, props, collection, component, apiStore
describe('CollectionCardsTagEditor', () => {
  beforeEach(() => {
    collection = fakeCollection
    const cards = [fakeCollectionCard]
    cards[0].record = collection
    apiStore = fakeApiStore()
    props = { cards, apiStore, canEdit: true }

    wrapper = shallow(<CollectionCardsTagEditor.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('renders wrapped TagEditor', () => {
    expect(wrapper.find(TagEditor).exists()).toBe(true)
  })

  it('passes collection card records to tag editor', () => {
    expect(wrapper.find(TagEditor).props().records).toEqual([collection])
  })

  describe('addTag', () => {
    it('requests collection_cards/add_tag', () => {
      component.addTag('llamas')
      expect(apiStore.request).toHaveBeenCalledWith(
        'collection_cards/add_tag',
        'PATCH',
        {
          card_ids: [fakeCollectionCard.id],
          tag: 'llamas',
        }
      )
    })
  })

  describe('removeTag', () => {
    it('requests collection_cards/remove_tag', () => {
      component.removeTag('pajamas')
      expect(apiStore.request).toHaveBeenCalledWith(
        'collection_cards/remove_tag',
        'PATCH',
        {
          card_ids: [fakeCollectionCard.id],
          tag: 'pajamas',
        }
      )
    })
  })
})
