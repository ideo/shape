import { BctButton } from '~/ui/grid/shared'
import styled from 'styled-components'
import _ from 'lodash'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'

import v from '~/utils/variables'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import { ThumbnailHolder } from '~/ui/threads/CommentThumbnail'

const SubmissionBoxRow = styled(Row)`
  cursor: pointer;
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
const SubmissionBoxRowText = styled(RowItemLeft)`
  padding-top: 0.75rem;
`

export const SubmissionBoxRowForItem = props => {
  const { type, onChooseType } = props
  const { name, Icon } = type
  return (
    <SubmissionBoxRow
      key={name}
      noSpacing
      onClick={() => onChooseType && onChooseType(name)}
    >
      <BctButton>
        <Icon />
      </BctButton>
      <SubmissionBoxRowText>{_.startCase(name)} Item</SubmissionBoxRowText>
    </SubmissionBoxRow>
  )
}

SubmissionBoxRowForItem.propTypes = {
  type: PropTypes.exact({
    name: PropTypes.string,
    Icon: PropTypes.node,
  }).isRequired,
  onChooseType: PropTypes.func,
}

SubmissionBoxRowForItem.defaultProps = {
  onChooseType: () => null,
}

export const SubmissionBoxRowForTemplate = props => {
  const { template, onChooseTemplate } = props
  return (
    <SubmissionBoxRow
      key={template.id}
      noSpacing
      onClick={() => onChooseTemplate && onChooseTemplate(template)}
    >
      <ThumbnailHolder>
        {template.cover.image_url && (
          <img src={template.cover.image_url} alt={template.name} />
        )}
        {!template.cover.image_url && <TemplateIcon circled filled />}
      </ThumbnailHolder>
      <SubmissionBoxRowText>{template.name}</SubmissionBoxRowText>
    </SubmissionBoxRow>
  )
}

SubmissionBoxRowForTemplate.propTypes = {
  template: MobxPropTypes.objectOrObservableObject.isRequired,
  onChooseTemplate: PropTypes.func,
}

SubmissionBoxRowForTemplate.defaultProps = {
  onChooseTemplate: () => null,
}
