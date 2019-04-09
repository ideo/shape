import CollectionPage from '~/ui/pages/CollectionPage'
import ChannelManager from '~/utils/ChannelManager'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import fakeUndoStore from '#/mocks/fakeUndoStore'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/ChannelManager')
jest.mock('../../../app/javascript/stores')

const collections = [
  Object.assign({}, fakeCollection, { id: 1 }),
  Object.assign({}, fakeCollection, { id: 2 }),
  Object.assign({}, fakeCollection, { id: 3 }),
]
const collection = collections[0]
let wrapper, apiStore, uiStore, routingStore, undoStore
let props, component

beforeEach(() => {
  apiStore = fakeApiStore({
    findResult: collection,
    findAllResult: collections,
    requestResult: { data: collection },
  })
  apiStore.collections = collections
  uiStore = fakeUiStore
  routingStore = fakeRoutingStore
  undoStore = fakeUndoStore
  props = {
    apiStore,
    uiStore,
    routingStore,
    undoStore,
    collection,
    isHomepage: false,
  }
  collection.API_fetchCards.mockClear()
  wrapper = shallow(<CollectionPage.wrappedComponent {...props} />)
  component = wrapper.instance()
})

describe('CollectionPage', () => {
  it('passes collection to the CollectionGrid', () => {
    const grid = wrapper.find('CollectionGrid')
    expect(grid.props().collection).toBe(collection)
  })

  describe('componentDidUpdate()', () => {
    describe('on a different collection', () => {
      beforeEach(() => {
        wrapper.setProps({
          collection: { ...collection, id: 99 },
        })
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

      it('should reload the data', () => {
        expect(collection.API_fetchCards).toHaveBeenCalled()
        expect(component.cardsFetched).toBe(true)
      })
    })
  })

  describe('updateCollection', () => {
    beforeEach(() => {
      wrapper.instance().updateCollection()
    })

    it('should update the collection cards through api', () => {
      expect(collection.API_updateCard).toHaveBeenCalled()
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
        wrapper.setProps({
          collection: { ...collection, id: 99 },
        })
        wrapper
          .instance()
          .receivedChannelData({ record_id: 99, current_editor: {} })
        wrapper.instance().reloadData.flush()
      })

      it('should reload the data', () => {
        expect(collection.API_fetchCards).toHaveBeenCalledWith({
          per_page: collection.collection_cards.length,
        })
      })
    })
  })

  describe('with params ?open=comments', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          routingStore={{
            ...routingStore,
            query: '?open=comments',
          }}
        />
      )
    })

    it('should call uiStore to open the comments', () => {
      expect(uiStore.openOptionalMenus).toHaveBeenCalledWith('?open=comments')
    })
  })

  describe('with undoAfterRoute', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          undoStore={{
            ...undoStore,
            undoAfterRoute: 'do something',
          }}
        />
      )
    })

    it('should call undoStore to perform the action', () => {
      expect(undoStore.performUndoAfterRoute).toHaveBeenCalled()
    })
  })
})
