import TagIcon from '~/ui/icons/TagIcon'
import SearchIconRight from '~/ui/icons/SearchIconRight'
import { creativeDifferenceTagIcon } from '~/ui/pages/shared/StyledReactTags'

const filterSymbol = filter => {
  if (filter.filter_type === 'tag') {
    return creativeDifferenceTagIcon(filter.text) || <TagIcon />
  }
  return <SearchIconRight />
}

export const filtersToTags = ({ filters, onSelect, onDelete }) => {
  return filters.map(filter => {
    const tag = {
      id: filter.id,
      type: 'tag',
      name: filter.text,
      label: filter.text,
      symbol: filterSymbol(filter),
      selectable: true,
      selected: filter.selected,
    }
    tag.onDelete = () => onDelete && onDelete(tag)
    tag.onSelect = () => onSelect && onSelect(tag)
    return tag
  })
}
