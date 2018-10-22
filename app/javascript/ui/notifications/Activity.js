import _ from 'lodash'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import pluralize from 'pluralize'
import styled from 'styled-components'

import { Anchor } from '~/ui/global/styled/typography'
import Link from '~/ui/global/Link'
import { apiStore, uiStore, routingStore } from '~/stores'
import v from '~/utils/variables'

function insertCommas(subjectUsers, subjectGroups) {
  return subjectUsers
    .map(u => u.name)
    .concat(subjectGroups.map(g => g.name))
    .join(', ')
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

export const ActivityText = styled.p`
  color: ${v.colors.commonLight};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  line-height: 1.25;
  margin-bottom: 0;
`
const ActivityButton = styled.button`
  display: block;
  text-align: left;
`

const CommentText = styled.span`
  display: block;
  margin-top: 7px;
`

class Activity extends React.PureComponent {
  actorText() {
    const { actors, actorCount } = this.props
    if (actors.length > MAX_ACTORS || actorCount > MAX_ACTORS) {
      return `${actorCount} people`
    }
    return _.uniq(actors)
      .map(actor => actor.name)
      .join(', ')
  }

  renameYourself() {
    const { subjectUsers } = this.props
    return subjectUsers.map(
      user => (user.id === apiStore.currentUserId ? { name: 'you' } : user)
    )
  }

  targetLink(targetName) {
    const { target } = this.props
    const { id, internalType } = target
    if (!target.name) return ''
    if (internalType === 'groups') {
      return (
        <Anchor className="target" onClick={() => uiStore.openGroup(id)}>
          {targetName}
        </Anchor>
      )
    }
    const link = routingStore.pathTo(internalType, id)
    return (
      <Link className="target" to={link}>
        {targetName}
      </Link>
    )
  }

  handleClick = async e => {
    e.preventDefault()
    const { action, target, handleRead } = this.props
    const { id, internalType } = target
    handleRead(e)
    if (internalType === 'groups') {
      uiStore.openGroup(id)
      return
    }
    if (action !== 'archived') {
      routingStore.routeTo(internalType, id)
    }
    if (_.includes(['commented', 'mentioned'], action)) {
      const thread = await apiStore.findOrBuildCommentThread(target)
      uiStore.expandThread(thread.key)
    }
  }

  getDataText() {
    const { action, subjectGroups, target, content, sourceName } = this.props
    return {
      actorNames: this.actorText(),
      targetName: target.name,
      subjects: insertCommas(this.renameYourself(), subjectGroups),
      targetType: pluralize.singular(target.internalType),
      roleName: this.isRoleAction() && action.split('_')[1],
      message: content ? commentPreview(content) : '',
      sourceName,
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
      message,
      sourceName,
    } = this.getDataText()

    switch (action) {
      case 'archived':
        return (
          <ActivityText>
            <strong className="actor">{actorNames}</strong>
            {` `}
            has archived{' '}
            <strong className="target">
              &ldquo;
              {targetName}
              &rdquo;
            </strong>
          </ActivityText>
        )
      case 'archived_from_template':
        return (
          <ActivityText>
            <strong className="source">
              &ldquo;
              {sourceName}
              &rdquo;
            </strong>
            was removed from the template by the template editor. This affected
            {this.targetLink(targetName)}
          </ActivityText>
        )
      case 'added_editor':
      case 'added_member':
      case 'added_admin':
        return (
          <ActivityText>
            <strong className="actor">{actorNames}</strong> has made
            {` `}
            <strong className="subjects">{subjects}</strong>
            {` `}
            {roleArticle(roleName)}{' '}
            <strong className="roleName">{roleName}</strong>
            {` `}
            of {this.targetLink(targetName)}
          </ActivityText>
        )
      case 'commented':
        return (
          <ActivityText>
            <strong className="actor">{actorNames}</strong> commented on
            {` `}
            {this.targetLink(targetName)}
            <CommentText>
              &ldquo;
              <span className="message">{message}</span>
              &rdquo;
            </CommentText>
          </ActivityText>
        )
      case 'mentioned':
        return (
          <ActivityText>
            <strong className="actor">{actorNames}</strong> mentioned you in a
            comment for {` `}
            {this.targetLink(targetName)}
            {` `}
            <CommentText>
              &ldquo;
              <span className="message">{message}</span>
              &rdquo;
            </CommentText>
          </ActivityText>
        )

      default:
        return ''
    }
  }

  render() {
    return (
      <ActivityButton onClick={this.handleClick}>
        {this.getMessageText()}
      </ActivityButton>
    )
  }
}

Activity.propTypes = {
  action: PropTypes.string.isRequired,
  actors: MobxPropTypes.arrayOrObservableArray.isRequired,
  target: PropTypes.shape({
    name: PropTypes.string,
    internalType: PropTypes.string,
  }).isRequired,
  sourceName: PropTypes.string,
  subjectUsers: MobxPropTypes.arrayOrObservableArray,
  subjectGroups: MobxPropTypes.arrayOrObservableArray,
  actorCount: PropTypes.number,
  content: PropTypes.string,
  handleRead: PropTypes.func.isRequired,
}

Activity.defaultProps = {
  subjectUsers: [],
  subjectGroups: [],
  actorCount: 0,
  content: null,
  sourceName: '',
}

export default Activity
