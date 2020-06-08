import BctButton from '~/ui/global/BctButton'
import styled from 'styled-components'
import _ from 'lodash'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'

import v from '~/utils/variables'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import { ThumbnailHolder } from '~/ui/threads/CommentThumbnail'

const SubmissionBoxRow = styled(Row)`
  ${props => props.clickable && 'cursor: pointer;'}
  font-family: ${v.fonts.sans};
  transition: background-color 0.3s;
  padding: 0.5rem 0;
  &:hover {
    background: ${v.colors.commonLightest};
  }
  &.selected {
    background: ${v.colors.primaryLight};
  }
`
SubmissionBoxRow.displayName = 'SubmissionBoxRow'

const SubmissionBoxRowText = styled(RowItemLeft)`
  padding-top: 0.75rem;
`
SubmissionBoxRowText.displayName = 'SubmissionBoxRowText'

export const SubmissionBoxRowForItem = ({
  type,
  onSelect,
  rightSideComponent,
}) => {
  const { name, Icon } = type
  return (
    <SubmissionBoxRow
      key={name}
      noSpacing
      clickable={!!onSelect}
      onClick={() => onSelect && onSelect(name)}
    >
      <BctButton>
        <Icon />
      </BctButton>
      <SubmissionBoxRowText>{_.startCase(name)} Item</SubmissionBoxRowText>
      {rightSideComponent}
    </SubmissionBoxRow>
  )
}

SubmissionBoxRowForItem.propTypes = {
  type: PropTypes.exact({
    name: PropTypes.string,
    Icon: PropTypes.func,
  }).isRequired,
  onSelect: PropTypes.func,
  rightSideComponent: PropTypes.node,
}

SubmissionBoxRowForItem.defaultProps = {
  onSelect: () => null,
  rightSideComponent: <span />,
}

export const SubmissionBoxRowForTemplate = ({
  template,
  onSelect,
  rightSideComponent,
}) => {
  return (
    <SubmissionBoxRow
      key={template.id}
      noSpacing
      clickable={!!onSelect}
      onClick={() => onSelect && onSelect(template)}
    >
      <ThumbnailHolder>
        {template.cover.image_url && (
          <img src={template.cover.image_url} alt={template.name} />
        )}
        {!template.cover.image_url && <TemplateIcon circled filled />}
      </ThumbnailHolder>
      <SubmissionBoxRowText>{template.name}</SubmissionBoxRowText>
      {rightSideComponent}
    </SubmissionBoxRow>
  )
}

SubmissionBoxRowForTemplate.propTypes = {
  template: MobxPropTypes.objectOrObservableObject.isRequired,
  onSelect: PropTypes.func,
  rightSideComponent: PropTypes.node,
}

SubmissionBoxRowForTemplate.defaultProps = {
  onSelect: null,
  rightSideComponent: <span />,
}
