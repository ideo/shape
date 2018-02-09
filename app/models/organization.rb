class Organization < ApplicationRecord
  resourcify

  has_many :collections, -> { root }
  has_many :roles, as: :resource, dependent: :destroy
  has_many :users_roles, through: :roles
  has_many :users, through: :users_roles
  has_many :groups, dependent: :destroy
  belongs_to :primary_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true

  after_create :create_primary_group
  after_save :update_primary_group_name, on: :update, if: :saved_change_to_name?

  delegate :admins, to: :primary_group
  delegate :members, to: :primary_group
  delegate :guests, to: :primary_group

  validates :name, presence: true

  private

  def create_primary_group
    build_primary_group(name: name, organization: self).save
    save # Save primary group attr
  end

  def update_primary_group_name
    primary_group.update_attributes(name: name)
  end
end
