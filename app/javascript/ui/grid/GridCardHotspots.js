// import { Meteor } from 'meteor/meteor'
import React from 'react'
// import _ from 'lodash'

import AddItemButton from '~/ui/grid/AddItemButton'

const Hotspot = (props) => (
  <div>
    <div className="Hotspot HotspotR">
      <AddItemButton
        add={props.add}
        collectionId={props.parentId}
        order={props.order + 1}
      />
    </div>
  </div>
)

class GridCardHotspots extends React.PureComponent {
  render() {
    return (
      <div>
        <Hotspot {...this.props} />
        {/* <div className="Hotspot HotspotB">
          <AddItemButton
            collectionId={this.props.parentId}
            order={this.props.order + 1}
          />
        </div> */}
      </div>

    )
  }
}

export default GridCardHotspots
