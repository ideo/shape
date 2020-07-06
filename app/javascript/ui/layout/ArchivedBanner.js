import _ from 'lodash'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import Banner from '~/ui/layout/Banner'
import v from '~/utils/variables'

@inject('routingStore', 'uiStore')
@observer
class ArchivedBanner extends React.Component {
  renderLeftComponent() {
    return (
      <div>
        <span>
          This {_.toLower(this.currentRecord.className) || 'record'} has been
          archived
        </span>
      </div>
    )
  }

  renderRightComponent() {
    const { routingStore } = this.props
    const { currentRecord } = this
    if (!currentRecord) return <span />
    const { className, restorable_parent } = currentRecord
    if (!restorable_parent) return <span />
    const restorableParentPath = routingStore.pathTo(
      restorable_parent.internalType,
      restorable_parent.id
    )
    return (
      restorable_parent && (
        <Grid container spacing={2} justify="flex-end">
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
    return uiStore.viewingRecord
  }

  get showArchivedBanner() {
    const { currentRecord } = this
    return currentRecord && currentRecord.archived
  }

  render() {
    if (!this.showArchivedBanner) return null

    return (
      <Banner
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
