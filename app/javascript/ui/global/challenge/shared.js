import PropTypes from 'prop-types'
import Button from '~/ui/global/Button'
import v from '~/utils/variables'

const ReviewButton = ({ reviewerStatus, onClick }) => {
  let name
  if (reviewerStatus === 'completed') {
    name = 'Revisit'
  } else {
    name = 'Review'
  }

  return (
    <Button
      style={{ marginLeft: '3.2rem' }}
      className="cancelGridClick"
      colorScheme={`${v.colors.alert}`}
      size="sm"
      width={172}
      onClick={onClick}
    >
      {name}
    </Button>
  )
}

ReviewButton.propTypes = {
  reviewerStatus: PropTypes.oneOf(['unstarted', 'in_progress', 'completed'])
    .isRequired,
  onClick: PropTypes.func.isRequired,
}

export { ReviewButton }
