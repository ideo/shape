class TestsController < ApplicationController
  include ApplicationHelper
  include IdeoSsoHelper
  before_action :load_test_collection, only: %i[show token_auth]
  before_action :load_test_audience_into_session, only: %i[show]
  before_action :redirect_to_test, only: %i[show]

  def show
  end

  def completed
    # just to give it something to render
    @collection = Collection::TestCollection.new
    render 'show'
  end

  before_action :look_up_test_audience_invitation, only: :token_auth
  def token_auth
    redirect_to ideo_sso_token_auth_url(@user_token)
  end

  private

  def load_test_collection
    @collection = Collection::TestCollection.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    @collection = Collection::TestCollection.new
    @invalid = true
  end

  # stored so that the saved survey_response is tied to the correct test_audience
  def load_test_audience_into_session
    @test_audience = nil
    if params[:ta].present? || params[:token].present?
      look_up_test_audience
      # if you're invited to a test audience it'll set to `invalid` if that audience is closed
      @invalid = @test_audience.nil? || @test_audience.closed?
    elsif !@collection.link_sharing_enabled?
      # if no test audience param, then you can only view the test if link_sharing_enabled
      @invalid = true
    end
    # will reset to nil if no test_audience
    session[:test_audience_id] = @test_audience&.id
  end

  def look_up_test_audience
    test_audiences = @collection.test_audiences
    # ta is used when we are sourcing people for a test (a manual url param we use)
    if params[:ta].present?
      @test_audience = test_audiences.find_by(id: params[:ta])
    # token is when we have explicitly invited an audience member to take a test
    elsif params[:token].present?
      invitation = TestAudienceInvitation.valid.find_by_invitation_token(params[:token])
      if user_signed_in? && current_user.id == invitation.user_id && test_audiences.include?(invitation.test_audience)
        @test_audience = invitation.test_audience
      end
    end
  end

  def redirect_to_test
    if @collection.submission_box_template_test?
      redirect_to_submission_box_test
    elsif @collection.collection_to_test.present?
      redirect_to_collection_to_test(@collection.collection_to_test)
    elsif @collection.submission_test?
      @next_submission_test = @collection
                              .parent_submission_box
                              .random_next_submission_test(
                                for_user: current_user,
                                omit_id: @collection.id,
                              ).first
    end
  end

  def redirect_to_collection_to_test(collection_to_test)
    redirect_to "#{frontend_url_for(collection_to_test)}?open=tests"
  end

  def redirect_to_submission_box_test
    # first we have to determine if any tests are available for the user
    next_test = @collection.parent_submission_box.random_next_submission_test(for_user: current_user)
    if next_test.present?
      # then it depends if it's an in-collection test, or standalone
      if next_test.collection_to_test.present?
        redirect_to_collection_to_test(next_test.collection_to_test)
        return
      end
      redirect_to "/tests/#{next_test.id}"
      return
    end
    # no tests available
    if @collection.collection_to_test.present?
      redirect_to "#{frontend_url_for(@collection.parent_submission_box)}?testing_completed=true"
      return
    end
    # standalone page
    redirect_to '/tests/completed'
  end

  def look_up_test_audience_invitation
    @user_token = nil
    invitation = TestAudienceInvitation.find_by_invitation_token(params[:token])
    if invitation.nil?
      redirect_to root_url
      return
    end
    store_location_for :user, test_url(invitation.test_collection, token: params[:token])

    user = invitation.user
    # NOTE: if you still have a valid INA session for the wrong user then you'll still be logged in
    # when it does the SSO redirect via ideo_sso_token_auth_url
    sign_out(:user) if user_signed_in? && current_user.id != user.id

    # fetch network token
    @user_token = user.generate_network_auth_token if user.limited?
  end
end
