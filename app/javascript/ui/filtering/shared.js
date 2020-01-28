import TagIcon from '~/ui/icons/TagIcon'
import SearchIconRight from '~/ui/icons/SearchIconRight'
import { creativeDifferenceTagIcon } from '~/ui/pages/shared/StyledReactTags'
import { creativeQualities } from '~/utils/creativeDifferenceVariables'

const filterSymbol = filter => {
  if (filter.filter_type === 'tag') {
    return creativeDifferenceTagIcon(filter.text) || <TagIcon />
  }
  return <SearchIconRight />
}

const color = tagName => {
  const creativeQuality = creativeQualities[tagName.toLowerCase()]
  return creativeQuality ? creativeQuality.color : null
}

export const filtersToTags = ({ filters, onSelect, onDelete } = {}) => {
  return filters.map(filter => {
    const tag = {
      id: filter.id,
      type: 'tag',
      name: filter.text,
      label: filter.text,
      symbol: filterSymbol(filter),
      color: color(filter.text),
      selectable: true,
      selected: filter.selected,
      deletable: filter.deletable || !!onDelete,
    }
    tag.onDelete = () => onDelete && onDelete(tag)
    tag.onSelect = () => onSelect && onSelect(tag)
    return tag
  })
}
