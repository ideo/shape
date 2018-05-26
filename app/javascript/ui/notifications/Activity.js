import PropTypes from 'prop-types'
import pluralize from 'pluralize'
import Dotdotdot from 'react-dotdotdot'

function insertCommas(subjectUsers, subjectGroups) {
  return (subjectUsers.map(u => u.name).concat(subjectGroups.map(g => g.name))).join(', ')
}

function commentPreview(comments) {
  const lastComment = [...comments].pop().message
  return lastComment.length > 200 ? `${lastComment.substr(0, 200)} \u2026` : lastComment
}

class Activity extends React.PureComponent {
  getDataText() {
    const { actor, action, subjectUsers, subjectGroups, target } = this.props
    return {
      actorName: actor.name,
      targetName: action === 'commented' ? target.record.name : target.name,
      subjects: insertCommas(subjectUsers, subjectGroups),
      targetType: pluralize.singular(target.internalType),
      roleName: this.isRoleAction() && action.split('_')[1],
      message: action === 'commented' && commentPreview(target.comments)
    }
  }

  isRoleAction() {
    return ['added_editor', 'added_member', 'added_admin'].includes(
      this.props.action
    )
  }

  getMessageText() {
    const { action } = this.props
    const {
      actorName,
      targetName,
      targetType,
      roleName,
      subjects,
      message
    } = this.getDataText()

    switch (action) {
    case 'archived':
      return (<p><strong className="actor">{actorName}</strong>
          has archived the <strong className="target">{targetName} {targetType}</strong></p>)
    case 'added_editor':
    case 'added_member':
    case 'added_admin':
      return (<p><strong className="actor">{actorName}</strong> has made
      <strong className="subjects">{subjects}</strong> a <strong className="roleName">{roleName}</strong>
      of the <strong className="target">{targetName} {targetType}</strong></p>)
    case 'commented':
      return (<p><strong className="actor">{actorName}</strong> commented on
        <strong className="target">{targetName}</strong>:
        <span className="message">{message}</span>
      </p>)

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
