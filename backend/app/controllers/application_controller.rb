class ApplicationController < ActionController::API
  include BlobUrlOptions

  before_action :authenticate_request
  attr_reader :current_user

  private

  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    
    return unless header
    
    begin
      @decoded = JsonWebToken.decode(header)
      
      if @decoded && @decoded[:user_id]
        user = User.find(@decoded[:user_id])
        # Only set current_user if account is active
        @current_user = user if user&.active?
      end
    rescue ActiveRecord::RecordNotFound
      @current_user = nil
    rescue => e
      @current_user = nil
    end
  end

  def require_authentication
    render json: { error: 'Not Authorized' }, status: :unauthorized unless @current_user
  end

  # Always try to authenticate but don't require it (for public endpoints)
  def authenticate_request_optional
    authenticate_request
  end

  # Require authentication (for protected endpoints)
  def authenticate_request_required
    authenticate_request
    unless @current_user
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
end
