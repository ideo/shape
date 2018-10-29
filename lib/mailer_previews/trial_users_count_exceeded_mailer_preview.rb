class TrialUsersCountExceededMailerPreview < ActionMailer::Preview
  def notify
    o = Organization.first
    o.trial_ends_at ||= 1.month.from_now
    TrialUsersCountExceededMailer.notify(o)
  end
end
