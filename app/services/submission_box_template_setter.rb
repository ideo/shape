class SubmissionBoxTemplateSetter < SimpleService
  attr_reader :errors
  attr_reader :dup

  def initialize(submission_box:, template_card: nil, submission_box_type:, user:)
    @submission_box = submission_box
    @template_card = template_card
    @submission_box_type = submission_box_type
    @user = user
  end

  def call
    duplicate_template_card if @template_card.present?
    set_template
    delete_unused_templates
    update_submission_names
    @dup
  end

  private

  def duplicate_template_card
    @dup = @template_card.duplicate!(
      for_user: @user,
      parent: @submission_box,
      placement: 'end',
    )
    @dup.collection.remove_all_viewer_roles
    @dup.collection.update(name: "#{@submission_box.name} #{@dup.collection.name}")
    @dup.update(width: 1, height: 1)
    @dup.collection.add_submission_box_tag
  end

  def set_template
    @submission_box.update(
      submission_template: @dup.present? ? @dup.collection : nil,
      submission_box_type: @submission_box_type,
    )
  end

  def delete_unused_templates
    old_templates = @submission_box.collections
                                   .where(master_template: true)
                                   .where.not(
                                     id: @dup.collection.id,
                                   )
    old_templates.each do |template|
      existing = @submission_box.submissions_collection.collections.find_by(
        template_id: template.id,
      )
      unless existing
        template.destroy
      end
    end
  end

  def update_submission_names
    @submission_box.submissions_collection.collections.each do |collection|
      next if collection.name.include? '[Inactive]'
      collection.update(name: "[Inactive] #{collection.name}")
    end
  end
end
