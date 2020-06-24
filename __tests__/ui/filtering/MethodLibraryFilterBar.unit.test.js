import { shuffle } from 'lodash'
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
      wrapper = shallow(<MethodLibraryFilterBar {...props} usePortal={false} />)
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
    ).toEqual(allQualities) // Expected array order

    expect(
      wrapper
        .find('.PopoutMenu-categories')
        .props()
        .menuItems.map(tag => tag.name)
        .sort()
    ).toEqual(methodLibraryTagsByType.categories.sort()) // Expected alphabetical order

    expect(
      wrapper
        .find('.PopoutMenu-types')
        .props()
        .menuItems.map(tag => tag.name)
    ).toEqual(methodLibraryTagsByType.types.sort()) // Expected alphabetical order
  })

  it('renders creative qualities as pills', () => {
    expect(
      wrapper
        .find('.creativeQualityTags')
        .props()
        .itemList.map(tag => tag.name) // Expected array order
    ).toEqual([...creativeQualities.keys()])
  })

  describe('with collection filters in random order', () => {
    beforeEach(() => {
      props = {
        filters: shuffle(methodLibraryTags).map(tag => ({
          ...fakeCollectionFilter,
          text: tag,
        })),
        onSelect: jest.fn(),
      }
      rerender()
    })

    it('renders creative qualities in correct order', () => {
      expect(
        wrapper
          .find('.creativeQualityTags')
          .props()
          .itemList.map(tag => tag.name)
      ).toEqual([...creativeQualities.keys()])
    })
  })
})
