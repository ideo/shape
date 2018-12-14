import SearchResultsInfinite from '~/ui/search/SearchResultsInfinite'
import {
  fakeCollection,
  fakeLinkItem,
  fakeTextItem,
  fakeVideoItem,
} from '#/mocks/data'

let wrapper, props

beforeEach(() => {
  props = {
    searchResults: [
      fakeCollection,
      fakeTextItem,
      fakeVideoItem,
      fakeCollection,
      fakeLinkItem,
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
    expect(wrapper.find('StyledSearchResult').length).toEqual(5)
    expect(wrapper.find('GridCard').length).toEqual(5)
    const gridCards = [
      wrapper.find('GridCard').at(0),
      wrapper.find('GridCard').at(1),
      wrapper.find('GridCard').at(2),
    ]
    expect(gridCards[0].props().record).toEqual(fakeCollection)
    expect(gridCards[0].props().searchResult).toEqual(true)
    expect(gridCards[1].props().record).toEqual(fakeTextItem)
    expect(gridCards[2].props().record).toEqual(fakeVideoItem)
  })
})
