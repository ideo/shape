import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import EditableName from '~/ui/pages/shared/EditableName'
import v from '~/utils/variables'
import CollectionDateRange from '~/ui/grid/CollectionDateRange'
import { ThumbnailHolder } from '~/ui/threads/CommentThumbnail'
import PhaseIcon from '~/ui/icons/collection_icons/PhaseIcon'
import {
  DisplayTextCss,
  DisplayText,
  SmallHelperText,
} from '~/ui/global/styled/typography'
import { Row, RowItemLeft, RowItemRight } from '~/ui/global/styled/layout'
import EditPencilIconLarge from '~/ui/icons/EditPencilIconLarge'
import Tooltip from '~/ui/global/Tooltip'

const EditIcon = styled.span`
  margin-left: 50px;
  width: 22px;
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
  svg {
    width: 100%;
  }
`

const PhaseRow = styled(Row)`
  font-family: ${v.fonts.sans};
  padding: 0.5rem 0;
`
PhaseRow.displayName = 'PhaseRow'

const PhaseRowText = styled(RowItemLeft)`
  padding-top: 0.75rem;
`

const PhaseRowRight = styled(RowItemRight)`
  padding-top: 0.75rem;
  align-item: right;
`

const PhaseCollectionThumbnail = ({ collection }) => {
  return (
    <ThumbnailHolder>
      {collection.cover.image_url && (
        <img src={collection.cover.image_url} alt={collection.name} />
      )}
      {!collection.cover.image_url && <PhaseIcon />}
    </ThumbnailHolder>
  )
}
PhaseCollectionThumbnail.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export const PhaseCollectionWithoutTemplateRow = ({ formatType }) => {
  return (
    <PhaseRow data-cy="ChallengeSettings-Phase">
      <SmallHelperText color={v.colors.black}>
        Phases can not be added to a {formatType}. Change this submission box to
        use a submission template in the 'Submission Settings' tab above if you
        want to add phases.
      </SmallHelperText>
    </PhaseRow>
  )
}
PhaseCollectionWithoutTemplateRow.propTypes = {
  formatType: PropTypes.string.isRequired,
}

const PhaseCollectionRow = ({
  collection,
  closeModal,
  showEdit,
  onDoneEditing,
}) => {
  //const [name, setName] = useState(collection.name + '')
  const nameKey = `phase-${collection.id}-name`
  const { uiStore } = collection

  const updateCollectionName = name => {
    collection.name = name
    collection.save()
  }

  useEffect(() => {
    if (showEdit) {
      uiStore.setEditingName(nameKey)
    }
  }, [showEdit])

  return (
    <PhaseRow data-cy="ChallengeSettings-Phase">
      <PhaseCollectionThumbnail collection={collection} />
      <PhaseRowText>
        <EditableName
          name={collection.name}
          updateNameHandler={updateCollectionName}
          onDoneEditing={onDoneEditing}
          canEdit={true}
          extraWidth={0}
          editFontSize={1}
          editingMarginTop={'0'}
          TypographyComponent={DisplayText}
          typographyCss={DisplayTextCss}
          fieldName={nameKey}
          placeholder="Add name for phase"
          editing={showEdit}
        />
      </PhaseRowText>
      <PhaseRowRight>
        <CollectionDateRange collection={collection} hideEditIcon />
      </PhaseRowRight>
      <PhaseRowRight>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Edit phase"
          placement="top"
        >
          <EditIcon
            onClick={() => {
              closeModal()
              collection.routingStore.routeTo('collections', collection.id)
            }}
            data-cy="ChallengeSettings-PhaseEdit"
          >
            <EditPencilIconLarge />
          </EditIcon>
        </Tooltip>
      </PhaseRowRight>
    </PhaseRow>
  )
}

PhaseCollectionRow.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
  onDoneEditing: PropTypes.func,
}

PhaseCollectionRow.defaultProps = {
  showEdit: false,
  onDoneEditing: () => null,
}

export default PhaseCollectionRow
