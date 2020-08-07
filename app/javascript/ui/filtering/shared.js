import TagIcon from '~/ui/icons/TagIcon'
import SearchIconRight from '~/ui/icons/SearchIconRight'
import { creativeDifferenceTagIcon } from '~/ui/pages/shared/StyledReactTags'
import { allQualityColors } from '~/utils/creativeDifferenceVariables'

const filterSymbol = filter => {
  if (filter.filter_type === 'tag') {
    return creativeDifferenceTagIcon(filter.text) || <TagIcon />
  }
  return <SearchIconRight />
}

const color = tagName => {
  return allQualityColors[tagName.toLowerCase()]
}

export const filtersToTags = ({
  filters,
  onSelect,
  onDelete,
  disabled,
} = {}) => {
  return filters.map(filter => {
    const tag = {
      id: filter.id,
      type: 'tag',
      name: filter.text,
      label: filter.text,
      symbol: filterSymbol(filter),
      color: color(filter.text),
      selectable: true,
      disabled,
      selected: filter.selected,
    }
    tag.onDelete = () => onDelete && onDelete(tag)
    tag.onSelect = () => onSelect && onSelect(tag)
    return tag
  })
}
