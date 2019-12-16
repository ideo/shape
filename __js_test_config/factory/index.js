import { updateModelId } from 'datx'

import { apiStore } from '~/stores'
import Activity from '~/stores/jsonApi/Activity'
import Audience from '~/stores/jsonApi/Audience'
import Collection from '~/stores/jsonApi/Collection'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import CollectionFilter from '~/stores/jsonApi/CollectionFilter'
import DataItemsDataset from '~/stores/jsonApi/DataItemsDataset'
import Dataset from '~/stores/jsonApi/Dataset'
import Comment from '~/stores/jsonApi/Comment'
import CommentThread from '~/stores/jsonApi/CommentThread'
import FilestackFile from '~/stores/jsonApi/FilestackFile'
import Group from '~/stores/jsonApi/Group'
import Item from '~/stores/jsonApi/Item'
import Notification from '~/stores/jsonApi/Notification'
import Organization from '~/stores/jsonApi/Organization'
import QuestionAnswer from '~/stores/jsonApi/QuestionAnswer'
import Role from '~/stores/jsonApi/Role'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import TestAudience from '~/stores/jsonApi/TestAudience'
import User from '~/stores/jsonApi/User'
import UsersThread from '~/stores/jsonApi/UsersThread'
import QuestionChoice from '~/stores/jsonApi/QuestionChoice'

const factoryToModelMappings = {
  'activity': Activity,
  'collection': Collection,
  'collection_card': CollectionCard,
  'collection_filter': CollectionFilter,
  'dataset': Dataset,
  'file_item': Item,
  'text_item': Item,
  'group': Group,
  'notification': Notification,
  'organization': Organization,
  'user': User,
}

const Factory = {
  async create(factoryName, overrides = {}) {
    let factoryData = { data: {} }
    try {
      factoryData = await import(`./data/${factoryName}.json`)
    } catch (e) {
      console.warn(`Not valid data for this factory, ${factoryName}, object will be empty`)
      console.warn(e)
    } finally {
      if (!factoryToModelMappings[factoryName]) {
        throw new Error('This factory does not map to a front end model')
      }
      const Klass = factoryToModelMappings[factoryName]
      const mergedData = Object.assign({}, factoryData.data, overrides)
      // jsonApiStore doesn't like you setting the ID this way
      // if (mergedData.id) delete mergedData.id
      const record = apiStore.add(mergedData, mergedData.type)
      if (overrides.id) updateModelId(record, '2')
      return record
    }
  }
}

export default Factory
