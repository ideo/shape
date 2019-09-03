module MailerHelper
  class Application < Base
    delegate :name, :email, :logo_url,
             :invite_url, :invite_cta,
             to: :@application

    # Note: some of these methods are specific to Creative Difference,
    # and would need to be adapted if we want to enable other applications

    def invite_subject
      "Your invitation to #{org_name.possessive} Creative Difference Dashboard"
    end

    def invite_message
      msg = "You've been invited to join #{org_name.possessive} #{name} account"
      msg += " to view #{group_name.possessive} results" if group_name.present?
      msg + '. To view your results, please click on the button below.'
    end

    def branding_byline
      "#{name} and Shape"
    end

    private

    def invited_to_name
      return invited_to.name if invited_to.respond_to?(:name)

      invited_to
    end

    def group_name
      invited_to_name
        .sub(/C∆\s+-\s+/, '')
        .sub(/\s+Admins/, '')
        .sub(/\s+Members/, '')
    end

    def org_name
      return if invited_to_org_group?

      invited_to.organization.name
    end

    def invited_to_org_group?
      invited_to.is_a?(Group) && invited_to.org_group?
    end
  end
end
