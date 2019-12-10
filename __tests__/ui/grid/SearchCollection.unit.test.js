import SearchCollection from '~/ui/grid/SearchCollection'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const collection = Object.assign({}, fakeCollection, {isSearchCollection: true })
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
        component.searchCollectionCards = [{id: 1}]
        wrapper.update()
      })

      it('should render a second collection grid', () => {
        expect(wrapper.find('CollectionGrid').at(1).exists()).toBe(true)
      })
    })

    describe('after loading 0 search results', () => {
      beforeEach(async () => {
        component.loading = false
        component.searchCollectionCards = []
        wrapper.update()
      })

      it('should render a second collection grid', () => {
        expect(wrapper.find('StyledDisplayText').exists()).toBe(true)
      })
    })
  })

  describe('componentDidMount()', () => {
    it('should load the searched cards', () => {
      expect(collection.API_fetchCards).toHaveBeenCalled()
      expect(collection.API_fetchCards).toHaveBeenCalledWith({
        searchTerm: 'plants',
        page: undefined,
        per_page: 40,
      })
    })
  })

  describe('updateSearchTerm', () => {
    beforeEach(() => {
      component._updateSearchTerm()
    })

    it('should save the collection', () => {
      expect(collection.save).toHaveBeenCalled()
    })

    it('should load the cards again', () => {
      expect(collection.API_fetchCards).toHaveBeenCalled()
    })
  })

  describe('loadSearchedCards', () => {
    let searchCards =[]
    beforeEach(() => {
      searchCards = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]
      collection.API_fetchCards.mockReturnValue(Promise.resolve(searchCards))
    })

    describe('when on a new page', () => {
      beforeEach(() => {
        component.searchCollectionCards = [{ id: 6}]
        component.loadSearchedCards({ page: 2, per_page: 40 })
      })

      it('should add the results to the search collection cards', () => {
        expect(component.searchCollectionCards.length).toEqual(5)
      })
    })

    describe('when on the first page', () => {
      beforeEach(() => {
        component.searchCollectionCards = [{ id: 1 }]
        component.loadSearchedCards({ page: 0, per_page: 40 })
      })

      it('should set the search collection cards to the results', () => {
        expect(component.searchCollectionCards.length).toEqual(4)
      })
    })
  })
})
