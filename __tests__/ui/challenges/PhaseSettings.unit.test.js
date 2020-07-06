import PhaseSettings from '~/ui/challenges/PhaseSettings'

import {
  fakeSubmissionBoxWithTemplate,
  fakeSubmissionBoxWithoutTemplate,
  fakeCollection,
} from '#/mocks/data'

jest.mock('../../../app/javascript/stores/jsonApi/Collection')

let props, wrapper, rerender, submissionWithTemplate, submissionWithoutTemplate
describe('PhaseSettings', () => {
  beforeEach(() => {
    submissionWithTemplate = fakeSubmissionBoxWithTemplate
    submissionWithoutTemplate = fakeSubmissionBoxWithoutTemplate
    props = {
      collection: fakeCollection,
      submissionBoxes: [submissionWithTemplate, submissionWithoutTemplate],
      closeModal: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<PhaseSettings {...props} />)
    }
    rerender()
  })

  it('renders two panels, both closed', () => {
    expect(wrapper.find('Panel').length).toEqual(2)
    const firstPanelProps = wrapper
      .find('Panel')
      .at(0)
      .props()
    expect(firstPanelProps.open).toBe(false)
    expect(firstPanelProps.title).toEqual('Submission Box with Template')
    expect(firstPanelProps.open).toBe(false)

    const secondPanelProps = wrapper
      .find('Panel')
      .at(1)
      .props()
    expect(secondPanelProps.open).toBe(false)
    expect(secondPanelProps.title).toEqual('Submission Box without Template')
  })

  it('renders PhaseCollectionRow for submission with template', () => {
    expect(wrapper.find('PhaseCollectionRow').props().collection).toEqual(
      submissionWithTemplate.phaseSubCollections[0]
    )
  })

  it('has button to create new phase', () => {
    expect(wrapper.find('TextButton').text()).toEqual('+ Add Phase')
  })

  it('renders PhaseCollectionWithoutTemplateRow for submission without template', () => {
    expect(
      wrapper.find('PhaseCollectionWithoutTemplateRow').props().formatType
    ).toEqual('text item')
  })
})
