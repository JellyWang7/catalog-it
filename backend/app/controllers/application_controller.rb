class ApplicationController < ActionController::API
  before_action :authenticate_request
  attr_reader :current_user

  private

  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    
    begin
      @decoded = JsonWebToken.decode(header)
      @current_user = User.find(@decoded[:user_id]) if @decoded
    rescue ActiveRecord::RecordNotFound => e
      render json: { error: 'Unauthorized' }, status: :unauthorized
    rescue => e
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def require_authentication
    render json: { error: 'Not Authorized' }, status: :unauthorized unless @current_user
  end
end
