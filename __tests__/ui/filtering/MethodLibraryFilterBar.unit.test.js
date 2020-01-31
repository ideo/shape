import MethodLibraryFilterBar from '~/ui/filtering/MethodLibraryFilterBar'
import { fakeCollectionFilter } from '#/mocks/data'
import {
  methodLibraryTagsByType,
  methodLibraryTags,
  creativeQualities,
} from '~/utils/creativeDifferenceVariables'

let wrapper, rerender, props

describe('MethodLibraryFilterBar', () => {
  beforeEach(() => {
    // Setup all filters that are present on the method library
    props = {
      filters: methodLibraryTags.map(tag => ({
        ...fakeCollectionFilter,
        text: tag,
      })),
      onSelect: jest.fn(),
    }
    rerender = function() {
      wrapper = shallow(<MethodLibraryFilterBar {...props} />)
      return wrapper
    }
    rerender()
  })

  it('renders popout menus with correct items', () => {
    let allQualities = []
    const qualitiesData = [...creativeQualities.entries()]
    qualitiesData.forEach(([quality, qualityData]) => {
      allQualities = [...allQualities, quality, ...qualityData.subqualities]
    })

    expect(
      wrapper
        .find('.PopoutMenu-subqualities')
        .props()
        .menuItems.map(tag => tag.name)
        .sort()
    ).toEqual(allQualities.sort())

    expect(
      wrapper
        .find('.PopoutMenu-categories')
        .props()
        .menuItems.map(tag => tag.name)
    ).toEqual(methodLibraryTagsByType.categories)

    expect(
      wrapper
        .find('.PopoutMenu-types')
        .props()
        .menuItems.map(tag => tag.name)
    ).toEqual(methodLibraryTagsByType.types)
  })

  it('renders creative qualities as pills', () => {
    expect(
      wrapper
        .find('.creativeQualityTags')
        .props()
        .itemList.map(tag => tag.name)
    ).toEqual([...creativeQualities.keys()])
  })
})
