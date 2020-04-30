class OrganizationShellBuilder
  attr_reader :organization, :errors

  def initialize
    name = next_shell_name
    @organization = Organization.new(name: name, shell: true)
    @errors = @organization.errors
    # mainly just in tests that we don't need this overhead
  end

  def save
    result = @organization.transaction do
      @organization.save!
      create_user_collection
      create_templates
      # TODO create user getting started content and be sure to set collection to
      true
    end
    !result.nil?
  rescue ActiveRecord::RecordInvalid
    false
  end

  private

  def next_shell_name
    last_shell = Organization.shell.last
    return 'shell-0' if last_shell.blank?

    last_number = last_shell.name.split('-').last.to_i
    "shell-#{last_number + 1}"
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
