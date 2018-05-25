import PropTypes from 'prop-types'
import pluralize from 'pluralize'

function insertCommas(subjectUsers, subjectGroups) {
  return (subjectUsers.concat(subjectGroups)).join(', ')
}

class Activity extends React.PureComponent {
  getDataText() {
    const { actor, action, subjectUsers, subjectGroups, target } = this.props
    return {
      actorName: actor.name,
      targetName: target.name,
      subjects: insertCommas(subjectUsers, subjectGroups),
      targetType: pluralize.singular(target.internalType),
      roleName: this.isRoleAction() && action.split('_')[1],
    }
  }

  isRoleAction() {
    return ['added_editor', 'added_member', 'added_admin'].includes(
      this.props.action
    )
  }

  getMessageText() {
    const { action } = this.props
    const { actorName, targetName, targetType, roleName, subjects } =
      this.getDataText()

    switch (action) {
    case 'archived':
      return (<p><strong>{actorName}</strong>
          has archived the <strong>{targetName} {targetType}</strong></p>)
    case 'added_editor':
    case 'added_member':
    case 'added_admin':
      return (<p><strong>{actorName}</strong> has made
        <strong>{subjects}</strong> a <strong>{roleName}</strong>
        of the <strong>{targetName} {targetType}</strong></p>)
    default:
      return ''
    }
  }

  render() {
    return (
      <div>
        { this.getMessageText() }
      </div>
    )
  }
}

Activity.propTypes = {
  action: PropTypes.string.isRequired,
  actor: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  target: PropTypes.shape({
    name: PropTypes.string,
    internalType: PropTypes.string,
  }).isRequired,
  subjectUsers: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
  })),
  subjectGroups: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
  })),
}

Activity.defaultProps = {
  subjectUsers: [],
  subjectGroups: []
}

export default Activity
