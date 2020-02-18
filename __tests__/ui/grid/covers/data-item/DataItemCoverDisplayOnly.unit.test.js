import DataItemCoverDisplayOnly from '~/ui/grid/covers/data-item/DataItemCoverDisplayOnly'
import { fakeDataItemRecordAttrs } from '#/mocks/data'

const props = {}
let wrapper, render

describe('DataItemCoverDisplayOnly', () => {
  beforeEach(() => {
    props.item = fakeDataItemRecordAttrs
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    render = () => (wrapper = shallow(<DataItemCoverDisplayOnly {...props} />))
    render()
  })

  it('should render item name', () => {
    expect(
      wrapper
        .find('StyledHeading3')
        .children()
        .first()
        .text()
    ).toEqual(props.item.name)
  })

  it('should render a chart', () => {
    expect(wrapper.find('ChartGroup').exists()).toBe(true)
  })
})
