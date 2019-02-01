import { uiStore } from '~/stores'

function WithDropTarget(Wrapped) {
  class DropTarget extends React.Component {
    constructor(props) {
      super(props)
      this.wrapperRef = React.createRef()
    }

    componentDidMount() {
      const { record } = this.props
      uiStore.addDragTarget(record, this.coordinates)
      // this.disposers = {}
      // this.disposers.dropTargeted = observe(
      //   uiStore,
      //   'currentDraggedOverTarget',
      //   change => {
      //     if (change.draggedTarget.id === record.id) {
      //     }
      //   }
      // )
    }

    get coordinates() {
      if (!this.wrapperRef) return null
      const rect = this.wrapperRef.getBoundingClientRect()
      const { top, right, bottom, left } = rect
      return {
        top,
        right,
        bottom,
        left,
      }
    }

    render() {
      return <Wrapped {...this.props} ref={ref => (this.wrapperRef = ref)} />
    }
  }
  DropTarget.displayName = `DropTarget(${Wrapped.displayName || Wrapped.name})`
  return DropTarget
}

export default WithDropTarget
