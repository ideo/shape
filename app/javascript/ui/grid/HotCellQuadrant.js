import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import CollectionIcon from '~/ui/icons/htc/CollectionIcon'
import FeedbackIcon from '~/ui/icons/htc/FeedbackIcon'
import FileIcon from '~/ui/icons/htc/FileIcon'
import FoamcoreIcon from '~/ui/icons/htc/FoamcoreIcon'
import LinkIcon from '~/ui/icons/htc/LinkIcon'
import ReportIcon from '~/ui/icons/htc/ReportIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import SearchCollectionIcon from '~/ui/icons/htc/SearchCollectionIcon'
import SubmissionBoxIcon from '~/ui/icons/htc/SubmissionBoxIcon'
import TemplateIcon from '~/ui/icons/htc/TemplateIcon'
import TextIcon from '~/ui/icons/htc/TextIcon'
import Tooltip from '~/ui/global/Tooltip'
import VideoIcon from '~/ui/icons/htc/VideoIcon'
import v from '~/utils/variables'

export const Quadrant = styled.div`
  background-color: ${v.colors.primaryLight};
  box-sizing: border-box;
  float: left;
  height: calc(50% - 1px);
  padding-bottom: 14%;
  padding-left: 20%;
  padding-right: 20%;
  padding-top: 14%;
  position: relative;
  width: calc(50% - 1px);
  z-index: ${props => props.moreMenuOpen && v.zIndex.gridCard};
`

const More = styled.button`
  bottom: 6px;
  height: 28px;
  right: 6px;
  position: absolute;
  width: 28px;
  z-index: ${v.zIndex.cardHovering + 1};
`

const nameToIcon = {
  collection: CollectionIcon,
  link: LinkIcon,
  file: FileIcon,
  foamcore: FoamcoreIcon,
  report: ReportIcon,
  searchCollection: SearchCollectionIcon,
  submissionBox: SubmissionBoxIcon,
  template: TemplateIcon,
  testCollection: FeedbackIcon,
  text: TextIcon,
  video: VideoIcon,
}

@observer
class HotCellQuadrant extends React.Component {
  @observable
  moreTypesOpen = false

  handleClick = ev => {
    const { name } = this.props
    this.createContent(name)
  }

  handleMore = ev => {
    console.log('handleMore')
    runInAction(() => {
      this.moreTypesOpen = true
    })
  }

  handleNoMore = () => {
    runInAction(() => {
      this.moreTypesOpen = false
    })
  }

  createContent = type => {}

  get moreMenuItems() {
    const { subTypes } = this.props
    if (!subTypes()) return []
    return subTypes().map(({ name, description }) => ({
      name: description,
      iconLeft: nameToIcon[name],
      onClick: () => this.createContent(name),
    }))
  }

  render() {
    const { name, description, subTypes } = this.props
    const TypeIcon = nameToIcon[name]
    console.log('quadrant', subTypes)
    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={description}
        placement="bottom"
      >
        <Quadrant onClick={this.handleClick} moreMenuOpen={this.moreTypesOpen}>
          <TypeIcon />
          {subTypes && (
            <More onClick={this.handleMore}>
              <DropdownIcon />
              <PopoutMenu
                hideDotMenu
                menuOpen={this.moreTypesOpen}
                menuItems={this.moreMenuItems}
                onMouseLeave={this.handleNoMore}
                offsetPosition={{
                  x: 0,
                  y: -40,
                }}
              />
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
  subTypes: PropTypes.func,
}
HotCellQuadrant.defaultProps = {
  subTypes: null,
}

export default HotCellQuadrant
