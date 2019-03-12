import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { startCase } from 'lodash'

import { DisplayText } from '~/ui/global/styled/typography'

import ChartGroup from '~/ui/global/charts/ChartGroup'
import {
  primaryFillColorFromDatasets,
  AboveChartContainer,
} from '~/ui/global/charts/ChartUtils'

class DataItemCoverReadonly extends React.PureComponent {
  get title() {
    const { item } = this.props
    const { name, data_settings } = item
    if (item.isReportTypeNetworkAppMetric) {
      return startCase(data_settings.d_measure)
    }
    return name
  }

  get fillColor() {
    const { datasets } = this.props.item
    return primaryFillColorFromDatasets(datasets)
  }

  render() {
    const { card, item } = this.props
    return (
      <Fragment>
        <AboveChartContainer>
          <DisplayText color={this.fillColor}>{this.title}</DisplayText>
          <br />
        </AboveChartContainer>
        <ChartGroup
          datasets={item.datasets}
          width={card.width}
          height={card.height}
        />
      </Fragment>
    )
  }
}

DataItemCoverReadonly.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCoverReadonly
