import SearchResultsInfinite from '~/ui/search/SearchResultsInfinite'
import { fakeCollection, fakeVideoItem, fakeTextItem } from '#/mocks/data'

let wrapper, props

beforeEach(() => {
  props = {
    searchResults: [
      fakeCollection,
      fakeCollection,
      fakeTextItem,
      fakeVideoItem,
    ],
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
    expect(wrapper.find('StyledSearchResult').length).toEqual(4)
    expect(
      wrapper
        .find('CollectionCover')
        .at(0)
        .props().collection
    ).toEqual(fakeCollection)
    expect(
      wrapper
        .find('GridCard')
        .at(0)
        .props().record
    ).toEqual(fakeTextItem)
    expect(
      wrapper
        .find('GridCard')
        .at(1)
        .props().record
    ).toEqual(fakeVideoItem)
  })

  it('routes to collection on click', () => {
    wrapper
      .find('CollectionCover')
      .at(0)
      .simulate('click')
    expect(props.routeTo).toBeCalledWith('collections', fakeCollection.id)
  })
})
