import SearchCollection from '~/ui/grid/SearchCollection'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { apiStore } from '~/stores'
import { fakeCollection } from '#/mocks/data'
import Factory from '#/factory'
import collectionCardJson from '#/factory/data/collection_card.json'

const collectionCards = []
let collection
let wrapper, uiStore
let props, component, rerender

beforeEach(async () => {
  apiStore.request = jest.fn()
  // const fakeApiStore = Object.assign({}, apiStore, {
  //   request: jest.fn(),
  // })
  collection = await Factory.create('collection', {
    name: 'Some collection',
    id: '2',
    class_type: 'Collection::SearchCollection',
  }, apiStore)

  uiStore = fakeUiStore
  collection.search_term = 'plants'
  props = {
    uiStore,
    collection,
    trackCollectionUpdated: jest.fn(),
  }
  apiStore.request.mockClear()
  apiStore.request.mockReturnValue(Promise.resolve([]))
  rerender = () => {
    wrapper = shallow(<SearchCollection.wrappedComponent {...props} />)
    component = wrapper.instance()
  }
  rerender()
})

describe('SearchCollection', () => {
  describe('render()', () => {
    it('should render a page separator', () => {
      expect(wrapper.find('PageSeparator').exists()).toBe(true)
    })

    describe('while loading', () => {
      beforeEach(async () => {
        component.loading = true
      })

      it('should render a loader', () => {
        expect(wrapper.find('Loader').exists()).toBe(true)
      })
    })

    describe('after loading search collection results', () => {
      beforeEach(async () => {
        component.loading = false
        wrapper.update()
      })

      it('should render a second collection grid', () => {
        expect(
          wrapper
            .find('CollectionGrid')
            .at(1)
            .exists()
        ).toBe(true)
      })
    })

    describe('after loading 0 search results', () => {
      beforeEach(() => {
        collection.searchResultsCollection.collection_cards = []
        rerender()
        component.loading = false
      })

      it('should render a second collection grid with text', () => {
        expect(wrapper.find('StyledDisplayText').exists()).toBe(true)
      })
    })
  })

  describe('componentDidMount()', () => {
    it('should load the searched cards', () => {
      expect(apiStore.request).toHaveBeenCalled()
      expect(apiStore.request).toHaveBeenCalledWith('organizations/5352/search_collection_cards?card_order=relevance&current_collection_id=762903&page=1&per_page=20&query=plants%20')
    })
  })

  describe('updateSearchTerm', () => {
    beforeEach(() => {
      collection.save = jest.fn().mockReturnValue(Promise.resolve())
      component._updateSearchTerm()
    })

    afterEach(() => {
      collection.save.mockRestore()
    })

    it('should save the collection', () => {
      expect(collection.save).toHaveBeenCalled()
    })

    it('should load the cards again', () => {
      expect(apiStore.request).toHaveBeenCalled()
    })
  })

  describe('loadSearchedCards', () => {
    beforeEach(() => {
      apiStore.request.mockReturnValue(Promise.resolve([
        collectionCardJson
      ]))
    })

    describe('when on a new page', () => {
      beforeEach(() => {
        component.loadSearchedCards({ page: 2, per_page: 40 })
      })

      it('should search for new results', () => {
        expect(apiStore.request).toHaveBeenCalled()
        expect(apiStore.request).toHaveBeenCalledWith('organizations/5352/search_collection_cards?card_order=relevance&current_collection_id=762903&page=1&per_page=20&query=plants%20')
      })
    })

    describe('when on the first page', () => {
      beforeEach(() => {
        component.loadSearchedCards({ page: 1, per_page: 40 })
      })

      it('should search for new results', () => {
        expect(apiStore.request).toHaveBeenCalled()
        expect(apiStore.request).toHaveBeenCalledWith('organizations/5352/search_collection_cards?card_order=relevance&current_collection_id=762903&page=1&per_page=20&query=plants%20')
      })
    })
  })
})
