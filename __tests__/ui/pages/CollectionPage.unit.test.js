import { animateScroll } from 'react-scroll'
import CollectionPage from '~/ui/pages/CollectionPage'
import ChannelManager from '~/utils/ChannelManager'
import SearchCollection from '~/ui/grid/SearchCollection'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import fakeUndoStore from '#/mocks/fakeUndoStore'
import { fakeCollection, fakeUser } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/ChannelManager')
jest.mock('../../../app/javascript/stores')
jest.mock('react-scroll')

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
  uiStore.update.mockClear()
  wrapper = shallow(<CollectionPage.wrappedComponent {...props} />)
  component = wrapper.instance()
})

describe('CollectionPage', () => {
  it('passes collection to the CollectionGrid', () => {
    const grid = wrapper.find('CollectionGrid')
    expect(grid.props().collection).toBe(collection)
  })

  it('passes the loadCollectionCards pagination function to the CollectionGrid', () => {
    const grid = wrapper.find('CollectionGrid')
    expect(grid.props().loadCollectionCards).toEqual(
      component.loadCollectionCards
    )
  })

  it('renders a <Helmet> with the pageTitle', () => {
    const helmet = wrapper.find('HelmetWrapper')
    expect(helmet.props().title).toBe(collection.pageTitle)
  })

  it('calls apiStore.setupCommentThreadAndMenusForPage', () => {
    expect(apiStore.setupCommentThreadAndMenusForPage).toHaveBeenCalledWith(
      collection
    )
  })

  describe('with a non-board collection', () => {
    it('calls API_fetchCards on initialLoad', () => {
      expect(collection.API_fetchCards).toHaveBeenCalled()
      expect(uiStore.update).toHaveBeenCalledWith('isLoading', true)
    })
  })

  describe('with a board collection', () => {
    beforeEach(() => {
      collection.API_fetchCards.mockClear()
      uiStore.update.mockClear()
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          collection={{ ...collection, isBoard: true }}
        />
      )
    })

    it('does not call API_fetchCards on initialLoad', () => {
      expect(collection.API_fetchCards).not.toHaveBeenCalled()
      expect(uiStore.update).not.toHaveBeenCalledWith('isLoading', true)
    })
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

      it('should setupCommentThreadAndMenusForPage', () => {
        expect(apiStore.setupCommentThreadAndMenusForPage).toHaveBeenCalledWith(
          collection
        )
      })

      it('should have a different viewingRecord', () => {
        expect(uiStore.setViewingRecord).toHaveBeenCalled()
      })

      it('should scroll check to update scroll state', () => {
        expect(routingStore.toPathScrollY).toHaveBeenCalledWith(collection.id)
        expect(routingStore.updateScrollState).toHaveBeenCalledWith(
          collection.id,
          0
        )
      })
    })
  })

  describe('clicked search but cancelled it', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          routingStore={{
            ...routingStore,
            previousPageBeforeSearch: `/ideo/collections/${collection.id}`,
            location: {
              pathname: `/ideo/collections/${collection.id}`,
            },
          }}
        />
      )
    })

    it('should scroll to previous scroll position', () => {
      expect(animateScroll.scrollTo).toHaveBeenCalled()
    })
  })

  describe('click from breadcrumb', () => {
    const childCollection = {
      ...collection[2],
      breadcrumb: [collection],
    }
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          uiStore={{
            ...uiStore,
            previousViewingRecord: childCollection,
          }}
        />
      )
    })

    it('should scroll to previous scroll position', () => {
      expect(uiStore.linkedBreadcrumbTrailForRecord).toHaveBeenCalled()
      expect(routingStore.toPathScrollY).toHaveBeenCalled()
      expect(animateScroll.scrollTo).toHaveBeenCalled()
    })
  })

  describe('move back or forward via history', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          routingStore={{
            ...routingStore,
            history: {
              action: 'POP',
            },
          }}
        />
      )
    })

    it('should scroll to previous scroll position', () => {
      expect(routingStore.toPathScrollY).toHaveBeenCalled()
      expect(animateScroll.scrollTo).toHaveBeenCalled()
    })
  })

  describe('trackCollectionUpdated', () => {
    beforeEach(() => {
      wrapper.instance().trackCollectionUpdated()
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
      const loadedRows = 8
      beforeEach(() => {
        wrapper.setProps({
          collection: {
            ...collection,
            isBoard: true,
            id: 99,
            loadedRows,
          },
        })
        wrapper.instance().receivedChannelData({
          record_id: 99,
          current_editor: {},
          collaborators: [fakeUser],
        })
        wrapper.instance().reloadData.flush()
      })

      it('should reload the data', () => {
        expect(collection.refetch).toHaveBeenCalled()
        expect(collection.API_fetchCards).toHaveBeenCalledWith({
          rows: [0, loadedRows],
        })
      })

      it('should update realtime collaborators', () => {
        expect(collection.setCollaborators).toHaveBeenCalledWith([fakeUser])
      })
    })
  })

  describe('with undoAfterRoute', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          undoStore={{
            ...undoStore,
            actionAfterRoute: { do: 'something' },
          }}
        />
      )
      component = wrapper.instance()
      component.loadCollectionCards()
    })

    it('should clear out collection cards on loadCollectionCards', () => {
      expect(props.collection.clearCollectionCards).toHaveBeenCalled()
    })

    it('should call undoStore to perform the action', () => {
      expect(undoStore.performActionAfterRoute).toHaveBeenCalled()
    })
  })

  describe('with actionAfterRoute', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          uiStore={{
            ...uiStore,
            actionAfterRoute: () => 'do something',
          }}
        />
      )
    })

    it('should call uiStore to perform the action', () => {
      expect(uiStore.performActionAfterRoute).toHaveBeenCalled()
    })
  })

  describe('with search collection', () => {
    beforeEach(() => {
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          collection={{
            ...fakeCollection,
            isSearchCollection: true,
          }}
        />
      )
      component = wrapper.instance()
    })

    it('should render the SearchCollection', () => {
      expect(wrapper.find(SearchCollection).exists()).toBe(true)
    })
  })

  describe('with SubmissionBox and submissions', () => {
    const submissions_collection = {
      id: 100,
      collection_cards: [],
      cardProperties: [],
      view_mode: 'grid',
      isSubmissionsCollectionInsideChallenge: true,
      API_fetchCards: jest.fn().mockReturnValue(Promise.resolve({})),
      API_fetchCardReviewerStatuses: jest
        .fn()
        .mockReturnValue(Promise.resolve({})),
    }
    beforeEach(() => {
      props.apiStore.currentUser = fakeUser
      wrapper = shallow(
        <CollectionPage.wrappedComponent
          {...props}
          collection={{
            ...fakeCollection,
            submissionTypeName: 'Submission',
            isSubmissionBox: true,
            submission_box_type: 'template',
            submissions_enabled: true,
            submission_template: { id: '123' },
            submissions_collection,
          }}
        />
      )
      component = wrapper.instance()
    })

    it('should render a second CollectionGrid for the submissions', () => {
      expect(wrapper.find('PageSeparator').exists()).toBe(true)
      expect(wrapper.find('CollectionGrid').length).toEqual(2)
    })

    it('should render FloatingActionButton', () => {
      expect(wrapper.find('FloatingActionButton').exists()).toBe(true)
    })

    it('should pass the right props to the SubmissionCollection', () => {
      // should be the second grid
      const collectionGrid = wrapper.find('CollectionGrid').get(0)
      const submissionsGrid = wrapper.find('CollectionGrid').get(1)
      expect(submissionsGrid.props.submissionSettings).toEqual({
        type: 'template',
        template: { id: '123' },
        enabled: true,
      })
      expect(collectionGrid.props.loadCollectionCards).toEqual(
        component.loadCollectionCards
      )
      // submissionsCollection specific pagination method
      expect(submissionsGrid.props.loadCollectionCards).toEqual(
        component.loadSubmissionsCollectionCards
      )
    })

    it('should call API_fetchCardReviewerStatuses if inside challenge', async () => {
      const params = { page: 1, per_page: 10 }
      await component.loadSubmissionsCollectionCards(params)
      expect(submissions_collection.API_fetchCards).toHaveBeenCalledWith(params)
      expect(
        submissions_collection.API_fetchCardReviewerStatuses
      ).toHaveBeenCalled()
    })
  })

  describe('with challenge submission', () => {
    beforeEach(() => {
      wrapper.setProps({
        collection: {
          ...collection,
          showSubmissionTopicSuggestions: true,
          parentChallenge: {
            ...collection,
            topic_list: ['apples', 'bananas'],
          },
        },
      })
    })

    it('shows suggested tags banner', () => {
      expect(wrapper.find('SuggestedTagsBanner').exists()).toBe(true)
      expect(wrapper.find('SuggestedTagsBanner').props().suggestions).toEqual([
        'apples',
        'bananas',
      ])
    })
  })
})
