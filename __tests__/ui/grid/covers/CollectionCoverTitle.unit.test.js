import CollectionCoverTitle from '~/ui/grid/covers/CollectionCoverTitle'
import { fakeCollection } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const props = {
  collection: fakeCollection,
}
let wrapper

describe('CollectionTypeSelector', () => {
  beforeEach(() => {
    wrapper = shallow(<CollectionCoverTitle {...props} />)
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders the collection name', () => {
    expect(wrapper.text()).toContain(fakeCollection.name)
  })
})
