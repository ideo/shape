import _ from 'lodash'
import PropTypes from 'prop-types'
import pluralize from 'pluralize'

import Link from '~/ui/global/Link'
import { routingStore } from '~/stores'

function insertCommas(subjectUsers, subjectGroups) {
  return (subjectUsers.map(u => u.name).concat(subjectGroups.map(g => g.name))).join(', ')
}

function commentPreview(content) {
  if (!content) return ''
  return content.length > 200 ? `${content.substr(0, 200)} \u2026` : content
}

function roleArticle(nextWord) {
  if (nextWord === 'editor' || nextWord === 'admin') return 'an'
  return 'a'
}

const MAX_ACTORS = 3

class Activity extends React.PureComponent {
  actorText() {
    const { actors, actorCount } = this.props
    if (actors.length > MAX_ACTORS || actorCount > MAX_ACTORS) {
      return `${actorCount} people`
    }
    return _.uniq(actors).map(actor => actor.name).join(', ')
  }

  targetLink() {
    const { target } = this.props
    const { id, internalType } = target
    return routingStore.pathTo(internalType, id)
  }

  getDataText() {
    const { action, subjectUsers, subjectGroups, target, content } = this.props
    return {
      actorNames: this.actorText(),
      targetName: target.name,
      subjects: insertCommas(subjectUsers, subjectGroups),
      targetType: pluralize.singular(target.internalType),
      roleName: this.isRoleAction() && action.split('_')[1],
      message: action === 'commented' && commentPreview(content)
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
      actorNames,
      targetName,
      roleName,
      subjects,
      message
    } = this.getDataText()

    switch (action) {
    case 'archived':
      return (
        <p>
          <strong className="actor">{actorNames}</strong>
          has archived <strong className="target">{targetName}</strong>
        </p>)
    case 'added_editor':
    case 'added_member':
    case 'added_admin':
      return (
        <p>
          <strong className="actor">{actorNames}</strong> has made
          <strong className="subjects">{subjects}</strong>
            ${roleArticle(roleName)} <strong className="roleName">{roleName}</strong>
        of the <Link className="target" to={this.targetLink()}>{targetName}</Link>
        </p>)
    case 'commented':
      return (
        <p>
          <strong className="actor">{actorNames}</strong> commented on
          <Link className="target" to={this.targetLink()}>{targetName}</Link>:
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
  actors: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
  })).isRequired,
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
  actorCount: PropTypes.number,
  content: PropTypes.string,
}

Activity.defaultProps = {
  subjectUsers: [],
  subjectGroups: [],
  actorCount: 0,
  content: null,
}

export default Activity
