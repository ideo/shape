import fetchMock from 'fetch-mock'
import { updateModelId } from 'datx'

import { apiStore } from '~/stores'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import Collection from '~/stores/jsonApi/Collection'
import objectAssignDeep from '~/vendor/object-assign-deep'
import sleep from '~/utils/sleep'

global.IdeoSSO = {
  baseApiUrl: 'ideosso.com',
  profileUrl: 'ideosso.com',
}

describe('Filtering', function() {
  // TODO factory here
  const currentOrganization = {
    id: '1',
    type: 'organizations',
    attributes: {
      active_users_count: 502,
      has_payment_method: true,
      in_app_billing: true,
      name: 'Test Inc',
      price_per_user: 5,
      slug: 'test',
      trial_users_count: 25,
    },
  }
  // TODO factory here
  const currentUser = {
    id: '22',
    type: 'users',
    attributes: {
      first_name: 'Tim',
      last_name: 'Tester',
      email: 'ttester@ideo.com',
      created_at: '2018-03-22T18:18:03.756Z',
      status: 'active',
      handle: 'ttest',
      shape_circle_member: false,
      pic_url_square:
        'https://d278pcsqxz7fg5.cloudfront.net/assets/users/avatars/00ue7vtfoyXqL3a2Q0h7/square-1559174855.jpg',
      user_profile_collection_id: '5215',
      terms_accepted: true,
      notify_through_email: true,
      show_helper: false,
      show_move_helper: false,
      show_template_helper: false,
      mailing_list: false,
      feedback_contact_preference: 'feedback_contact_yes',
      feedback_terms_accepted: true,
      respondent_terms_accepted: true,
      current_user_collection_id: '84',
      is_super_admin: false,
      current_incentive_balance: 0,
      incentive_due_date: null,
    },
    relationships: {
      current_organization: { data: { type: 'organizations', id: '1' } },
      organizations: {
        data: [{ type: 'organizations', id: '1' }],
      },
      groups: {
        data: [{ type: 'groups', id: '1' }, { type: 'groups', id: '27' }],
      },
    },
  }

  apiStore.add(currentOrganization, 'organizations')
  apiStore.add(currentUser, 'users')
  apiStore.currentUserId = '22'
  apiStore.currentUserOrganizationId = currentOrganization.id

  // TODO factory here
  const genericFilterData = {
    id: '4',
    type: 'collection_filters',
    attributes: {
      filter_type: 'search',
      selected: true,
      text: 'general',
    },
  }
  const genericFilter = apiStore.add(genericFilterData, 'collection_filters')

  // TODO factory here
  // This could also be done like above with JSON data, add to store, and get
  // store result out, putting that as the prop, wouldn't need updateModelId
  const collection = new Collection(
    {
      name: 'Some collection',
      can_edit: true,
      can_edit_content: true,
      can_view: true,
      card_order: 'order',
      class_type: 'Collection',
      collection_card_count: 2,
      frontend_url: 'http://localhost:3000/ideo/collections/333690',
      launchable: true,
      organization_id: '1',
      test_status: 'draft',
      collection_to_test_id: null,
      is_submission_box_template_test: false,
      collection_filters: [],
    },
    apiStore
  )
  updateModelId(collection, '2')
  const props = {
    collection: collection,
    canEdit: true,
  }
  const wrapper = mount(<CollectionFilter {...props} />)

  fetchMock.get(
    '/api/v1/organizations/1/tags',
    ['plant', 'biopsy', 'soylent'],
    { name: 'getOrganizationTags' }
  )

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

// Generic things that could be useful
// - a response wrapper, that takes a store model and spits out it's response
// with modified attributes that you want
//   fetchMock.post('/collection_filters/1/unselect,
//   jsonApiRes(filter, { selected: false }))
//
// - Factorys for store models
//   const collection = CollectionFactory({ id: 3, name: 'My Name' })
//
// - Setup our base API route (/api/v1/) for all fetchMock calls
//
// - Easily get params for a fetchMock call
