import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import { filter } from 'lodash'

import Tooltip from '~/ui/global/Tooltip'
import DateProgressBar from '~/ui/global/DateProgressBar'
import { formatDateRange } from '~/ui/grid/CollectionDateRange'
import { SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

// Temporary Icons
import BuildIcon from '~/ui/icons/challenge_phases/BuildIcon'
import FeedbackIcon from '~/ui/icons/challenge_phases/FeedbackIcon'
import ResearchIcon from '~/ui/icons/challenge_phases/ResearchIcon'
import SelectionIcon from '~/ui/icons/challenge_phases/SelectionIcon'

const PhaseIcon = styled.div`
  width: 32px;
  margin-right: 5px;
  .icon {
    max-height: 30px;
  }
`
PhaseIcon.displayName = 'PhaseIcon'

// I couldn't find any similar-enough style in typography.js
// So created a new style for this tooltip
const TooltipHeader = styled.div`
  font-family: ${v.fonts.sans};
  font-size: 0.9rem;
  color: ${v.colors.white};
  font-weight: bold;
`

export const phaseIcons = [
  <BuildIcon />,
  <FeedbackIcon />,
  <ResearchIcon />,
  <SelectionIcon />,
]

const ChallengePhasesIcons = ({ collection }) => {
  const [phases, setPhases] = useState([])

  useEffect(() => {
    if (!collection.isChallengeOrInsideChallenge) return
    const fetchData = async () => {
      const request = await collection.API_fetchChallengePhaseCollections()
      const phasesWithDates = filter(
        request.data,
        phase => phase.start_date && phase.end_date
      )
      setPhases(phasesWithDates)
    }
    fetchData()
  }, [collection])

  return (
    <Flex>
      {phases.map((phase, i) => (
        <Tooltip
          key={phase.id}
          title={
            <div style={{ textAlign: 'center' }}>
              <TooltipHeader color={v.colors.white}>{phase.name}</TooltipHeader>
              <SmallHelperText>
                {formatDateRange([phase.start_date, phase.end_date])}
              </SmallHelperText>
            </div>
          }
          placement="top"
        >
          <PhaseIcon>
            {phaseIcons[i % 4]}
            <DateProgressBar
              height={4}
              startDate={phase.start_date}
              endDate={phase.end_date}
            />
          </PhaseIcon>
        </Tooltip>
      ))}
    </Flex>
  )
}

ChallengePhasesIcons.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ChallengePhasesIcons
