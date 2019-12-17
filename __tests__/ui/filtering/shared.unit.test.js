import { filtersToTags } from '~/ui/filtering/shared'
import TagIcon from '~/ui/icons/TagIcon'
import CreativeDifferenceLogoSmall from '~/ui/icons/CreativeDifferenceLogoSmall'
import { fakeCollectionFilter } from '#/mocks/data'

let tags, onDelete, onSelect
describe('filtersToTags', () => {
  beforeEach(() => {
    onDelete = () => 'onDelete'
    onSelect = () => 'onSelect'
    tags = filtersToTags({
      filters: [fakeCollectionFilter],
      onDelete,
      onSelect,
    })
  })

  it('returns a tag-like object', () => {
    expect(tags.length).toEqual(1)
    expect(tags[0]).toEqual(
      expect.objectContaining({
        id: fakeCollectionFilter.id,
        type: 'tag',
        name: fakeCollectionFilter.text,
        label: fakeCollectionFilter.text,
        symbol: <TagIcon />,
        selectable: true,
        selected: fakeCollectionFilter.selected,
      })
    )
  })

  it('returns CQ symbol if it matches a CQ name', () => {
    const cqTag = fakeCollectionFilter
    cqTag.text = 'Purpose'
    tags = filtersToTags({ filters: [cqTag] })
    expect(tags[0].symbol).toEqual(<CreativeDifferenceLogoSmall />)
  })
})
