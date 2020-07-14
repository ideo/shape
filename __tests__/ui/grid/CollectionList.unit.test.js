import CollectionList from '~/ui/grid/CollectionList'
import ListCard from '~/ui/grid/ListCard'
import { uiStore } from '~/stores'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const collection = fakeCollection

let wrapper, component, props, render

describe('CollectionList', () => {
  beforeEach(() => {
    props = {
      collection,
      loadCollectionCards: jest.fn(),
    }
    render = () => {
      // make sortedCards different from collection.collection_cards for tests below
      collection.sortedCards = [
        { ...fakeCollectionCard, id: '10' },
        { ...fakeCollectionCard, id: '20' },
      ]
      collection.collection_cards = [
        { ...fakeCollectionCard, id: '10' },
        { ...fakeCollectionCard, id: '40' },
        { ...fakeCollectionCard, id: '50' },
      ]
      uiStore.viewingCollection = collection
      wrapper = shallow(<CollectionList {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  describe('componentDidMount()', () => {
    it('should fetch the card roles', () => {
      expect(collection.API_fetchCardRoles).toHaveBeenCalled()
    })
  })

  describe('render()', () => {
    it('should render the columns', () => {
      const columns = wrapper.find('[data-cy="ListColumn"]')
      expect(columns.length).toEqual(5)
      expect(component.columns.map(c => c.name)).toEqual([
        'select',
        'name',
        'last_updated',
        'permissions',
        'actions',
      ])
    })

    it('should render each row using collection.sortedCards', () => {
      const cards = wrapper.find(ListCard)
      expect(cards.length).toEqual(collection.sortedCards.length)
      expect(cards.map(c => c.props().card)).toEqual(collection.sortedCards)
    })

    it('should not render GridCardPagination by default', () => {
      expect(wrapper.find('GridCardPagination').exists()).toBe(false)
    })

    describe('when collection.hasMore', () => {
      beforeEach(() => {
        props.collection.hasMore = true
        props.collection.nextPage = 2
        render()
      })

      it('renders GridCardPagination', () => {
        expect(wrapper.find('GridCardPagination').exists()).toBe(true)
        expect(
          wrapper.find('GridCardPagination').props().loadCollectionCards
        ).toEqual(props.loadCollectionCards)
      })
    })

    describe('with a searchResultsCollection', () => {
      beforeEach(() => {
        props.collection.isSearchResultsCollection = true
        render()
      })

      it('should render each row using collection.collection_cards', () => {
        const cards = wrapper.find(ListCard)
        expect(cards.length).toEqual(collection.collection_cards.length)
        expect(cards.map(c => c.props().card)).toEqual(
          collection.collection_cards
        )
      })
    })

    describe('if a submissions collection inside a challenge', () => {
      beforeEach(() => {
        props.collection.isSubmissionsCollectionInsideChallenge = true
        props.collection.submission_box_type = 'template'
        render()
      })

      it('should render the columns', () => {
        const columns = wrapper.find('[data-cy="ListColumn"]')
        expect(columns.length).toEqual(5)
        expect(component.columns.map(c => c.name)).toEqual([
          'select',
          'name',
          'last_updated',
          'reviewers',
          'actions',
        ])
      })
    })

    describe('on mobile', () => {
      beforeEach(() => {
        uiStore.isMobile = true
        render()
      })

      it('should render only the mobile columns', () => {
        const columns = wrapper.find('[data-cy="ListColumn"]')
        expect(columns.length).toEqual(3)
        expect(component.columns.map(c => c.name)).toEqual([
          'select',
          'name',
          'actions',
        ])
      })
    })
  })
})
