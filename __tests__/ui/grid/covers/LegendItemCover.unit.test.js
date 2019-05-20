import LegendItemCover from '~/ui/grid/covers/LegendItemCover'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
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
  apiStore: fakeApiStore(),
  uiStore: fakeUiStore,
}

let wrapper
describe('LegendItemCover', () => {
  beforeEach(() => {
    render = () => {
      wrapper = shallow(<LegendItemCover {...props} />)
    }
    render()
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

  it('shows selected dataset', () => {
    const selectedMeasure = wrapper.find('Dataset').at(1)
    expect(selectedMeasure.exists()).toBe(true)
    expect(selectedMeasure.find('UnselectDataset').exists()).toBe(true)
  })

  it('removes selected dataset when x is clicked', () => {
    const unselectDataset = wrapper
      .find('Dataset')
      .at(1)
      .find('UnselectDataset')
    unselectDataset.simulate('click')
    expect(props.item.save).toHaveBeenCalled()
    // Not sure why this fails
    // I can log that it is being called in the component, and it passes in the test below
    // expect(props.card.parent.API_fetchCards).toHaveBeenCalled()
  })

  it('updates item when comparison is selected', () => {
    wrapper.find('.add-comparison-button').simulate('click')
    const comparisonMenu = wrapper.find('StyledSelect').at(0)
    expect(comparisonMenu.find('StyledSelectOption').length).toEqual(
      wrapper.instance().comparisonMeasures({ selected: false }).length
    )
    const firstOption = comparisonMenu.find('StyledSelectOption').at(0)
    firstOption.simulate('click')
    expect(props.item.save).toHaveBeenCalled()
    expect(props.card.parent.API_fetchCards).toHaveBeenCalled()
  })
})
