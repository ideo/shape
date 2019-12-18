import SearchCollection from '~/ui/grid/SearchCollection'
import fakeUiStore from '#/mocks/fakeUiStore'
import { apiStore } from '~/stores'
import Factory from '#/factory'
import collectionCardJson from '#/factory/data/collection_card.json'

let collection
let wrapper, uiStore
let props, component, rerender

const defaultRequestData = {
  data: [],
  meta: { total_pages: 0 },
  links: { last: 0 },
}

beforeEach(async () => {
  apiStore.request = jest.fn()
  collection = await Factory.create(
    'collection',
    {
      name: 'Some collection',
      id: '2',
      class_type: 'Collection::SearchCollection',
    },
    apiStore
  )

  uiStore = fakeUiStore
  collection.search_term = 'plants'
  props = {
    uiStore,
    collection,
    trackCollectionUpdated: jest.fn(),
  }
  apiStore.request.mockReturnValue(Promise.resolve(defaultRequestData))
  rerender = () => {
    wrapper = shallow(<SearchCollection.wrappedComponent {...props} />)
    component = wrapper.instance()
  }
  rerender()
})

afterEach(async () => {
  apiStore.request.mockClear()
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
        apiStore.request.mockReturnValue(
          Promise.resolve({
            ...defaultRequestData,
            data: [collectionCardJson],
            meta: { total_pages: 1 },
          })
        )
        rerender()
        await wrapper.instance().componentDidMount()
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
      beforeEach(async () => {
        apiStore.request.mockReturnValue(Promise.resolve(defaultRequestData))
        rerender()
        await wrapper.instance().componentDidMount()
      })

      it('should render a second collection grid with text', () => {
        expect(wrapper.find('StyledDisplayText').exists()).toBe(true)
      })
    })
  })

  describe('componentDidMount()', () => {
    it('should load the searched cards', () => {
      expect(apiStore.request).toHaveBeenCalled()
      expect(apiStore.request).toHaveBeenCalledWith(
        expect.stringContaining('search_collection_cards')
      )
    })

    it('should send the search query to fetch the cards', () => {
      expect(apiStore.request).toHaveBeenCalledWith(
        expect.stringContaining('query=plants')
      )
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
      apiStore.request.mockReturnValue(
        Promise.resolve({
          ...defaultRequestData,
          data: [collectionCardJson],
          meta: { total_pages: 1 },
        })
      )
    })

    describe('when on the second page', () => {
      beforeEach(() => {
        component.loadSearchedCards({ page: 2, per_page: 40 })
      })

      it('should search for new results', () => {
        expect(apiStore.request).toHaveBeenCalled()
        expect(apiStore.request).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        )
      })
    })

    describe('when on the first page', () => {
      beforeEach(() => {
        component.loadSearchedCards({ page: 1, per_page: 40 })
      })

      it('should search for new results', () => {
        expect(apiStore.request).toHaveBeenCalled()
        expect(apiStore.request).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        )
      })
    })
  })
})
