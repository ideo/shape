import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex } from 'reflexbox'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import v, { ITEM_TYPES } from '~/utils/variables'
import { StyledGridCard } from '~/ui/grid/shared'
import InlineLoader from '~/ui/layout/InlineLoader'
import { CloseButton } from '~/ui/global/styled/buttons'
import { apiStore, routingStore } from '~/stores'

const StyledAddSubmission = StyledGridCard.extend`
  background: transparent;
  cursor: auto;
  position: relative;
  text-align: center;
`
// width of card is constrained by gridW
// vertical position is adjusted by gridH / 2 if card is 2 rows tall
const StyledGridCardInner = styled.div`
  max-width: ${props => props.gridW}px;
  margin: 0 auto;
  position: relative;
  top: ${props => (props.height > 1 ? (props.gridH / 2) : 0)}px;
`

const StyledBlankCreationTool = styled.div`
  padding: 34px 42px;
  position: relative;
`

const SubmissionButton = styled.button`
  background-color: ${v.colors.ctaButtonBlue};
  border-radius: 50%;
  color: white;
  font-size: 42px;
  font-weight: ${v.weights.book};
  height: 47px;
  line-height: 47px;
  margin-top: 34px;
  width: 47px;
  vertical-align: middle;
`

@inject('uiStore', 'apiStore')
@observer
class AddSubmission extends React.Component {
  state = {
    creating: null,
    loading: false,
    droppingFile: false,
    bctMenuOpen: false,
  }

  componentWillUnmount() {
    this.canceled = true
  }

  get emptyState() {
    const { uiStore } = this.props
    return uiStore.blankContentToolState.emptyCollection && !this.state.creating
  }

  startCreating = type => () => {
    this.setState({ creating: type, bctMenuOpen: false })
  }

  createCardWith = (file) => {
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.FILE,
        filestack_file_attributes: {
          url: file.url,
          handle: file.handle,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          docinfo: file.docinfo,
        },
      },
    }
    this.createCard(attrs)
  }

  handleSubmission = async (ev) => {
    ev.preventDefault()
    const { parent_id, template_id } = this.props
    const templateData = {
      parent_id,
      template_id,
      placement: 'beginning',
    }
    const res = await apiStore.createTemplateInstance(templateData)
    routingStore.routeTo('collections', res.data.id)
  }

  renderInner = () => {
    let inner
    const { creating, loading, droppingFile } = this.state
    const isReplacing = !!this.props.uiStore.blankContentToolState.replacingId
    const size = v.iconSizes.bct

    // When they selected text, link or file item, render the grid card blank
    // sending initial type? Or render the creators?
    //
    // if (template_type !== 'template') {
    // inner = <GridCardBlank
    //  parent={parent}
    //  initialCreator={template_type}
    //  afterCreate={this.something}
    // />

    return (
      <StyledBlankCreationTool>
        <h3>Add a new concept</h3>
        <SubmissionButton onClick={this.handleSubmission}>
          &#43;
        </SubmissionButton>
        {inner}
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { uiStore } = this.props
    const { gridSettings, blankContentToolState } = uiStore
    const { creating } = this.state
    return (
      <StyledAddSubmission>
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridSettings.gridW}
          gridH={gridSettings.gridH}
        >
          {this.renderInner()}
        </StyledGridCardInner>
        { this.state.loading && <InlineLoader /> }
      </StyledAddSubmission>
    )
  }
}

AddSubmission.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  template_id: PropTypes.number.isRequired,
  afterCreate: PropTypes.func,
}
AddSubmission.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
AddSubmission.defaultProps = {
  afterCreate: null,
}

// give a name to the injected component for unit tests
AddSubmission.displayName = 'AddSubmissionHOC'

export default AddSubmission
