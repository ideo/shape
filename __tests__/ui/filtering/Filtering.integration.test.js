import fetchMock from 'fetch-mock'
import { updateModelId } from 'datx'

import { apiStore } from '~/stores'
import Factory from '#/factory'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
// import Collection from '~/stores/jsonApi/Collection'
import objectAssignDeep from '~/vendor/object-assign-deep'
import sleep from '~/utils/sleep'

global.IdeoSSO = {
  baseApiUrl: 'ideosso.com',
  profileUrl: 'ideosso.com',
}

describe('Filtering', function() {
  let currentOrganization,
    currentUser,
    genericFilter,
    collection,
    props,
    wrapper

  fetchMock.get(
    '/api/v1/organizations/2/tags',
    ['plant', 'biopsy', 'soylent'],
    { name: 'getOrganizationTags' }
  )

  beforeAll(async () => {
    currentOrganization = await Factory.create('organization', { id: '1' })
    currentUser = await Factory.create('user', { id: '22' })
    // apiStore.add(currentOrganization, 'organizations')
    // apiStore.add(currentUser, 'users')
    apiStore.currentUserId = '22'
    apiStore.currentUserOrganizationId = currentOrganization.id

    genericFilter = await Factory.create('collection_filter', {
      id: '4',
      filter_type: 'search',
      selected: true,
      text: 'general',
    })

    collection = await Factory.create('collection', {
      name: 'Some collection',
      id: '2',
    })
    props = {
      collection: collection,
      canEdit: true,
    }
    wrapper = mount(<CollectionFilter {...props} />)
  })

  it('should render the collection filter', () => {
    expect(wrapper.length).toBe(1)
  })

  it('should render the filter holder', () => {
    const filterMenu = wrapper.find('FilterMenu')
    expect(filterMenu.exists()).toBe(true)
  })

  describe('opening the search modal', () => {
    describe('on FilterMenu click', () => {
      const fakeEv = { preventDefault: jest.fn() }
      let filterMenu, filterSearchModal, popout

      beforeEach(() => {
        filterMenu = wrapper.find('FilterMenu')
        const filterMenuButton = filterMenu.find(
          '[data-cy="filterMenu-button"]'
        )
        filterMenuButton.simulate('click', fakeEv)
        filterMenu.setState({ filterDropdownOpen: true })
        filterMenu.update()
        popout = filterMenu.find('PopoutMenu')
      })

      it('should open the type of filter dropdown', () => {
        popout.update()
        // expect(popout.props().menuOpen).toBe(true)
      })

      describe('on filtering by tag', () => {
        beforeEach(() => {
          popout
            .find('.menu-filter-by-tag')
            .first()
            .simulate('click', fakeEv)
        })

        it('should open the search modal', () => {
          filterSearchModal = wrapper.find('FilterSearchModal')
          expect(filterSearchModal.props().modalOpen).toBe(true)
          expect(
            filterSearchModal
              .find('Modal')
              .first()
              .props().title
          ).toEqual('Filter by Tags')
        })
      })

      describe('on filtering by search', () => {
        beforeEach(() => {
          popout
            .find('.menu-filter-by-search-term')
            .first()
            .simulate('click', fakeEv)
        })

        it('should open the search modal', () => {
          filterSearchModal = wrapper.find('FilterSearchModal')
          expect(filterSearchModal.props().modalOpen).toBe(true)
          expect(
            filterSearchModal
              .find('Modal')
              .first()
              .props().title
          ).toEqual('Filter by Search Term')
        })
      })
    })
  })

  describe('adding a tag filter', () => {
    let filterSearchModal

    beforeAll(() => {
      fetchMock.get(
        `/api/v1/collections/${collection.id}/collection_cards?page=1&per_page=50`,
        [],
        { name: 'getCollectionCards' }
      )
      fetchMock.post(
        `/api/v1/collections/${collection.id}/collection_filters/`,
        collection, // same collection with filters
        { name: 'postCollectionFilters' }
      )
    })

    beforeEach(async () => {
      // Manually set the filter type as the filter menu tested separately
      wrapper.instance().currentFilterLookupType = 'Tags'
      wrapper.update()
      filterSearchModal = wrapper.find('FilterSearchModal')

      // This test has to dig into the instance to call a method because
      // otherwise it would have to interact with ReactTags API, which is
      // not our own
      filterSearchModal.instance().onNewTag({ name: 'plant' })
      await sleep(1)
    })

    afterEach(fetchMock.resetHistory)

    afterAll(fetchMock.reset)

    it('should get all the org tags from the backend', () => {
      expect(fetchMock.called('getOrganizationTags')).toBe(true)
    })

    it('should have a tags ui', () => {
      expect(filterSearchModal.find('ReactTags').exists()).toBe(true)
    })

    it('should create a collection filter with a post request', () => {
      const createFilterCall = fetchMock.calls('postCollectionFilters')[0][1]
      expect(fetchMock.called('postCollectionFilters')).toBe(true)
      const params = JSON.parse(createFilterCall.body)
      expect(params.filter_type).toEqual('tag')
      expect(params.text).toEqual('plant')
    })

    it('should request collection cards with the new filters', () => {
      expect(fetchMock.called('getCollectionCards')).toBe(true)
    })
  })

  describe('removing a tag filter', () => {
    let filterSearchModal

    beforeAll(() => {
      const filterAData = {
        id: '3',
        type: 'collection_filters',
        attributes: {
          filter_type: 'tag',
          selected: false,
          text: 'goo',
        },
      }
      const filterA = apiStore.add(filterAData, 'collection_filters')
      props.collection.collection_filters.push(filterA)
      props.collection.collection_filters.push(genericFilter)

      const collectionCardsEndpoint = `/api/v1/collections/${collection.id}/collection_cards?page=1&per_page=50`
      fetchMock.get(`${collectionCardsEndpoint}`, [])
      fetchMock.get(`${collectionCardsEndpoint}&q=${genericFilter.text}`, [], {
        name: 'getCollectionCards',
      })
      fetchMock.delete(
        `/api/v1/collections/${collection.id}/collection_filters/3`,
        collection, // same collection with filters
        { name: 'deleteCollectionFilter' }
      )
    })

    beforeEach(async () => {
      // Manually set the filter type as the filter menu tested separately
      wrapper.instance().currentFilterLookupType = 'Search Term'
      wrapper.update()
      filterSearchModal = wrapper.find('FilterSearchModal')
      await sleep(1)

      filterSearchModal.instance().onRemoveTag({ id: '3', name: 'goo' })()
      await sleep(1)
    })

    afterAll(fetchMock.reset)

    afterEach(() => {
      fetchMock.resetHistory
      props.collection.collection_filters = []
    })

    it('should remove the tag from the backend with a delete request', () => {
      expect(fetchMock.called('deleteCollectionFilter')).toBe(true)
    })

    it('should request collection cards with the new filters', () => {
      expect(fetchMock.called('getCollectionCards')).toBe(true)
    })
  })

  describe('on (un)selecting a filter', () => {
    let pill, checkbox

    const filterResponse = selected => ({
      data: objectAssignDeep({}, genericFilterData, {
        attributes: { selected },
      }),
    })

    beforeAll(async () => {
      props.collection.collection_filters.push(genericFilter)

      const collectionCardsEndpoint = `/api/v1/collections/${collection.id}/collection_cards?page=1&per_page=50`
      fetchMock.get(`${collectionCardsEndpoint}`, [], {
        name: 'getCollectionCardsUnfiltered',
      })
      fetchMock.get(`${collectionCardsEndpoint}&q=${genericFilter.text}`, [], {
        name: 'getCollectionCardsFiltered',
      })
      fetchMock.post(
        `/api/v1/collection_filters/${genericFilter.id}/unselect`,
        filterResponse(false),
        { name: 'unselectCollectionFilter' }
      )
      fetchMock.post(
        `/api/v1/collection_filters/${genericFilter.id}/select`,
        filterResponse(true),
        { name: 'selectCollectionFilter' }
      )
      wrapper.update()
      await sleep(1)
      pill = wrapper
        .find('FilterBar')
        .find('Pill')
        .first()
    })

    afterAll(fetchMock.reset)

    describe('when unselecting', () => {
      beforeAll(async () => {
        checkbox = pill.find('Checkbox').find('input')
        checkbox.simulate('change', { target: { checked: false } })
        await sleep(1)
      })

      afterAll(fetchMock.resetHistory)

      it('should unselect the filter through the API', () => {
        expect(fetchMock.called('unselectCollectionFilter')).toBe(true)
      })

      it('should query collection cards without that filter', () => {
        expect(fetchMock.called('getCollectionCardsUnfiltered')).toBe(true)
      })
    })

    describe('when selecting', () => {
      beforeAll(async () => {
        checkbox = pill.find('Checkbox').find('input')
        checkbox.simulate('change', { target: { checked: true } })
        await sleep(1)
      })

      afterAll(fetchMock.resetHistory)

      it('should select the filter through the API', () => {
        expect(fetchMock.called('selectCollectionFilter')).toBe(true)
      })

      it('should query collection cards with that filter', () => {
        expect(fetchMock.called('getCollectionCardsFiltered')).toBe(true)
      })
    })
  })
})
