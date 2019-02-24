class ApplicationMailer < ActionMailer::Base
  include Roadie::Rails::Automatic
  include ApplicationHelper

  default from: 'Shape <hello@shape.space>'
  layout 'mailer'

  def mail(**args)
    if args[:users].present? && restrict_to_ideo_products?
      products_group_user_ids = Group.find(::IDEO_PRODUCTS_GROUP_ID).user_ids
      args[:subject] = "[Shape #{ENV['SHAPE_APP']}] #{args[:subject]}"
      args[:to] = args[:users].select { |u| products_group_user_ids.include?(u.id) }.map(&:email)
    end
    if args[:to].empty?
      # could happen if we deleted users above
      # -- OR --
      # in a worker that emails all admins, and there are no admins left
      return
    end
    args.delete :users
    super(args)
  rescue ActiveRecord::RecordNotFound
    logger.error 'Products group not found.'
  end

  def restrict_to_ideo_products?
    # Heroku apps are all Rails.env.production however not all of them are "production";
    # for those ones (e.g. development, staging), we don't want to send real emails to anyone
    # outside of the IDEO Products Group
    ENV['SHAPE_APP'] != 'production' && (!Rails.env.test? || ENV['SHAPE_APP'] == 'test-restriction')
  end
end
