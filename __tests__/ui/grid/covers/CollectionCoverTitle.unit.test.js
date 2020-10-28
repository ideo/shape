import CollectionCoverTitle from '~/ui/grid/covers/CollectionCoverTitle'
import { fakeCollection } from '#/mocks/data'

const props = {
  collection: fakeCollection,
  title: 'Hello Dolly',
}
let wrapper

describe('CollectionCoverTitle', () => {
  beforeEach(() => {
    wrapper = shallow(<CollectionCoverTitle {...props} />)
  })

  it('renders the collection name', () => {
    expect(wrapper.text()).toContain(props.title)
  })
})
