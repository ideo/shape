import CollectionList from '~/ui/grid/CollectionList'
import ListCard from '~/ui/grid/ListCard'
import { uiStore } from '~/stores'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const collection = fakeCollection
let wrapper, component, props, render

describe('CollectionList', () => {
  beforeEach(() => {
    props = {
      collection,
    }
    render = () => {
      uiStore.viewingCollection = collection
      wrapper = shallow(<CollectionList {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  describe('componentDidMount()', () => {
    it('should fetch the cards', () => {
      expect(collection.API_fetchCards).toHaveBeenCalled()
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

    it('should render a row for each card', () => {
      const cards = wrapper.find(ListCard)
      expect(cards.length).toEqual(collection.collection_cards.length)
    })
  })
})
