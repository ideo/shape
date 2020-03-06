module MailerHelper
  class Base
    attr_reader :invited_to, :invited_to_type, :invited_by, :application, :user

    def initialize(application: nil, invited_to_type: nil, invited_to: nil, invited_by: nil, user: nil)
      @invited_to = invited_to
      @invited_to_type = invited_to_type
      @invited_by = invited_by
      @application = application
      @user = user
    end

    def invite_subject; end

    def invite_message; end

    def branding_byline; end

    def support_message; end

    def invite_from_email
      "#{name} <#{email}>"
    end

    def shape_invite_url
      if user&.pending? && invited_to_organization.present?
        network_invitation = @user.network_invitations.find_by(organization: invited_to_organization)
        if network_invitation.present?
          redirect = router.frontend_path_for(invited_to)
          return router.accept_invitation_url(
            token: network_invitation.token,
            redirect: redirect,
          )
        end
      end
      router.frontend_url_for(invited_to)
    end

    def default?
      false
    end

    def router
      @router ||= MailerHelper::Router.new
    end

    private

    def invited_to_organization
      return unless invited_to.respond_to?(:organization)

      invited_to.organization
    end

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
