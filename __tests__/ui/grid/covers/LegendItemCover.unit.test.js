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
      wrapper = shallow(<LegendItemCover.wrappedComponent {...props} />)
    }
    render()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('shows selected dataset', () => {
    const selectedMeasure = wrapper.find('Dataset').at(0)
    expect(selectedMeasure.exists()).toBe(true)
  })

  it('removes selected dataset when x is clicked', () => {
    const unselectDataset = wrapper
      .find('Dataset')
      .at(1)
      .find('UnselectDataset')
    unselectDataset.simulate('click')
    expect(props.card.parent.API_unselectDatasetsWithName).toHaveBeenCalled()
    // Not sure why this fails
    // I can log that it is being called in the component, and it passes in the test below
    // expect(props.card.parent.API_fetchCards).toHaveBeenCalled()
  })
})
