import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'
import AutoComplete from '~/ui/global/AutoComplete'


class RolesAdd extends React.Component {
  onUserSearch = (searchTerm) => {
    return this.props.onSearch(searchTerm).then((res) => {
      return res.data.map((user) => {
        return { value: user, label: user.name }
      })
    })
  }

  render() {
    return (
      <AutoComplete onInputChange={this.onUserSearch}/>
    )
  }
}

RolesAdd.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
}
RolesAdd.defaultProps = {
  onSearch: () => {}
}

export default RolesAdd
