import CollectionPage from '~/ui/pages/CollectionPage'
import ChannelManager from '~/utils/ChannelManager'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/ChannelManager')
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
    requestResult: { data: collection },
  })
  apiStore.collections = collections
  uiStore = fakeUiStore
  routingStore = fakeRoutingStore
  match = {
    params: { id, org: apiStore.currentOrgSlug },
    path: '/collections/1',
    url: '/collections/1',
  }
  props = {
    apiStore,
    uiStore,
    routingStore,
    match,
    location: { search: '' },
  }

  wrapper = shallow(<CollectionPage.wrappedComponent {...props} />)
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

  describe('componentWillReceiveProps()', () => {
    describe('on a different collection', () => {
      beforeEach(() => {
        match = {
          params: { id: 155 },
          path: '/collections/155',
          url: '/collections/155',
        }
        wrapper.setProps({ match })
      })

      it('should unsubscribe from all collection channels', () => {
        expect(ChannelManager.unsubscribeAllFromChannel).toHaveBeenCalledWith(
          'CollectionViewingChannel'
        )
      })

      it('should subscribe with the channel manager', () => {
        expect(ChannelManager.subscribe).toHaveBeenCalled()
      })

      it('should close the blank content tool', () => {
        expect(uiStore.closeBlankContentTool).toHaveBeenCalled()
      })
    })
  })

  // this is a function in PageWithApi
  describe('checkOrg', () => {
    describe('when the route match.params.org does not match apiStore.currentOrgSlug', () => {
      beforeEach(() => {
        props.match.params.org = 'different-slug'
        wrapper = shallow(<CollectionPage.wrappedComponent {...props} />)
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
        wrapper = shallow(<CollectionPage.wrappedComponent {...props} />)
      })

      it('calls routingStore to make sure /:org namespace is in the path', () => {
        expect(routingStore.routeTo).toHaveBeenCalledWith(
          `/${apiStore.currentOrgSlug}${routingStore.location.pathname}`
        )
      })
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

  describe('subscribeToChannel()', () => {
    it('should subscribe with the channel manager', () => {
      expect(ChannelManager.subscribe).toHaveBeenCalled()
    })
  })

  describe('receivedChannelData()', () => {
    describe('when an update happens on the current collection', () => {
      beforeEach(() => {
        props.match.params.id = 15
        wrapper.setProps(props)
        wrapper.instance().receivedChannelData({ record_id: 15 })
      })

      it('should reload the data', () => {
        expect(apiStore.request).toHaveBeenCalled()
      })
    })
  })

  describe('with params ?open=comments', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          location={{ search: '?open=comments' }}
        />
      )
    })

    it('should call uiStore to open the comments', () => {
      expect(uiStore.openOptionalMenus).toHaveBeenCalledWith('?open=comments')
    })
  })
})
