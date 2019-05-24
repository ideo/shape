import LegendItemCover from '~/ui/grid/covers/LegendItemCover'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import { Heading3 } from '~/ui/global/styled/typography'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeDataset,
  fakeLegendItem,
  fakeLegendItemCard,
  fakeCollection,
} from '#/mocks/data'

let wrapper, instance, props
describe('LegendItemCover', () => {
  beforeEach(() => {
    render = () => {
      props = {
        item: fakeLegendItem,
        card: {
          ...fakeLegendItemCard,
          parent: fakeCollection,
        },
        apiStore: fakeApiStore(),
        uiStore: fakeUiStore,
      }
      wrapper = shallow(<LegendItemCover.wrappedComponent {...props} />)
      instance = wrapper.instance()
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

  describe('unselect', () => {
    const getUnselect = () => {
      return wrapper
        .find('Dataset')
        .at(1)
        .find('UnselectDataset')
    }

    beforeEach(() => {})

    describe('when unselecting a grouped dataset', () => {
      beforeEach(() => {
        props.item.datasets = [
          fakeDataset,
          {
            ...fakeDataset,
            groupings: [{ type: 'Organization', id: 13 }],
            selected: true,
            name: 'org-wide-question',
            display_name: 'Organziation stuff',
          },
        ]
        render()
        getUnselect().simulate('click')
      })

      it('should unselect the dataset by name', () => {
        expect(
          props.card.parent.API_unselectDatasetsWithName
        ).toHaveBeenCalled()
      })
    })

    describe('when unselecting a test dataset', () => {
      beforeEach(() => {
        props.item.datasets = [
          fakeDataset,
          { ...fakeDataset, groupings: [], selected: true, name: 'ads' },
        ]
        render()
        getUnselect().simulate('click')
      })

      it('should remove the compairison', () => {
        expect(props.card.parent.API_removeComparison).toHaveBeenCalled()
      })
    })
  })

  describe('datasets()', () => {
    beforeEach(() => {
      const datasetSelectedA = { ...fakeDataset, name: 'a', selected: true }
      const datasetSelectedB = { ...fakeDataset, name: 'b', selected: true }
      const datasetUnselectedC = { ...fakeDataset, name: 'c', selected: false }
      const datasetDuplicatedA = { ...fakeDataset, name: 'a', selected: true }
      props.item.datasets = [
        datasetSelectedA,
        datasetSelectedB,
        datasetUnselectedC,
        datasetDuplicatedA,
      ]
      render()
    })

    it('should filter by selected datasets', () => {
      expect(instance.datasets({ selected: true }).length).toEqual(2)
      expect(instance.datasets({ selected: false }).length).toEqual(1)
    })

    it('should filter out duplicates by name', () => {
      expect(instance.datasets({ selected: true }).length).toEqual(2)
    })
  })

  describe('toggle comparison search', () => {
    const comparisonClick = () => {
      wrapper.find(Heading3).simulate('click')
    }

    it('should remove/open the empty space click handler', () => {
      comparisonClick()
      expect(props.uiStore.addEmptySpaceClickHandler).toHaveBeenCalled()
    })

    it('should set the comparison menu open state', () => {
      comparisonClick()
      expect(wrapper.state().comparisonMenuOpen).toBe(true)
    })
  })

  describe('onSelectComparison', () => {
    let groupedDataset

    beforeEach(() => {
      groupedDataset = {
        ...fakeDataset,
        groupings: [{ type: 'Organization', id: 13 }],
        selected: false,
        name: 'org-wide-question',
        display_name: 'Organziation stuff',
        internalType: 'datasets',
      }

      props.item.datasets = [groupedDataset]
      render()
    })

    describe('with a test collection', () => {
      it('should add the test comparison with the test', () => {
        instance.onSelectComparison(fakeCollection)
        expect(props.card.parent.API_addComparison).toHaveBeenCalled()
      })
    })

    describe('with a dataset', () => {
      it('should toggle the dataset with name', () => {
        instance.onSelectComparison(groupedDataset)
        expect(props.card.parent.API_selectDatasetsWithName).toHaveBeenCalled()
      })
    })
  })
})
