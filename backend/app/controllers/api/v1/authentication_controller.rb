module Api
  module V1
    class AuthenticationController < ApplicationController
      skip_before_action :authenticate_request, only: [:signup, :login, :forgot_password, :reset_password]

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

      # POST /api/v1/auth/forgot_password
      def forgot_password
        user = User.find_by(email: forgot_password_params[:email])

        if user&.active?
          token = user.generate_password_reset_token!
          # In production, send email here with ActionMailer
          # For development/demo, include the token in the response
          reset_url = "#{request.protocol}#{request.host_with_port.gsub('3000', '5173')}/reset-password?token=#{token}"
          Rails.logger.info "PASSWORD RESET LINK: #{reset_url}"

          response_data = { message: 'If an account exists with that email, a reset link has been sent.' }
          # Include token in development for demo convenience
          response_data[:reset_token] = token unless Rails.env.production?
          render json: response_data, status: :ok
        else
          # Always return success to prevent email enumeration
          render json: { message: 'If an account exists with that email, a reset link has been sent.' }, status: :ok
        end
      end

      # POST /api/v1/auth/reset_password
      def reset_password
        user = User.find_by(reset_password_token: reset_password_params[:token])

        if user.nil?
          render json: { error: 'Invalid or expired reset token' }, status: :unprocessable_entity
          return
        end

        unless user.password_reset_token_valid?
          render json: { error: 'Reset token has expired. Please request a new one.' }, status: :unprocessable_entity
          return
        end

        if user.reset_password!(reset_password_params[:password], reset_password_params[:password_confirmation])
          render json: { message: 'Password has been reset successfully. You can now log in.' }, status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def user_params
        params.require(:user).permit(:username, :email, :password, :password_confirmation)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end

      def forgot_password_params
        params.permit(:email)
      end

      def reset_password_params
        params.permit(:token, :password, :password_confirmation)
      end
    end
  end
end
