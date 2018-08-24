import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'
import styled from 'styled-components'

import v, { ITEM_TYPES } from '~/utils/variables'
import { StyledGridCard } from '~/ui/grid/shared'
import InlineLoader from '~/ui/layout/InlineLoader'
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
    // droppingFile: false,
  }

  componentWillUnmount() {
    this.canceled = true
  }

  get emptyState() {
    const { uiStore } = this.props
    return uiStore.blankContentToolState.emptyCollection && !this.state.creating
  }

  startCreating = type => () => {
    this.setState({ creating: type })
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
    const { parent_id, template } = this.props
    // TODO: non-template types currently not supported
    if (!template) return
    const templateData = {
      template_id: template.id,
      parent_id,
      placement: 'beginning',
    }
    this.setState({ loading: true })
    const res = await apiStore.createTemplateInstance(templateData)
    this.setState({ loading: false })
    routingStore.routeTo('collections', res.data.id)
  }

  renderInner = () => {
    const { template, uiStore } = this.props
    const { viewingCollection } = uiStore
    if (!viewingCollection) return ''
    let inner
    // const { creating, loading, droppingFile } = this.state
    // const isReplacing = !!this.props.uiStore.blankContentToolState.replacingId
    // const size = v.iconSizes.bct

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
        <h3>Add a new {pluralize.singular(viewingCollection.submissionTypeName)}</h3>
        { this.state.loading && <InlineLoader /> }
        <SubmissionButton
          disabled={this.loading}
          onClick={this.handleSubmission}
        >
          &#43;
        </SubmissionButton>
        {inner}
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { uiStore } = this.props
    const { gridSettings, blankContentToolState } = uiStore
    // const { creating } = this.state
    return (
      <StyledAddSubmission>
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridSettings.gridW}
          gridH={gridSettings.gridH}
        >
          {this.renderInner()}
        </StyledGridCardInner>
      </StyledAddSubmission>
    )
  }
}

AddSubmission.propTypes = {
  // parent is the parent collection
  // parent: MobxPropTypes.objectOrObservableObject.isRequired,
  // afterCreate: PropTypes.func,
  parent_id: PropTypes.number.isRequired,
  template: MobxPropTypes.objectOrObservableObject,
}
AddSubmission.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  // apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
AddSubmission.defaultProps = {
  // afterCreate: null,
  template: null,
}

// give a name to the injected component for unit tests
AddSubmission.displayName = 'AddSubmissionHOC'

export default AddSubmission
