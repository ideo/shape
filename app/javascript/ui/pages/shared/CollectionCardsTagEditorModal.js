import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

import CollectionCardsTagEditor from '~/ui/pages/shared/CollectionCardsTagEditor'
import Modal from '~/ui/global/modals/Modal'
import { Heading2, DisplayText } from '~/ui/global/styled/typography'

const StyledDisplayText = styled(DisplayText)`
  margin-left: 0.31rem;
  margin-bottom: 0.15rem;
`

@inject('uiStore', 'apiStore')
@observer
class CollectionCardsTagEditorModal extends React.Component {
  componentDidMount() {
    this.initializeSuggestions()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.open != this.props.open) {
      this.initializeSuggestions()
    }
  }

  async initializeSuggestions() {
    const { currentUserOrganization } = this.props.apiStore
    await currentUserOrganization.initializeTags()
  }

  get title() {
    const { cards } = this.props
    return (
      <Fragment>
        <Heading2 mb="0.35rem">Tags</Heading2>
        <StyledDisplayText>
          ({cards.length} Item{cards.length > 1 && 's'} Selected)
        </StyledDisplayText>
      </Fragment>
    )
  }

  get records() {
    const { cards } = this.props
    return _.compact(_.map(cards, 'record'))
  }

  get cardIds() {
    const { cards } = this.props
    return cards ? _.map(cards, 'id') : []
  }

  get editorSuggestions() {
    const { currentUserOrganization } = this.props.apiStore
    const { tags } = currentUserOrganization
    return tags
  }

  render() {
    const { canEdit, uiStore, open } = this.props

    return (
      <Modal
        onClose={() => uiStore.update('tagsModalOpenId', null)}
        title={this.title}
        open={open}
      >
        <CollectionCardsTagEditor
          records={this.records}
          cardIds={this.cardIds}
          canEdit={canEdit}
          placeholder="Add new tags, separated by comma or pressing enter."
          tagField="tag_list"
          suggestions={this.editorSuggestions}
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
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionCardsTagEditorModal.defaultProps = {
  canEdit: false,
  open: false,
}

export default CollectionCardsTagEditorModal
