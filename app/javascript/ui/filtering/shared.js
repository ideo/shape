import TagIcon from '~/ui/icons/TagIcon'
import SearchIconRight from '~/ui/icons/SearchIconRight'
import { creativeDifferenceTagIcon } from '~/ui/pages/shared/StyledReactTags'

const symbolAndSize = filter => {
  let size = 16
  let symbol
  if (filter.filter_type === 'tag') {
    const cDeltaIcon = creativeDifferenceTagIcon(filter.text)
    if (cDeltaIcon) {
      symbol = cDeltaIcon
      size = 20
    } else {
      symbol = <TagIcon />
    }
  }
  if (!symbol) symbol = <SearchIconRight />
  return { symbol, size }
}

export const filtersToTags = ({ filters, onSelect, onDelete }) => {
  return filters.map(filter => {
    const { symbol, size } = symbolAndSize(filter)
    const tag = {
      id: filter.id,
      type: 'tag',
      name: filter.text,
      label: filter.text,
      symbol: symbol,
      symbolSize: size,
      selectable: true,
      selected: filter.selected,
    }
    tag.onDelete = () => onDelete && onDelete(tag)
    tag.onSelect = () => onSelect && onSelect(tag)
    return tag
  })
}
