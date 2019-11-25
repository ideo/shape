# == Schema Information
#
# Table name: audiences
#
#  id                     :bigint(8)        not null, primary key
#  criteria               :string
#  global_default         :integer
#  min_price_per_response :decimal(10, 2)   default(0.0)
#  name                   :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_audiences_on_global_default  (global_default)
#

class Audience < ApplicationRecord
  DEMOGRAPHIC_TAGS = %i[
    ages
    children_ages
    countries
    education_levels
    genders
    adopter_types
    interests
    publications
  ].freeze

  acts_as_taggable_on(DEMOGRAPHIC_TAGS)

  has_many :audience_organizations, dependent: :destroy
  has_many :organizations, through: :audience_organizations
  has_many :test_audiences, dependent: :destroy

  validates :name, presence: true

  delegate :can_edit?,
           :can_view?,
           to: :organization,
           allow_nil: true

  TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE = BigDecimal('4.00')
  MIN_NUM_PAID_QUESTIONS = 10
  TEST_PRICE_PER_QUESTION = BigDecimal('0.12')
  INCENTIVE_PRICE_PER_QUESTION = BigDecimal('0.1')
  MIN_INCENTIVE_PER_RESPONDENT = BigDecimal('1.75')
  # Only used for old survey responses
  LEGACY_INCENTIVE_PER_RESPONDENT = BigDecimal('2.50')
  PAYMENT_WAITING_PERIOD = 1.week

  def self.global_defaults
    where.not(global_default: nil).order(global_default: :asc)
  end

  def self.viewable_by_org(organization)
    # find global or org-connected audiences
    left_joins(:organizations)
      .where(organizations: { id: nil })
      .or(Audience.left_joins(:organizations).where(organizations: { id: organization.id }))
  end

  def self.viewable_by_user_in_org(user:, organization:)
    # get audiences for user (within org) in order of:
    # 1. global defaults (e.g. Share via Link, All People)
    # 2. audiences they have launched tests with recently
    # 3. all other audiences ordered by name
    # - `order` is selected via ROW_NUMBER to preserve sort order on frontend
    order_sql = Arel.sql(%(
      audiences.global_default ASC NULLS LAST,
      MAX(test_audiences.updated_at) DESC NULLS LAST,
      lower(audiences.name) ASC
    ))
    viewable_by_org(organization)
      .joins(%(
        LEFT JOIN test_audiences ON test_audiences.audience_id = audiences.id
        AND test_audiences.launched_by_id = #{user.id}
      ))
      .group('audiences.id', 'organizations.id')
      .select("audiences.*, MAX(test_audiences.updated_at), ROW_NUMBER() OVER (ORDER BY #{order_sql}) as order")
      .order(order_sql)
  end

  def self.price_constants
    {
      'MIN_NUM_PAID_QUESTIONS' => MIN_NUM_PAID_QUESTIONS,
      'TEST_PRICE_PER_QUESTION' => TEST_PRICE_PER_QUESTION,
      'TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE' => TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE,
    }
  end

  # The absolute minimum we can charge per response and not be losing money
  def self.minimum_price_per_response
    min_incentive = incentive_per_response(0)
    payout_cost = min_incentive + Accounting::RecordTransfer.paypal_fee(min_incentive)
    stripe_cost = Accounting::RecordTransfer.stripe_fee(payout_cost)
    (payout_cost + stripe_cost).to_f
  end

  def self.incentive_per_response(num_questions)
    num_questions -= MIN_NUM_PAID_QUESTIONS
    num_questions = 0 if num_questions.negative?
    MIN_INCENTIVE_PER_RESPONDENT + (num_questions * INCENTIVE_PRICE_PER_QUESTION)
  end

  def price_per_response(num_questions)
    return 0 if link_sharing?

    num_questions -= MIN_NUM_PAID_QUESTIONS
    num_questions = 0 if num_questions.negative?
    min_price_per_response + (num_questions * TEST_PRICE_PER_QUESTION)
  end

  def incentive_per_response(num_questions)
    return 0 if link_sharing?

    self.class.incentive_per_response(num_questions)
  end

  def link_sharing?
    # NOTE: for now this logic should suffice, however we could eventually change it
    # to be more explicit, like a bool field on the model
    min_price_per_response.blank? || min_price_per_response.zero?
  end

  def all_tags
    tags = {}
    taggings.each do |tagging|
      category = tagging.context.to_sym
      tags[category] ||= []
      tags[category] << tagging.tag.name
    end
    tags
  end
end
