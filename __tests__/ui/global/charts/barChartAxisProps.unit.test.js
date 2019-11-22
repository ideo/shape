import barChartAxisProps from '~/ui/global/charts/barChartAxisProps'
import _ from 'lodash'

import { fakeBarChartDataset } from '#/mocks/data'

let props = {}
let result

describe('BarChartAxisProps', () => {
  beforeEach(() => {
    props = {
      dataset: fakeBarChartDataset,
      totalColumns: 4,
      totalGroupings: 1,
    }
    props.dataset.isEmojiOrScaleQuestion = true
    result = barChartAxisProps({ ...props })
  })

  it('returns desired keys', () => {
    expect(_.keys(result)).toEqual(
      expect.arrayContaining([
        'tickValues',
        'tickFormat',
        'tickLabelComponent',
        'style',
        'events',
      ])
    )
  })
})
