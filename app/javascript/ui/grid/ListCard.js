import { Fragment } from 'react'
import { Flex } from 'reflexbox'
import { computed, observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ActionMenu from '~/ui/grid/ActionMenu'
import CollectionIconXs from '~/ui/icons/CollectionIconXs'
import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import FileIcon from '~/ui/grid/covers/FileIcon'
import InlineModal from '~/ui/global/modals/InlineModal'
import LinkIcon from '~/ui/icons/LinkIcon'
import ListCoverRenderer from '~/ui/grid/ListCoverRenderer'
import RolesSummary from '~/ui/roles/RolesSummary'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import TextIconXs from '~/ui/icons/TextIconXs'
import VideoIcon from '~/ui/icons/VideoIcon'
import { defaultTimeFormat } from '~/utils/time'
import { DisplayTextCss } from '~/ui/global/styled/typography'
import { uiStore } from '~/stores'
import v, { ITEM_TYPES } from '~/utils/variables'

export const Column = styled.div`
  ${DisplayTextCss}
  align-items: center;
  display: flex;
  margin-left: ${props => props.marginLeft};
  width: ${props => props.width};
`

Column.defaultProps = {
  marginLeft: '0',
  width: 'auto',
}

const Row = styled(Flex)`
  align-items: center;
  height: 50px;
  margin-bottom: 8px;
`

const IconHolder = styled.div`
  color: ${v.colors.commonDark};
  display: flex;
  height: 16px;
  margin-left: 8px;
  width: 16px;
`

const SelectionButton = styled.button`
  display: block;
  width: 100%;

  &:hover {
    background-color: ${v.colors.commonLight};
  }
`

@observer
class ListCard extends React.Component {
  @observable
  reviewersAddOpen = false
  @observable
  currentReviewers = []

  constructor(props) {
    super(props)
    this.rolesWrapperRef = React.createRef()
    if (props.card.record.challenge_reviewer_group) {
      this.currentReviewerRoles =
        props.card.record.challenge_reviewer_group.roles
    }
  }

  @computed
  get menuOpen() {
    return uiStore.actionMenuOpenForCard(this.props.card.id)
  }

  handleActionMenuClick = ev => {
    const { card } = this.props

    uiStore.openContextMenu(ev, {
      card,
    })
  }

  handleCloseMenu = () => {
    // this happens when you mouse off the ActionMenu
    if (this.menuOpen) {
      // if we right-clicked, keep the menu open
      if (!uiStore.cardMenuOpenAndPositioned) {
        uiStore.closeCardMenu()
      }
    }
  }

  handleRolesClick = () => {
    const {
      card: { record },
    } = this.props
    if (record.challenge_reviewer_group) {
      runInAction(() => (this.reviewersAddOpen = true))
    } else {
      uiStore.update('rolesMenuOpen', record)
    }
  }

  handlePotentialReviewerClick = reviewer => {
    // TODO use backend call here
    runInAction(() => {
      this.currentReviewerRoles[0].users.push(reviewer)
      this.currentReviewerRoles[0].activeCount += 1
    })
  }

  handleReviewersClose = () => {
    runInAction(() => (this.reviewersAddOpen = false))
  }

  get renderIcons() {
    const { card } = this.props
    if (card.record.isCollection) {
      return (
        <Fragment>
          <IconHolder>
            <CollectionIconXs />
          </IconHolder>
          <IconHolder>
            <CollectionTypeIcon record={card.record} />
          </IconHolder>
        </Fragment>
      )
    }
    let icon = null
    switch (card.record.type) {
      case ITEM_TYPES.TEXT:
        icon = <TextIconXs />
        break
      case ITEM_TYPES.FILE:
        icon = <FileIcon mimeType={card.record.filestack_file.mimetype} />
        break
      case ITEM_TYPES.VIDEO:
        icon = <VideoIcon />
        break
      case ITEM_TYPES.LINK:
        icon = <LinkIcon />
        break
    }
    return <IconHolder>{icon}</IconHolder>
  }

  get roles() {
    const {
      card: { record },
    } = this.props
    if (record.challenge_reviewer_group) {
      return this.currentReviewerRoles
    }
    return record.roles
  }

  get possibleReviewers() {
    const {
      card: { record },
    } = this.props
    const editorRole = record.roles.find(role => role.name === 'editor')
    const viewerRole = record.roles.find(role => role.name === 'viewer')
    const editors = editorRole ? editorRole.users || [] : []
    const viewers = viewerRole ? viewerRole.users || [] : []
    return [...editors, ...viewers]
  }

  render() {
    const { card } = this.props
    return (
      <Row>
        <Column width="50px">
          <SelectionCircle cardId={card.id} />
        </Column>
        <Column width="500px">
          <ListCoverRenderer
            card={card}
            cardType={card.record.internalType}
            record={card.record}
            height={1}
            handleClick={this.handleRecordClick}
          />
          {card.record.name}
          {this.renderIcons}
        </Column>
        <Column width="400px">{defaultTimeFormat(card.updated_at)}</Column>
        <Column>
          <div ref={this.rolesWrapperRef}>
            <RolesSummary
              key="roles"
              handleClick={this.handleRolesClick}
              roles={[...this.roles]}
              canEdit={card.record.can_edit}
              // convert observable to normal array to trigger render changes
              collaborators={[...card.record.collaborators]}
              rolesMenuOpen={!!uiStore.rolesMenuOpen}
              reviewers
            />
            <InlineModal
              title=""
              onCancel={this.handleReviewersClose}
              open={this.reviewersAddOpen}
              anchorElement={this.rolesWrapperRef.current}
              anchorOrigin={{ horizontal: 'left', vertical: 'center' }}
              noButtons
            >
              {this.possibleReviewers.map(possibleReviewer => (
                <SelectionButton
                  onClick={() =>
                    this.handlePotentialReviewerClick(possibleReviewer)
                  }
                >
                  <EntityAvatarAndName entity={possibleReviewer} />
                </SelectionButton>
              ))}
            </InlineModal>
          </div>
        </Column>
        <Column marginLeft="auto">
          <ActionMenu
            location="GridCard"
            card={card}
            canView={card.record.can_view}
            canEdit={card.record.can_edit}
            canReplace={card.record.canReplace && !card.link}
            menuOpen={this.menuOpen}
            onOpen={this.handleActionMenuClick}
            onLeave={this.handleCloseMenu}
          />
        </Column>
      </Row>
    )
  }
}
ListCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ListCard
