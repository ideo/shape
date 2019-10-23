import CollectionCardsTagEditor from '~/ui/pages/shared/CollectionCardsTagEditor'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'

let wrapper, props, collection
describe('CollectionCardsTagEditor', () => {
  beforeEach(() => {
    collection = fakeCollection
    const cards = [fakeCollectionCard]
    cards[0].record = collection
    const apiStore = fakeApiStore()
    props = { cards, apiStore, canEdit: true }

    wrapper = shallow(<CollectionCardsTagEditor.wrappedComponent {...props} />)
    wrapper.instance()
  })

  it('renders wrapped TagEditor', () => {
    expect(wrapper.find('inject-TagEditor-with-apiStore').exists()).toBe(true)
  })

  it('passes collection card records to tag editor', () => {
    expect(
      wrapper.find('inject-TagEditor-with-apiStore').props().records
    ).toEqual([collection])
  })
})
