# == Schema Information
#
# Table name: comments
#
#  id                :bigint(8)        not null, primary key
#  draftjs_data      :jsonb
#  edited            :boolean          default(FALSE)
#  message           :text
#  replies_count     :integer          default(0)
#  status            :integer
#  subject_type      :string
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  author_id         :integer
#  comment_thread_id :integer
#  parent_id         :bigint(8)
#  subject_id        :integer
#
# Indexes
#
#  index_comments_on_comment_thread_id            (comment_thread_id)
#  index_comments_on_parent_id                    (parent_id)
#  index_comments_on_subject_id_and_subject_type  (subject_id,subject_type)
#

class Comment < ApplicationRecord
  include Firestoreable

  COMMENTS_PER_PAGE = 25
  REPLIES_PER_PAGE = 25

  paginates_per COMMENTS_PER_PAGE
  has_many :replies,
           -> { order(created_at: :desc) },
           class_name: 'Comment',
           foreign_key: 'parent_id',
           dependent: :destroy
  belongs_to :comment_thread, touch: true
  delegate :can_view?, to: :comment_thread

  belongs_to :author, class_name: 'User'
  belongs_to :parent, class_name: 'Comment', optional: true, counter_cache: :replies_count
  belongs_to :subject,
             optional: true,
             polymorphic: true
  after_create :reopen_parent_after_reply!, if: :parent_is_resolved?
  after_destroy :scrub_highlight_from_subject

  validates :message, presence: true

  enum status: {
    opened: 0,
    resolved: 1,
    reopened: 2,
  }

  def mentions
    mentions = {
      users: [],
      groups: [],
    }
    entity_map = draftjs_data.try(:[], 'entityMap') || {}
    entity_map.each_pair do |_k, v|
      entity = Hashie::Mash.new(v)
      next unless entity.type == 'mention'

      id, type = entity.data.mention.id.split('__')
      mentions[type.to_sym] << id.to_i
    end
    Hashie::Mash.new(
      user_ids: mentions[:users].uniq,
      group_ids: mentions[:groups].uniq,
    )
  end

  def text_highlight
    return unless subject.present? && subject.is_a?(Item::TextItem)

    highlight = ''
    Hashie::Mash.new(subject.data_content).ops.each do |op|
      comment_id = op.attributes&.commentHighlight || op.attributes&.commentHighlightResolved
      if comment_id && comment_id.to_s == id.to_s
        highlight += " #{op.insert}"
      end
    end
    highlight.gsub('\n', ' ')
             .gsub(/\s+/, ' ')
             .strip
  end

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: { Comment: SerializableComment, User: SerializableUser },
      include: %i[author],
      fields: { users: User.basic_api_fields },
    )
  end

  # override Firestoreable method to include related records
  def store_in_batch(batch)
    # store the comment
    batch.set(firestore_doc_id, serialized_for_firestore)
    # store comment_thread to update its `updated_at`
    comment_thread.store_in_batch(batch)
    # ping all the users threads so they get an updated unread_count
    comment_thread.users_threads.each do |ut|
      ut.store_in_batch(batch)
    end
  end

  def can_edit?(user)
    author.id == user.id
  end

  def replies_by_page(page: 1)
    replies.page(page).per(REPLIES_PER_PAGE)
  end

  def reopen_parent_after_reply!
    CommentUpdater.call(
      comment: parent,
      message: parent.message,
      status: :reopened,
      draftjs_data: parent.draftjs_data,
    )
  end

  def parent_is_resolved?
    parent&.resolved?
  end

  def scrub_highlight_from_subject
    TextItemHighlightUpdater.call(self, nil)
  end
end
