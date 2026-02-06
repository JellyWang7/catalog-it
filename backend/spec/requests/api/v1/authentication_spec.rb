require 'rails_helper'

RSpec.describe 'Api::V1::Authentication', type: :request do
  let(:valid_user_attributes) do
    {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    }
  end

  describe 'POST /api/v1/auth/signup' do
    context 'with valid parameters' do
      it 'creates a new user' do
        expect {
          post '/api/v1/auth/signup', params: { user: valid_user_attributes }
        }.to change(User, :count).by(1)
      end

      it 'returns a token' do
        post '/api/v1/auth/signup', params: { user: valid_user_attributes }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)).to include('token')
      end

      it 'returns user data' do
        post '/api/v1/auth/signup', params: { user: valid_user_attributes }
        json = JSON.parse(response.body)
        expect(json['user']).to include(
          'username' => 'testuser',
          'email' => 'test@example.com',
          'role' => 'user'
        )
      end

      it 'does not return password_digest' do
        post '/api/v1/auth/signup', params: { user: valid_user_attributes }
        json = JSON.parse(response.body)
        expect(json['user']).not_to have_key('password_digest')
      end
    end

    context 'with invalid parameters' do
      it 'returns error for missing email' do
        post '/api/v1/auth/signup', params: { 
          user: valid_user_attributes.except(:email) 
        }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)).to have_key('errors')
      end

      it 'returns error for duplicate email' do
        create(:user, email: 'test@example.com')
        post '/api/v1/auth/signup', params: { user: valid_user_attributes }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)['errors']).to include(
          match(/Email has already been taken/)
        )
      end

      it 'returns error for password mismatch' do
        post '/api/v1/auth/signup', params: { 
          user: valid_user_attributes.merge(password_confirmation: 'different') 
        }
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error for invalid email format' do
        post '/api/v1/auth/signup', params: { 
          user: valid_user_attributes.merge(email: 'invalid_email') 
        }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    context 'with valid credentials' do
      it 'returns a token' do
        post '/api/v1/auth/login', params: { 
          user: { email: 'test@example.com', password: 'password123' } 
        }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('token')
      end

      it 'returns user data' do
        post '/api/v1/auth/login', params: { 
          user: { email: 'test@example.com', password: 'password123' } 
        }
        json = JSON.parse(response.body)
        expect(json['user']).to include(
          'email' => 'test@example.com',
          'role' => 'user'
        )
      end

      it 'returns success message' do
        post '/api/v1/auth/login', params: { 
          user: { email: 'test@example.com', password: 'password123' } 
        }
        expect(JSON.parse(response.body)['message']).to eq('Login successful')
      end
    end

    context 'with invalid credentials' do
      it 'returns error for wrong password' do
        post '/api/v1/auth/login', params: { 
          user: { email: 'test@example.com', password: 'wrongpassword' } 
        }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Invalid email or password')
      end

      it 'returns error for non-existent email' do
        post '/api/v1/auth/login', params: { 
          user: { email: 'nonexistent@example.com', password: 'password123' } 
        }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Invalid email or password')
      end

      it 'returns error for missing email' do
        post '/api/v1/auth/login', params: { 
          user: { password: 'password123' } 
        }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/auth/me' do
    let!(:user) { create(:user) }
    let(:token) { JsonWebToken.encode(user_id: user.id) }

    context 'with valid token' do
      it 'returns current user data' do
        get '/api/v1/auth/me', headers: { 
          'Authorization' => "Bearer #{token}" 
        }
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['user']['id']).to eq(user.id)
        expect(json['user']['email']).to eq(user.email)
      end

      it 'does not return password_digest' do
        get '/api/v1/auth/me', headers: { 
          'Authorization' => "Bearer #{token}" 
        }
        json = JSON.parse(response.body)
        expect(json['user']).not_to have_key('password_digest')
      end
    end

    context 'without token' do
      it 'returns unauthorized error' do
        get '/api/v1/auth/me'
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    context 'with invalid token' do
      it 'returns unauthorized error' do
        get '/api/v1/auth/me', headers: { 
          'Authorization' => 'Bearer invalid_token' 
        }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with expired token' do
      it 'returns unauthorized error' do
        expired_token = JsonWebToken.encode({ user_id: user.id }, 1.hour.ago)
        get '/api/v1/auth/me', headers: { 
          'Authorization' => "Bearer #{expired_token}" 
        }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
