import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import AutosizeInput from 'react-input-autosize'

import v from '~/utils/variables'
import CollectionDateRange from '~/ui/grid/CollectionDateRange'
import { ThumbnailHolder } from '~/ui/threads/CommentThumbnail'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import { DisplayTextCss } from '~/ui/global/styled/typography'

import { Row, RowItemLeft, RowItemRight } from '~/ui/global/styled/layout'

const PhaseRow = styled(Row)`
  font-family: ${v.fonts.sans};
  padding: 0.5rem 0;
`
PhaseRow.displayName = 'PhaseRow'

const PhaseRowText = styled(RowItemLeft)`
  padding-top: 0.75rem;
  .input__name {
    ${DisplayTextCss}
  }
`

const PhaseRowDates = styled(RowItemRight)`
  padding-top: 0.75rem;
  align-item: right;
`

const PhaseCollectionThumbnail = ({ collection }) => {
  return (
    <ThumbnailHolder>
      {collection.cover.image_url && (
        <img src={collection.cover.image_url} alt={collection.name} />
      )}
      {!collection.cover.image_url && <SubmissionBoxIconLg />}
    </ThumbnailHolder>
  )
}
PhaseCollectionThumbnail.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export const PhaseCollectionRow = ({ collection }) => {
  return (
    <PhaseRow>
      <PhaseCollectionThumbnail collection={collection} />
      <PhaseRowText>{collection.name}</PhaseRowText>
      <PhaseRowDates>
        <CollectionDateRange collection={collection} />
      </PhaseRowDates>
    </PhaseRow>
  )
}

PhaseCollectionRow.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export const EditPhaseCollectionRow = ({ collection, onDone }) => {
  const [name, setName] = useState(collection.name)

  const onNameFieldKeypress = e => {
    if (e.key === 'Enter') onDone()
  }

  useEffect(() => {
    collection.name = name
    collection.save()
  }, [name])

  return (
    <PhaseRow>
      <PhaseCollectionThumbnail collection={collection} />
      <PhaseRowText>
        <AutosizeInput
          placeholder={'Add name for phase'}
          maxLength={v.maxTitleLength}
          className="input__name"
          style={{ fontSize: 2.25 }}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={e => onDone()}
          onKeyPress={onNameFieldKeypress}
          data-cy="EditPhaseCollectionRowNameInput"
        />
      </PhaseRowText>
      <PhaseRowDates>
        <CollectionDateRange collection={collection} />
      </PhaseRowDates>
    </PhaseRow>
  )
}

EditPhaseCollectionRow.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  onDone: PropTypes.func.isRequired,
}
