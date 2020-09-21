import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import CollectionIcon from '~/ui/icons/htc/CollectionIcon'
import FeedbackIcon from '~/ui/icons/htc/FeedbackIcon'
import FileIcon from '~/ui/icons/htc/FileIcon'
import FoamcoreIcon from '~/ui/icons/htc/FoamcoreIcon'
import LinkIcon from '~/ui/icons/htc/LinkIcon'
import MoreIcon from '~/ui/icons/MoreIcon'
import ReportIcon from '~/ui/icons/htc/ReportIcon'
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
  z-index: ${props => props.moreMenuOpen && v.zIndex.gridCard};

  &:hover,
  &:active {
    color: ${v.colors.black};
  }
`

const QuadrantIconPositioner = styled.div`
  display: table;
  margin: 0 auto;
  height: 100%;
`

const QuadrantIconHolder = styled.div`
  display: table-cell;
  height: ${props => (props.isMobileXs ? 33 : props.zoomLevel * 44)}px;
  margin: 0 auto;
  max-height: 100px;
  max-width: 100px;
  text-align: center;
  width: ${props => (props.isMobileXs ? 33 : props.zoomLevel * 44)}px;
  vertical-align: middle;
`

const More = styled.button`
  bottom: 6px;
  height: ${props => 28 * props.zoomLevel}px;
  right: 6px;
  position: absolute;
  width: ${props => 28 * props.zoomLevel}px;
  z-index: ${v.zIndex.cardHovering + 1};

  ${props =>
    props.zoomLevel > 1 &&
    `
    bottom: 2px;
    right: 1px;
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
  @observable
  moreTypesOpen = false

  handleClick = ev => {
    const { name } = this.props
    if (name === 'more') {
      runInAction(() => {
        this.moreTypesOpen = true
      })
    } else {
      this.createContent(name)
    }
  }

  handleMore = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    runInAction(() => {
      this.moreTypesOpen = true
    })
  }

  handleNoMore = () => {
    runInAction(() => {
      this.moreTypesOpen = false
    })
  }

  createContent = type => {
    const { onCreateContent } = this.props
    onCreateContent(type)
  }

  get moreMenuItems() {
    const { subTypes } = this.props
    if (!subTypes()) return []
    return subTypes().map(({ name, description, isCategory, subTypes }) => {
      if (isCategory) {
        return {
          name: description,
          onClick: () => {},
          subItems:
            subTypes() &&
            subTypes().map(subType => {
              const TypeIcon = nameToIcon[subType.name]
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
      const TypeIcon = nameToIcon[name]
      return {
        name: description,
        iconLeft: <TypeIcon />,
        onClick: () => this.createContent(name),
      }
    })
  }

  render() {
    const {
      name,
      description,
      displayName,
      subTypes,
      uiStore,
      zoomLevel,
    } = this.props
    const TypeIcon = nameToIcon[name]
    console.log('HotCellQuadrant:render')
    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={description}
        placement="bottom"
      >
        <Quadrant
          moreMenuOpen={this.moreTypesOpen}
          onClick={this.handleClick}
          zoomLevel={zoomLevel}
        >
          <QuadrantIconPositioner>
            <QuadrantIconHolder
              isMobileXs={uiStore.isMobileXs}
              zoomLevel={zoomLevel}
            >
              <TypeIcon />
              {displayName && (
                <SmallHelperText color={v.colors.secondaryMedium}>
                  {description}
                </SmallHelperText>
              )}
            </QuadrantIconHolder>
          </QuadrantIconPositioner>
          {subTypes && (
            <More onClick={this.handleMore} zoomLevel={zoomLevel}>
              {!uiStore.isTouchDevice && <DropdownIcon />}
              <div
                style={{
                  transform: `translateZ(0) scale(${zoomLevel})`,
                }}
              >
                <PopoutMenu
                  hideDotMenu
                  mobileFixedMenu
                  menuOpen={this.moreTypesOpen}
                  menuItems={this.moreMenuItems}
                  onMouseLeave={this.handleNoMore}
                  offsetPosition={{
                    x: 0,
                    y: -40,
                  }}
                  width={280}
                />
              </div>
            </More>
          )}
        </Quadrant>
      </Tooltip>
    )
  }
}

HotCellQuadrant.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onCreateContent: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  subTypes: PropTypes.func,
  displayName: PropTypes.bool,
}
HotCellQuadrant.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
HotCellQuadrant.defaultProps = {
  subTypes: null,
  displayName: false,
}

export default HotCellQuadrant
