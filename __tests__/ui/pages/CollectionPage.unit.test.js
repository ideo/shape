import CollectionPage from '~/ui/pages/CollectionPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import {
  fakeCollection
} from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const id = 1
const collections = [
  Object.assign({}, fakeCollection, { id: 1 }),
  Object.assign({}, fakeCollection, { id: 2 }),
  Object.assign({}, fakeCollection, { id: 3 }),
]
const collection = collections[0]
let wrapper, match, apiStore, uiStore, routingStore
let props

beforeEach(() => {
  apiStore = fakeApiStore({
    findResult: collection,
    findAllResult: collections,
    requestResult: { data: collection }
  })
  apiStore.collections = collections
  uiStore = fakeUiStore
  routingStore = fakeRoutingStore
  match = { params: { id, org: apiStore.currentOrgSlug }, path: '/collections/1', url: '/collections/1' }
  props = {
    apiStore,
    uiStore,
    routingStore,
    match,
    location: { search: '' },
  }

  wrapper = shallow(
    <CollectionPage.wrappedComponent {...props} />
  )
})

describe('CollectionPage', () => {
  it('makes an API call to fetch the collection', () => {
    expect(apiStore.request).toBeCalledWith(`collections/${match.params.id}`)
    expect(apiStore.find).toBeCalledWith('collections', match.params.id)
  })

  it('passes collection to the CollectionGrid', () => {
    const grid = wrapper.find('CollectionGrid')
    expect(grid.props().collection).toBe(collection)
  })

  // this is a function in PageWithApi
  describe('checkOrg', () => {
    describe('when the route match.params.org does not match apiStore.currentOrgSlug', () => {
      beforeEach(() => {
        props.match.params.org = 'different-slug'
        wrapper = shallow(
          <CollectionPage.wrappedComponent {...props} />
        )
      })

      it('calls routingStore to make sure /:org namespace is in the path', () => {
        expect(apiStore.currentUser.switchOrganization).toHaveBeenCalledWith(
          'different-slug',
          { redirectPath: routingStore.location.pathname }
        )
      })
    })
    describe('when the route does not have match.params.org', () => {
      beforeEach(() => {
        props.match.params.org = null
        wrapper = shallow(
          <CollectionPage.wrappedComponent {...props} />
        )
      })

      it('calls routingStore to make sure /:org namespace is in the path', () => {
        expect(routingStore.routeTo).toHaveBeenCalledWith(
          `/${apiStore.currentOrgSlug}${routingStore.location.pathname}`
        )
      })
    })
  })

  describe('updateCollectionName', () => {
    beforeEach(() => {
      wrapper.instance().updateCollectionName('great')
    })

    it('should set the collection name to passed in value', () => {
      expect(collection.name).toEqual('great')
    })

    it('should track an event for updating the collection', () => {
      expect(uiStore.trackEvent).toHaveBeenCalledWith('update', collection)
    })
  })

  describe('updateCollection', () => {
    beforeEach(() => {
      wrapper.instance().updateCollection()
    })

    it('should update the collection cards through api', () => {
      expect(collection.API_updateCards).toHaveBeenCalled()
    })

    it('should track an event for updating the collection', () => {
      expect(uiStore.trackEvent).toHaveBeenCalledWith('update', collection)
    })
  })

  describe('with params ?open=comments', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent {...props} location={{ search: '?open=comments' }} />
      )
    })

    it('should call uiStore to open the comments', () => {
      expect(uiStore.openOptionalMenus).toHaveBeenCalledWith('?open=comments')
    })
  })
})
