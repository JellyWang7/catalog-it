module Api
  module V1
    class AuthenticationController < ApplicationController
      skip_before_action :authenticate_request, only: [:signup, :login]

      # POST /api/v1/auth/signup
      def signup
        user = User.new(user_params)
        
        if user.save
          token = JsonWebToken.encode(user_id: user.id)
          render json: {
            message: 'Account created successfully',
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
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
          token = JsonWebToken.encode(user_id: user.id)
          render json: {
            message: 'Login successful',
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          }, status: :ok
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # GET /api/v1/auth/me
      def me
        render json: {
          user: {
            id: current_user.id,
            username: current_user.username,
            email: current_user.email,
            role: current_user.role
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
