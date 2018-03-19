import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import { TextField } from 'material-ui'
import AutosizeInput from 'react-input-autosize'

import PageWithApi from '~/ui/pages/PageWithApi'
import PageContainer from '~/ui/layout/PageContainer'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import H1 from '~/ui/global/H1'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'
import VideoItem from '~/ui/items/VideoItem'
import v, { ITEM_TYPES } from '~/utils/variables'

const ItemPageContainer = styled.main`
  background: white;
  min-height: 75vh;
  position: relative;
`

const StyledName = styled.div`
  .input__name {
    width: 30vw;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
    input {
      z-index: ${v.zIndex.aboveClickWrapper};
      position: relative;
      font-size: 2.25rem;
      font-family: 'Gotham';
      letter-spacing: 2px;
      padding: 0.15rem 0 0.5rem 0;
      background-color: transparent;
      border-left: none;
      border-top: none;
      border-right: none;
      border-bottom: 1px solid ${v.colors.blackLava};
      &:focus {
        outline: 0;
      }
    }
  }
`

const StyledRightColumn = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
`

const CloseLink = styled(Link)`
  /* add the .close class for more specificity to override quill theme-snow */
  text-decoration: none;
  color: ${v.colors.cloudy};
  &:hover {
    color: ${v.colors.linkHover};
  }
  padding: 0;
  height: auto;
  position: relative;
  top: -6px;
  font-size: 1.75rem;
`

@inject('apiStore', 'uiStore')
@observer
class ItemPage extends PageWithApi {
  constructor(props) {
    super(props)
    this.saveItem = _.debounce(this.saveItem, 1000)
    this.state = {}
  }

  componentWillMount() {
    const { match, apiStore } = this.props
    return apiStore
      .fetch('items', match.params.id)
      .then(response => {
        const item = response.data
        this.setState({ item })
      })
  }

  get item() {
    const { apiStore } = this.props
    if (!apiStore.items.length) return null
    return this.state.item
  }

  // could be smarter or broken out once we want to do different things per type
  get content() {
    const { item } = this.state
    // similar function as in GridCard, could extract?
    switch (item.type) {
    case ITEM_TYPES.TEXT:
      return <TextItem item={item} />
    case ITEM_TYPES.IMAGE:
      return <ImageItem item={item} backgroundSize="contain" />
    case ITEM_TYPES.VIDEO:
      return <VideoItem item={item} />
    default:
      return (
        <div>Item not found.</div>
      )
    }
  }

  get renderName() {
    const { item } = this.state
    const { editingItemName } = this.props.uiStore
    if (editingItemName) {
      const clickHandlers = [
        () => this.props.uiStore.stopEditingItemName()
      ]
      return (
        <StyledName>
          <AutosizeInput
            className="input__name"
            style={{ fontSize: '2.25rem' }}
            value={item.name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
          />
          <ClickWrapper
            clickHandlers={clickHandlers}
            zIndex={900}
          />
        </StyledName>
      )
    }
    return (
      <StyledName>
        <H1 onClick={this.startEditingName}>{item.name}</H1>
      </StyledName>
    )
  }

  onNameFieldKeypress = (e) => {
    if (e.key === 'Enter') {
      const { uiStore } = this.props
      uiStore.stopEditingItemName()
    }
  }

  onNameChange = (e) => {
    const name = e.target.value
    const { item } = this.state
    item.name = name
    this.setState({ item })
    this.saveItem()
  }

  saveItem = () => {
    const { item } = this.state
    item.save()
  }

  startEditingName = (e) => {
    e.stopPropagation()
    const { uiStore } = this.props
    uiStore.startEditingItemName()
  }

  requestPath = (props) => {
    const { match } = props
    return `items/${match.params.id}`
  }

  render() {
    const { item } = this.state
    if (!item) return <Loader />
    return (
      <Fragment>
        <Header>
          <Breadcrumb items={item.breadcrumb} />
          {this.renderName}
        </Header>
        <ItemPageContainer>
          <PageContainer>
            {/* TODO: calculate item container size? */}
            {this.content}
            <StyledRightColumn>
              <CloseLink to={item.parentPath}>
                &times;
              </CloseLink>
            </StyledRightColumn>
          </PageContainer>
        </ItemPageContainer>
      </Fragment>
    )
  }
}

ItemPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
}
ItemPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ItemPage
