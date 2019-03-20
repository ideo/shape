import LegendItemCover from '~/ui/grid/covers/LegendItemCover'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import {
  fakeLegendItem,
  fakeLegendItemCard,
  fakeCollection,
} from '#/mocks/data'

const props = {
  item: fakeLegendItem,
  card: {
    ...fakeLegendItemCard,
    parent: fakeCollection,
  },
}

let wrapper
describe('LegendItemCover', () => {
  beforeEach(() => {
    wrapper = shallow(<LegendItemCover {...props} />)
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders the primary measure', () => {
    const measure = wrapper.find('Measure').at(0)
    expect(measure.exists()).toBe(true)
    expect(
      measure
        .find('StyledDisplayText')
        .children()
        .text()
    ).toContain('Business Unit')
  })

  it('shows selected measure', () => {
    const selectedMeasure = wrapper.find('Measure').at(1)
    expect(selectedMeasure.exists()).toBe(true)
    expect(selectedMeasure.find('UnselectMeasure').exists()).toBe(true)
  })

  it('removes selected measure when x is clicked', () => {
    const unselectMeasure = wrapper
      .find('Measure')
      .at(1)
      .find('UnselectMeasure')
    unselectMeasure.simulate('click')
    expect(props.item.save).toHaveBeenCalled()
    // Not sure why this fails
    // I can log that it is being called in the component, and it passes in the test below
    expect(props.card.parent.API_fetchCards).toHaveBeenCalled()
  })

  it('updates item when comparison is selected', () => {
    const comparisonMenu = wrapper.find('PopoutMenu').at(0)
    expect(comparisonMenu.props().menuItems.length).toEqual(
      wrapper.instance().comparisonMeasures({ selected: false }).length
    )
    comparisonMenu.props().menuItems[0].onClick()
    expect(props.item.save).toHaveBeenCalled()
    expect(props.card.parent.API_fetchCards).toHaveBeenCalled()
  })
})
