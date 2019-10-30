# == Schema Information
#
# Table name: question_choices
#
#  id               :bigint(8)        not null, primary key
#  archived         :boolean
#  order            :integer
#  text             :text
#  value            :integer
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  question_item_id :integer
#

class QuestionChoice < ApplicationRecord
  belongs_to :question, class_name: 'Item::QuestionItem'
end
