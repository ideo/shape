module MailerHelper
  class Base

    attr_reader :invited_to, :invited_to_type, :invited_by

    def initialize(application: nil, invited_to_type: nil, invited_to: nil, invited_by: nil)
      @invited_to = invited_to
      @invited_to_type = invited_to_type
      @invited_by = invited_by
      @application = application
    end

    def invite_subject; end

    def invite_message; end

    def branding_byline; end

    def support_message; end

    def invite_from_email
      "#{name} <#{email}>"
    end

    def default?
      false
    end

    def router
      @router ||= MailerHelper::Router.new
    end

    private

    def invited_to_name
      return invited_to.name if invited_to.respond_to?(:name)

      invited_to
    end

    def org_name
      return unless invited_to.is_a?(Group)
      return if invited_to_org_group?

      invited_to.organization.name
    end

    def invited_to_org_group?
      invited_to.is_a?(Group) && invited_to.org_group?
    end
  end
end
