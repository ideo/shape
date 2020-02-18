import DataItemCreator from '~/ui/grid/blankContentTool/DataItemCreator'
import { ITEM_TYPES } from '~/utils/variables'

let wrapper, props, component
describe('DataItemCreator', () => {
  beforeEach(() => {
    props = {
      loading: false,
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn(),
    }
    props.createCard.mockClear()
    wrapper = shallow(<DataItemCreator {...props} />)
    component = wrapper.instance()
  })

  it('calls createCard with DataItem type and report name', () => {
    component.createItem('viewers')
    expect(props.createCard).toHaveBeenCalledWith({
      item_attributes: {
        datasets_attributes: {
          0: {
            chart_type: 'area',
            measure: 'viewers',
            timeframe: 'ever',
          },
        },
        type: ITEM_TYPES.DATA,
        report_type: 'report_type_collections_and_items',
        name: 'Report',
      },
    })
  })
})
