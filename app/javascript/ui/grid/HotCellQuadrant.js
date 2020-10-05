import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import CollectionIcon from '~/ui/icons/htc/CollectionIcon'
import FeedbackIcon from '~/ui/icons/htc/FeedbackIcon'
import FileIcon from '~/ui/icons/htc/FileIcon'
import FoamcoreIcon from '~/ui/icons/htc/FoamcoreIcon'
import LinkIcon from '~/ui/icons/htc/LinkIcon'
import MoreIcon from '~/ui/icons/MoreIcon'
import ReportIcon from '~/ui/icons/htc/ReportIcon'
import PlusIcon from '~/ui/icons/PlusIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import SearchCollectionIcon from '~/ui/icons/htc/SearchCollectionIcon'
import { SmallHelperText } from '~/ui/global/styled/typography'
import SubmissionBoxIcon from '~/ui/icons/htc/SubmissionBoxIcon'
import TemplateIcon from '~/ui/icons/htc/TemplateIcon'
import TextIcon from '~/ui/icons/htc/TextIcon'
import Tooltip from '~/ui/global/Tooltip'
import VideoIcon from '~/ui/icons/htc/VideoIcon'
import v from '~/utils/variables'

export const Quadrant = styled.div`
  background-color: ${v.colors.primaryLight};
  box-sizing: border-box;
  color: ${v.colors.secondaryMedium};
  float: left;
  height: calc(50% - 1px);
  position: relative;
  width: calc(50% - 1px);

  &:hover,
  &:active {
    color: ${v.colors.black};
  }
`

const QuadrantIconPositioner = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
}
`

const QuadrantIconHolder = styled.div`
  align-items: center;
  display: flex;
  height: auto;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  max-width: 200px;
  text-align: center;
  width: ${props => (props.isMobileXs ? 44 : props.zoomLevel * 44)}px;
  vertical-align: middle;
`

const More = styled.button`
  bottom: 6px;
  height: ${props => 28 * props.zoomLevel}px;
  right: 6px;
  position: absolute;
  width: ${props => 28 * props.zoomLevel}px;
  z-index: ${props => (props.currentMenuOpen ? v.zIndex.gridCardTop : 1)};

  ${props =>
    props.zoomLevel > 1 &&
    `
    bottom: ${-(props.zoomLevel * 8)}px;
    right: ${-(props.zoomLevel * 8)}px;
  `}
`

const nameToIcon = {
  collection: CollectionIcon,
  link: LinkIcon,
  file: FileIcon,
  foamcoreBoard: FoamcoreIcon,
  more: MoreIcon,
  report: ReportIcon,
  searchCollection: SearchCollectionIcon,
  submissionBox: SubmissionBoxIcon,
  template: TemplateIcon,
  testCollection: FeedbackIcon,
  text: TextIcon,
  video: VideoIcon,
}

@inject('uiStore')
@observer
class HotCellQuadrant extends React.Component {
  handleClick = ev => {
    const { name } = this.props
    if (name === 'more') {
      const { onMoreMenuOpen } = this.props
      onMoreMenuOpen()
    } else {
      this.createContent(name)
    }
  }

  handleMore = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { onMoreMenuOpen } = this.props
    onMoreMenuOpen()
  }

  handleNoMore = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { onMoreMenuClose } = this.props
    onMoreMenuClose()
  }

  createContent = type => {
    const { onCreateContent } = this.props
    onCreateContent(type)
  }

  get moreMenuItems() {
    const { subTypes } = this.props
    if (!subTypes()) return []
    return subTypes().map(
      ({ name, component, description, isCategory, subTypes }) => {
        if (isCategory) {
          return {
            name: description,
            onClick: () => {},
            subItems:
              subTypes() &&
              subTypes().map(subType => {
                if (name === 'component') return { component }
                let TypeIcon = nameToIcon[subType.name]
                if (subType.description === 'Create New Template')
                  TypeIcon = PlusIcon
                return {
                  name: subType.description,
                  iconLeft: <TypeIcon />,
                  onClick: () => {
                    this.createContent(subType.name)
                  },
                }
              }),
          }
        }
        if (name === 'component') return { component }
        let TypeIcon = nameToIcon[name]
        if (description === 'Create New Template') TypeIcon = PlusIcon
        return {
          name: description,
          iconLeft: <TypeIcon />,
          onClick: () => this.createContent(name),
        }
      }
    )
  }

  render() {
    const {
      name,
      currentMenuOpen,
      description,
      displayName,
      subTypes,
      uiStore,
      zoomLevel,
    } = this.props
    const TypeIcon = nameToIcon[name]
    return (
      <Quadrant
        moreMenuOpen={currentMenuOpen}
        onClick={this.handleClick}
        zoomLevel={zoomLevel}
        data-cy={`HotCellQuadrant-${name}`}
      >
        <QuadrantIconPositioner>
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            placement="bottom"
            title={description}
            enterDelay={150}
            enterNextDelay={250}
          >
            <QuadrantIconHolder
              isMobileXs={uiStore.isTouchDevice}
              zoomLevel={zoomLevel}
            >
              <TypeIcon />
              {displayName && (
                <SmallHelperText
                  color={v.colors.secondaryMedium}
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    minWidth: '100px',
                    textAlign: 'center',
                  }}
                >
                  {description}
                </SmallHelperText>
              )}
            </QuadrantIconHolder>
          </Tooltip>
        </QuadrantIconPositioner>
        {subTypes && (
          <More
            onClick={this.handleMore}
            zoomLevel={zoomLevel}
            currentMenuOpen={currentMenuOpen}
            data-cy={`HotCellQuadrant-${name}-more`}
          >
            {!uiStore.isTouchDevice && <DropdownIcon />}
            <div
              style={{
                position: 'relative',
                transform: `translateZ(0) scale(${zoomLevel})`,
                zIndex: v.zIndex.gridCardTop + 1,
              }}
            >
              <PopoutMenu
                hideDotMenu
                mobileFixedMenu
                menuOpen={currentMenuOpen}
                menuItems={this.moreMenuItems}
                onMouseLeave={this.handleNoMore}
                onClose={this.handleNoMore}
                offsetPosition={{
                  x: 0,
                  y: -40,
                }}
                title="More"
                width={280}
              />
            </div>
          </More>
        )}
      </Quadrant>
    )
  }
}

HotCellQuadrant.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onCreateContent: PropTypes.func.isRequired,
  onMoreMenuOpen: PropTypes.func.isRequired,
  onMoreMenuClose: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  subTypes: PropTypes.func,
  currentMenuOpen: PropTypes.bool,
  displayName: PropTypes.bool,
}
HotCellQuadrant.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
HotCellQuadrant.defaultProps = {
  subTypes: null,
  displayName: false,
  currentMenuOpen: false,
}

export default HotCellQuadrant
