import CollectionCoverTitle from '~/ui/grid/covers/CollectionCoverTitle'
import { fakeCollection } from '#/mocks/data'

const props = {
  collection: fakeCollection,
}
let wrapper

describe('CollectionTypeSelector', () => {
  beforeEach(() => {
    wrapper = shallow(<CollectionCoverTitle {...props} />)
  })

  it('renders the collection name', () => {
    expect(wrapper.text()).toContain(fakeCollection.name)
  })
})
