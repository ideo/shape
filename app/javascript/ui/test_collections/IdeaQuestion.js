import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { TestQuestionBorder } from '~/ui/test_collections/shared'
import MediaQuestion from '~/ui/test_collections/MediaQuestion'
import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'

class IdeaQuestion extends React.Component {
  render() {
    const { card, parent, canEdit, hideMedia } = this.props
    return (
      <Fragment>
        <QuestionContentEditor
          placeholder="add idea title here…"
          item={card.record}
          itemAttribute="name"
          canEdit={canEdit}
          maxLength={100}
        />
        <TestQuestionBorder />
        <QuestionContentEditor
          placeholder="add idea description here…"
          item={card.record}
          itemAttribute="content"
          canEdit={canEdit}
        />
        {!hideMedia && <MediaQuestion parent={parent} card={card} />}
      </Fragment>
    )
  }
}

IdeaQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
  hideMedia: PropTypes.bool,
}
IdeaQuestion.defaultProps = {
  canEdit: false,
  hideMedia: false,
}
IdeaQuestion.displayName = 'IdeaQuestion'

export default IdeaQuestion
