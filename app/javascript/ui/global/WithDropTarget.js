import { uiStore } from '~/stores'
import { observe } from 'mobx'

function WithDropTarget(Wrapped) {
  class DropTarget extends React.Component {
    state = { currentlyDraggedOn: null }

    constructor(props) {
      super(props)
      this.innerWrappedRef = React.createRef()
    }

    componentDidMount() {
      const { identifier } = this.props
      this.disposers = {}
      this.disposers.dropTargeted = observe(
        uiStore,
        'activeDragTarget',
        change => {
          const currentTarget = change.newValue
          if (!currentTarget) {
            this.setState({ currentlyDraggedOn: null })
          } else if (currentTarget.identifier === identifier) {
            this.setState({ currentlyDraggedOn: currentTarget })
          } else {
            this.setState({ currentlyDraggedOn: null })
          }
        }
      )
    }

    componentWillReceiveProps(newProps) {
      const { identifier } = newProps
      uiStore.addDragTarget(identifier, this.coordinates, 'Breadcrumb')
    }

    get coordinates() {
      if (!this.innerWrappedRef) return null
      const element = this.innerWrappedRef.current
      const rect = element.getBoundingClientRect()
      const { top, right, bottom, left } = rect
      return {
        top,
        right,
        bottom,
        left,
      }
    }

    render() {
      const { forwardedRef, ...rest } = this.props
      return (
        <Wrapped
          {...rest}
          forwardedRef={this.innerWrappedRef}
          currentlyDraggedOn={this.state.currentlyDraggedOn}
        />
      )
    }
  }
  DropTarget.displayName = `DropTarget(${Wrapped.displayName || Wrapped.name})`

  function forwardRef(props, ref) {
    return <DropTarget {...props} ref={ref} />
  }
  return React.forwardRef(forwardRef)
}

export default WithDropTarget
