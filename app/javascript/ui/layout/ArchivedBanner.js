import _ from 'lodash'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import TrashIcon from '~/ui/icons/TrashIcon'
import Banner from '~/ui/layout/Banner'
import v from '~/utils/variables'

const StyledBanner = styled(Banner)`
  margin-left: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);
  margin-right: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);
  margin-top: 20px;
  margin-bottom: 20px;

  @media only screen and (max-width: ${v.maxWidth +
      v.containerPadding.horizontal * v.fonts.baseSize}px) {
    margin-left: -${v.containerPadding.horizontal}rem;
    margin-right: -${v.containerPadding.horizontal}rem;
    padding: 20px ${v.containerPadding.horizontal}rem;
  }
`
StyledBanner.displayName = 'StyledBanner'

const StyledIconWrapper = styled.div`
  vertical-align: middle;
  width: ${props => props.width || props.height || '32'}px;
  margin-top: -4px;
  height: ${props => props.height || props.width || '32'}px;
  display: inline-block;
`

@inject('routingStore', 'uiStore')
@observer
class ArchivedBanner extends React.Component {
  renderLeftComponent() {
    return (
      <div>
        <StyledIconWrapper>
          <TrashIcon />
        </StyledIconWrapper>
        <span>
          This {_.toLower(this.currentRecord.className) || 'record'} has been
          archived
        </span>
      </div>
    )
  }

  renderRightComponent() {
    const { routingStore } = this.props
    if (!this.currentRecord) return null
    const { className, restorable_parent } = this.currentRecord
    if (!restorable_parent) return null
    const restorableParentPath = routingStore.pathTo(
      restorable_parent.internalType,
      restorable_parent.id
    )
    return (
      restorable_parent && (
        <Grid container spacing={16} justify="flex-end">
          <Grid item>
            Go to{' '}
            <Link to={restorableParentPath}>{restorable_parent.name}</Link> to
            restore this {_.toLower(className)}
          </Grid>
        </Grid>
      )
    )
  }

  get currentRecord() {
    const { uiStore } = this.props

    return uiStore.viewingCollection || uiStore.viewingItem
  }

  get showArchivedBanner() {
    return this.currentRecord && this.currentRecord.archived
  }

  render() {
    if (!this.showArchivedBanner) return null

    return (
      <StyledBanner
        color={v.colors.commonDark}
        leftComponent={this.renderLeftComponent()}
        rightComponent={this.renderRightComponent()}
      />
    )
  }
}

ArchivedBanner.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ArchivedBanner
