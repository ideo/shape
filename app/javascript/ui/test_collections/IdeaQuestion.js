import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { TestQuestionBorder } from '~/ui/test_collections/shared'
import MediaQuestion from '~/ui/test_collections/MediaQuestion'
import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'

class IdeaQuestion extends React.Component {
  render() {
    const { card, parent, canEdit } = this.props
    return (
      <Fragment>
        <QuestionContentEditor
          item={card.record}
          itemAttribute="name"
          canEdit={canEdit}
          placeholder="add idea title here…"
          maxLength={40}
          singleLine
        />
        <TestQuestionBorder />
        <QuestionContentEditor
          placeholder="add idea description here…"
          item={card.record}
          itemAttribute="content"
          canEdit={canEdit}
        />
        {parent.test_show_media && (
          <MediaQuestion parent={parent} card={card} />
        )}
      </Fragment>
    )
  }
}

IdeaQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
}
IdeaQuestion.defaultProps = {
  canEdit: false,
}
IdeaQuestion.displayName = 'IdeaQuestion'

export default IdeaQuestion
