import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import { filter } from 'lodash'

import Tooltip from '~/ui/global/Tooltip'
import DateProgressBar from '~/ui/global/DateProgressBar'
import { FormatDateRange } from '~/ui/grid/CollectionDateRange'
import { SmallHelperText, TooltipHeader } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CollectionIcon from '~/ui/icons/CollectionIcon'

const PhaseIconWrapper = styled.div`
  width: 32px;
  margin-right: 5px;
  .icon {
    max-height: 30px;
  }
`
PhaseIconWrapper.displayName = 'PhaseIconWrapper'

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
                <FormatDateRange
                  dateRange={[phase.start_date, phase.end_date]}
                />
              </SmallHelperText>
            </div>
          }
          placement="top"
        >
          <PhaseIconWrapper>
            <CollectionIcon type={phase.icon} size="lg" />
            <DateProgressBar
              height={4}
              startDate={phase.start_date}
              endDate={phase.end_date}
            />
          </PhaseIconWrapper>
        </Tooltip>
      ))}
    </Flex>
  )
}

ChallengePhasesIcons.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ChallengePhasesIcons
