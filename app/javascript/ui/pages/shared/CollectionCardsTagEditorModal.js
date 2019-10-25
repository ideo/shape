import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CollectionCardsTagEditor from '~/ui/pages/shared/CollectionCardsTagEditor'
import Modal from '~/ui/global/modals/Modal'
import { Heading2, DisplayText } from '~/ui/global/styled/typography'

const StyledHeading2 = styled(Heading2)`
  margin-bottom: 0.35rem;
`

const StyledDisplayText = styled(DisplayText)`
  margin-left: 0.31rem;
  margin-bottom: 0.15rem;
`

@inject('uiStore')
@observer
class CollectionCardsTagEditorModal extends React.Component {
  get title() {
    const { cards } = this.props
    return (
      <Fragment>
        <StyledHeading2>Tags</StyledHeading2>
        <StyledDisplayText>
          ({cards.length} Item{cards.length > 1 && 's'} Selected)
        </StyledDisplayText>
      </Fragment>
    )
  }

  render() {
    const { cards, canEdit, uiStore, open } = this.props

    return (
      <Modal
        onClose={() => uiStore.update('tagsModalOpenId', null)}
        title={this.title}
        open={open}
      >
        <CollectionCardsTagEditor
          cards={cards}
          canEdit={canEdit}
          placeholder="Add new tags, separated by comma or pressing enter."
          tagField="tag_list"
        />
      </Modal>
    )
  }
}

CollectionCardsTagEditorModal.propTypes = {
  cards: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
  canEdit: PropTypes.bool,
  open: PropTypes.bool,
}
CollectionCardsTagEditorModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionCardsTagEditorModal.defaultProps = {
  canEdit: false,
  open: false,
}

export default CollectionCardsTagEditorModal
