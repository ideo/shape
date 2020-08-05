import SearchCollection from '~/ui/grid/SearchCollection'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const collection = Object.assign({}, fakeCollection, {
  isSearchCollection: true,
  searchResultsCollection: Object.assign({}, fakeCollection, {
    isSearchResultsCollection: true,
  }),
})
const collectionCards = []
let wrapper, uiStore
let props, component, rerender

beforeEach(() => {
  uiStore = fakeUiStore
  collection.search_term = 'plants'
  props = {
    uiStore,
    collection,
    trackCollectionUpdated: jest.fn(),
  }
  collection.API_fetchCards.mockClear()
  collection.API_fetchCards.mockReturnValue(Promise.resolve(collectionCards))
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
        collection.API_fetchCards.mockClear()
        component.loading = true
      })

      it('should render a loader', () => {
        expect(wrapper.find('Loader').exists()).toBe(true)
      })
    })

    describe('after loading search collection results', () => {
      beforeEach(async () => {
        component.loading = false
        collection.searchResultsCollection.collection_cards = [{ id: 1 }]
        wrapper.update()
      })

      it('should render a second foamcore grid', () => {
        const foamcoreGrid = wrapper.find('FoamcoreGrid').at(0)
        expect(foamcoreGrid.exists()).toBe(true)
        expect(foamcoreGrid.props().collection).toEqual(
          collection.searchResultsCollection
        )
        expect(foamcoreGrid.props().renderOnly).toBe(true)
      })

      describe('with both collections as board', () => {
        beforeEach(() => {
          collection.isBoard = true
          rerender()
        })

        it('should render a second foamcore grid', () => {
          const foamcoreGrid = wrapper.find('FoamcoreGrid').at(1)
          expect(foamcoreGrid.exists()).toBe(true)
        })
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
      expect(collection.API_fetchCards).toHaveBeenCalled()
      expect(collection.API_fetchCards).toHaveBeenCalledWith({
        searchTerm: 'plants',
        page: 1,
        per_page: 20,
      })
    })
  })

  describe('updateSearchTerm', () => {
    beforeEach(() => {
      component.updateSearchTerm('broccoli')
    })

    it('should save the collection', () => {
      expect(collection.search_term).toEqual('broccoli')
      expect(collection.patch).toHaveBeenCalled()
    })

    it('should load the cards again', () => {
      expect(collection.API_fetchCards).toHaveBeenCalled()
    })
  })

  describe('loadSearchedCards', () => {
    beforeEach(() => {
      collection.searchResultsCollection.API_fetchCards.mockReturnValue(
        Promise.resolve([{ id: 1 }])
      )
    })

    describe('when on a new page', () => {
      beforeEach(() => {
        collection.searchResultsCollection.collection_cards = [{ id: 6 }]
        component.loadSearchedCards({ page: 2, per_page: 40 })
      })

      it('should search for new results', () => {
        expect(
          collection.searchResultsCollection.API_fetchCards
        ).toHaveBeenCalled()
        expect(
          collection.searchResultsCollection.API_fetchCards
        ).toHaveBeenCalledWith({
          searchTerm: 'plants',
          page: 2,
          per_page: 20,
        })
      })
    })

    describe('when on the first page', () => {
      beforeEach(() => {
        collection.searchResultsCollection.collection_cards = [{ id: 1 }]
        component.loadSearchedCards({ page: 1, per_page: 40 })
      })

      it('should search for new results', () => {
        expect(
          collection.searchResultsCollection.API_fetchCards
        ).toHaveBeenCalled()
        expect(
          collection.searchResultsCollection.API_fetchCards
        ).toHaveBeenCalledWith({
          searchTerm: 'plants',
          page: 1,
          per_page: 20,
        })
      })
    })
  })
})
