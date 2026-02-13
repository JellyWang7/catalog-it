module Api
  module V1
    class AuthenticationController < ApplicationController
      skip_before_action :authenticate_request, only: [:signup, :login]

      # POST /api/v1/auth/signup
      def signup
        user = User.new(user_params)
        # Status defaults to 'active' in database
        
        if user.save
          token = JsonWebToken.encode(user_id: user.id)
          render json: {
            message: 'Account created successfully',
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status
            }
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: login_params[:email])
        
        if user&.authenticate(login_params[:password])
          # Check if user account is active
          unless user.active?
            status_message = case user.status
            when 'suspended' then 'Your account has been suspended. Please contact support.'
            when 'deleted' then 'This account has been deleted.'
            else 'Your account is not active.'
            end
            
            render json: { error: status_message }, status: :forbidden
            return
          end
          
          token = JsonWebToken.encode(user_id: user.id)
          render json: {
            message: 'Login successful',
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status
            }
          }, status: :ok
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # GET /api/v1/auth/me
      def me
        unless current_user
          render json: { error: 'Unauthorized' }, status: :unauthorized
          return
        end
        
        render json: {
          user: {
            id: current_user.id,
            username: current_user.username,
            email: current_user.email,
            role: current_user.role,
            status: current_user.status
          }
        }, status: :ok
      end

      private

      def user_params
        params.require(:user).permit(:username, :email, :password, :password_confirmation)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
