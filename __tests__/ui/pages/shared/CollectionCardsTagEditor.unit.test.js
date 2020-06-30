import CollectionCardsTagEditor, {
  formatRecordTags,
} from '~/ui/pages/shared/CollectionCardsTagEditor'
import TagEditor from '~/ui/pages/shared/TagEditor.js'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'

let wrapper, props, records, cardIds, component, apiStore
describe('CollectionCardsTagEditor', () => {
  beforeEach(() => {
    records = [fakeCollection]
    fakeCollectionCard.record = fakeCollection
    cardIds = [fakeCollectionCard.id]
    apiStore = fakeApiStore()
    props = {
      records,
      apiStore,
      canEdit: true,
      cardIds,
      suggestions: [],
      handleInputChange: jest.fn(),
    }

    wrapper = shallow(<CollectionCardsTagEditor.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('renders wrapped TagEditor', () => {
    expect(wrapper.find(TagEditor).exists()).toBe(true)
  })

  it('passes record tags to tag editor', () => {
    expect(wrapper.find(TagEditor).props().recordTags).toEqual(
      formatRecordTags(records)
    )
  })

  describe('addTag', () => {
    it('requests collection_cards/add_tag', () => {
      component.addTag({ label: 'llamas', type: 'tag_list' })
      expect(apiStore.request).toHaveBeenCalledWith(
        'collection_cards/add_tag',
        'PATCH',
        {
          card_ids: cardIds,
          tag: 'llamas',
          type: 'tag_list',
        }
      )
    })
  })

  describe('removeTag', () => {
    it('requests collection_cards/remove_tag', () => {
      component.removeTag({ label: 'pajamas', type: 'tag_list' })
      expect(apiStore.request).toHaveBeenCalledWith(
        'collection_cards/remove_tag',
        'PATCH',
        {
          card_ids: cardIds,
          tag: 'pajamas',
          type: 'tag_list',
        }
      )
    })
  })
})
