import ChartGroup from '~/ui/global/charts/ChartGroup'
import { fakeDataItemRecordAttrs } from '#/mocks/data'

const props = {}
let wrapper, render

describe('ChartGroup', () => {
  beforeEach(() => {
    props.item = fakeDataItemRecordAttrs
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    render = () => (wrapper = shallow(<ChartGroup {...props} />))
    render()
  })

  describe('with not enough data', () => {
    beforeEach(() => {
      props.item.datasets[0].data = []
      props.item.datasets[1].data = []
      render()
    })

    it('should show a not enough data message', () => {
      expect(
        wrapper
          .find('.noDataMessage')
          .children()
          .at(1)
          .text()
      ).toContain('Not enough data yet')
    })
  })
})
