class OrganizationShellBuilder
  attr_reader :organization, :errors

  def initialize(full_setup = false)
    name = next_shell_name
    @organization = Organization.new(name: name, shell: true)
    @errors = @organization.errors
    # mainly just in tests that we don't need this overhead
    @full_setup = full_setup
  end

  def save
    result = @organization.transaction do
      @organization.save!
      if @full_setup
        create_user_collection
        create_templates
      end
      true
    end
    !result.nil?
  rescue ActiveRecord::RecordInvalid
    false
  end

  private

  def next_shell_name
    last_shell = Organization.where(shell: true).last
    return 'shell-0' if last_shell.blank?

    last_number = last_shell.name.split('-').last.to_i
    "shell-#{last_number + 1}"
  end

  def setup_user_membership_and_collections
    @organization.setup_user_membership_and_collections(@user)
  end

  def create_user_collection
    Collection::UserCollection.create(
      organization: @organization,
    )
  end

  def create_templates
    # Create templates after membership has been setup correctly
    OrganizationTemplates.call(@organization, nil)
  end
end
