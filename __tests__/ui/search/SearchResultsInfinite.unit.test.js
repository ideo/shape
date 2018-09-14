import SearchResultsInfinite from '~/ui/search/SearchResultsInfinite'
import { fakeCollection } from '#/mocks/data'

let wrapper, props

beforeEach(() => {
  props = {
    searchResults: [fakeCollection, fakeCollection],
    gridSettings: { cols: 4 },
    gridMaxW: 100,
    hasMore: false,
    total: 10,
    loadMore: jest.fn(),
    routeTo: jest.fn(),
  }

  wrapper = shallow(<SearchResultsInfinite {...props} />)
})

describe('SearchResultsInfinite', () => {
  it('displays the search results', () => {
    expect(wrapper.find('StyledSearchResult').length).toEqual(2)
    expect(
      wrapper
        .find('CollectionCover')
        .at(0)
        .props().collection
    ).toEqual(fakeCollection)
  })

  it('routes to collection on click', () => {
    wrapper
      .find('CollectionCover')
      .at(0)
      .simulate('click')
    expect(props.routeTo).toBeCalledWith('collections', fakeCollection.id)
  })
})
