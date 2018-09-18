import styled from 'styled-components'

import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'

export const StyledCommentInput = styled.div`
  cursor: text;
  padding: 10px;
  padding-right: 45px;
  font-size: 1rem;

  .public-DraftEditor-content {
    min-height: ${props => (props.editing ? '25px' : '15px')};
  }

  .public-DraftEditorPlaceholder-root {
    color: ${v.colors.gray};
    position: absolute;
    z-index: 1;
  }

  .draftJsMentionPlugin__mention__29BEd {
    /* &:visited */
    font-weight: 700;
    display: inline-block;
    padding-left: 2px;
    padding-right: 2px;
    border-radius: 2px;
    text-decoration: none;

    /*
    &:hover, &:focus {
      cursor: pointer;
      color: #677584;
      background: #edf5fd;
      outline: 0;
    }
    &:active {
      color: #222;
      background: #455261;
    }
    */
  }

  .draftJsMentionPlugin__mentionSuggestionsEntry__3mSwm {
    color: #444;
    padding: 7px 10px 3px 10px;
    transition: background-color 0.4s cubic-bezier(0.27, 1.27, 0.48, 0.56);
  }

  .draftJsMentionPlugin__mentionSuggestionsEntry__3mSwm:active {
    background-color: #cce7ff;
  }

  .draftJsMentionPlugin__mentionSuggestionsEntryFocused__3LcTd {
    background-color: #e6f3ff;
  }

  .draftJsMentionPlugin__mentionSuggestionsEntryText__3Jobq {
    display: inline-block;
    margin-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 368px;
    font-size: 0.9em;
    margin-bottom: 0.2em;
  }

  .draftJsMentionPlugin__mentionSuggestionsEntryAvatar__1xgA9 {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 12px;
  }

  .draftJsMentionPlugin__mentionSuggestions__2DWjA {
    border: 1px solid #eee;
    margin-top: 0.4em;
    top: 0;
    position: fixed;
    min-width: 220px;
    max-width: 440px;
    background: #fff;
    border-radius: 2px;
    box-shadow: 0px 4px 30px 0px rgba(220, 220, 220, 1);
    cursor: pointer;
    padding-top: 8px;
    padding-bottom: 8px;
    z-index: ${v.zIndex.commentMentions};
    display: -webkit-box;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    flex-direction: column;
    box-sizing: border-box;
    -webkit-transform: scale(0);
    transform: scale(0);
  }

  .mentionSuggestionsEntryContainer {
    display: table;
    width: 100%;
  }

  .mentionSuggestionsEntryContainerLeft,
  .mentionSuggestionsEntryContainerRight {
    display: table-cell;
    vertical-align: middle;
  }

  .mentionSuggestionsEntryContainerRight {
    width: 100%;
    padding-left: 8px;
  }

  .mentionSuggestionsEntryText,
  .mentionSuggestionsEntryTitle {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mentionSuggestionsEntryText {
  }

  .mentionSuggestionsEntryTitle {
    font-size: 80%;
    color: #a7a7a7;
  }
`

export const CustomMentionSuggestion = props => {
  const {
    mention, // eslint-disable-line react/prop-types
    theme, // eslint-disable-line react/prop-types
    searchValue, // eslint-disable-line react/prop-types
    isFocused, // eslint-disable-line react/prop-types
    ...parentProps
  } = props

  return (
    <div {...parentProps}>
      <div className="mentionSuggestionsEntryContainer">
        <div className="mentionSuggestionsEntryContainerLeft">
          <Avatar title={mention.name} url={mention.avatar} size={30} />
        </div>

        <div className="mentionSuggestionsEntryContainerRight">
          <div className="mentionSuggestionsEntryText">{mention.name}</div>

          <div className="mentionSuggestionsEntryTitle">
            {mention.full_name}
          </div>
        </div>
      </div>
    </div>
  )
}
