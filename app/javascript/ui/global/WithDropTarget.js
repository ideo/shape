import { uiStore } from '~/stores'
import { observe } from 'mobx'

const PADDING_V = 20
const PADDING_H = 40

function WithDropTarget(Wrapped) {
  class DropTarget extends React.Component {
    state = { currentlyDraggedOn: null }

    constructor(props) {
      super(props)
      this.innerWrappedRef = React.createRef()
    }

    componentDidMount() {
      const { item } = this.props
      this.disposers = {}
      this.disposers.dropTargeted = observe(
        uiStore,
        'activeDragTarget',
        change => {
          const currentTarget = change.newValue
          if (!currentTarget) {
            this.setState({ currentlyDraggedOn: null })
          } else if (currentTarget.item.identifier === item.identifier) {
            this.setState({ currentlyDraggedOn: currentTarget })
          } else {
            this.setState({ currentlyDraggedOn: null })
          }
        }
      )
      uiStore.addDragTarget(this.props.item, this.coordinates, 'Breadcrumb')
    }

    componentDidUpdate(prevProps) {
      uiStore.addDragTarget(this.props.item, this.coordinates, 'Breadcrumb')
    }

    componentWillUnmount() {
      uiStore.removeDragTarget(this.props.item, this.coordinates, 'Breadcrumb')
    }

    get coordinates() {
      if (!this.innerWrappedRef) return null
      const element = this.innerWrappedRef.current
      const rect = element.getBoundingClientRect()
      const { top, right, bottom, left } = rect
      return {
        top: top - PADDING_V,
        right: right + PADDING_H,
        bottom: bottom + PADDING_V,
        left: left - PADDING_H,
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
  const name = `DropTarget(${Wrapped.displayName || Wrapped.name})`
  DropTarget.displayName = name

  const forwardRef = (props, ref) => <DropTarget {...props} ref={ref} />
  forwardRef.displayName = name
  return React.forwardRef(forwardRef)
}

export default WithDropTarget
