import React from 'react'
import { Flex } from 'reflexbox'
import { computed } from 'mobx'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ActionMenu from '~/ui/grid/ActionMenu'
import ListCoverRenderer from '~/ui/grid/ListCoverRenderer'
import { defaultTimeFormat } from '~/utils/time'
import { DisplayTextCss } from '~/ui/global/styled/typography'
import { uiStore } from '~/stores'

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

class ListCard extends React.Component {
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

  render() {
    const { card } = this.props
    return (
      <Row>
        <Column width="400px">
          <ListCoverRenderer
            card={card}
            cardType={card.record.internalType}
            record={card.record}
            height={1}
            handleClick={this.handleRecordClick}
          />
          {card.record.name}
        </Column>
        <Column width="400px">{defaultTimeFormat(card.updated_at)}</Column>
        <Column>PERMISSIONs</Column>
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
