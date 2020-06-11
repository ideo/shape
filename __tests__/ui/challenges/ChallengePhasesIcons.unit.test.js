import ChallengePhasesIcons from '~/ui/challenges/ChallengePhasesIcons'

import { fakeCollection } from '#/mocks/data'

let props, wrapper, rerender, phaseCollection
describe('ChallengePhasesIcons', () => {
  beforeEach(() => {
    phaseCollection = {
      ...fakeCollection,
      start_date: '2020-04-22T18:57:12.863Z',
      end_date: '2020-06-22T18:57:12.863Z',
    }
    props = {
      collection: {
        ...fakeCollection,
        isChallengeOrInsideChallenge: true,
        API_fetchChallengePhaseCollections: jest
          .fn()
          .mockReturnValue(Promise.resolve({ data: [phaseCollection] })),
      },
    }
    rerender = () => {
      wrapper = shallow(<ChallengePhasesIcons {...props} />)
    }
    rerender()
  })

  it('renders progress bar for phase collection', () => {
    const progressBar = wrapper
      .find('PhaseIcon')
      .at(0)
      .find('DateProgressBar')
    expect(progressBar.props().startDate).toEqual(phaseCollection.start_date)
    expect(progressBar.props().endDate).toEqual(phaseCollection.end_date)
  })
})
