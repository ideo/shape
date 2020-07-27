import _ from 'lodash'
import PropTypes from 'prop-types'

import Button from '~/ui/global/Button'
import v from '~/utils/variables'

const ChallengeReviewButton = ({ reviewerStatus, onClick }) => {
  const reviewButtonProps = {
    style: {
      margin: '0 auto',
      display: 'block',
    },
    className: 'cancelGridClick',
    size: 'sm',
    width: 172,
    onClick,
  }
  if (reviewerStatus === 'completed') {
    name = 'Revisit'
    _.merge(reviewButtonProps.style, {
      backgroundColor: `${v.colors.transparent}`,
      border: `1px solid ${v.colors.white}`,
      color: `${v.colors.white}`,
    })
  } else {
    name = 'Review'
    _.merge(reviewButtonProps, {
      colorScheme: `${v.colors.alert}`,
      outline: false,
    })
  }

  return <Button {...reviewButtonProps}>{name}</Button>
}

ChallengeReviewButton.propTypes = {
  reviewerStatus: PropTypes.oneOf(['unstarted', 'in_progress', 'completed'])
    .isRequired,
  onClick: PropTypes.func.isRequired,
}

export default ChallengeReviewButton
