import Tooltip from '~/ui/global/Tooltip'
import ChallengeIcon from '~/ui/icons/collection_icons/ChallengeIcon'
import { Heading2 } from '~/ui/global/styled/typography'
import IconHolder from '~/ui/icons/IconHolder'
import v from '~/utils/variables'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const SubHeaderWrapper = styled.div`
  margin-bottom: -10px;
  margin-top: 10px;
`

const StyledSubHeaderLink = styled(Heading2)`
  display: inline-block;
  color: ${v.colors.commonDark};
  font-size: 13px;
  line-height: 16px;
  margin: 0px;
  position: relative;
  bottom: 3px;
  cursor: pointer;
`

StyledSubHeaderLink.displayName = 'StyledSubHeaderLink'

const ChallengeSubHeader = ({ challengeName, challengeNavigationHandler }) => {
  return (
    <SubHeaderWrapper>
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={'Go to challenge'}
        placement="top"
      >
        <StyledSubHeaderLink onClick={challengeNavigationHandler}>
          {challengeName}
        </StyledSubHeaderLink>
      </Tooltip>
      <IconHolder
        height={16}
        width={16}
        display={'inline-block'}
        marginTop={0}
        marginRight={12}
      >
        <ChallengeIcon />
      </IconHolder>
    </SubHeaderWrapper>
  )
}

ChallengeSubHeader.propTypes = {
  challengeName: PropTypes.string.isRequired,
  challengeNavigationHandler: PropTypes.func.isRequired,
}

export default ChallengeSubHeader
