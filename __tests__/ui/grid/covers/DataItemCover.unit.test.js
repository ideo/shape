import DataItemCover from '~/ui/grid/covers/DataItemCover'
import { fakeItem } from '#/mocks/data'

const props = {}
let wrapper
describe('DataItemCover', () => {
  beforeEach(() => {
    props.item = {
      ...fakeItem,
      data: {
        count: 5,
      },
      data_settings: {
        d_measure: 'participants',
      },
    }
    wrapper = shallow(<DataItemCover {...props} />)
  })

  // TODO: replace with more meaningful test once the component is set up more properly
  it('renders the data values', () => {
    expect(
      wrapper
        .find('StyledDataItemCover h4')
        .at(0)
        .text()
    ).toContain(props.item.data.count)
    expect(
      wrapper
        .find('StyledDataItemCover div')
        .at(0)
        .text()
    ).toContain(props.item.data_settings.d_measure)
  })
})
