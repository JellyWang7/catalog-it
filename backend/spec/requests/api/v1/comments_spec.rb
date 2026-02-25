require 'rails_helper'

RSpec.describe "Api::V1::Comments", type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:token) { JsonWebToken.encode(user_id: user.id) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:list) { create(:list, :public, user: other_user) }
  let!(:comment) { create(:comment, list: list, user: other_user) }

  describe "GET /api/v1/lists/:list_id/comments" do
    it "returns comments for public lists" do
      get "/api/v1/lists/#{list.id}/comments"

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.first['id']).to eq(comment.id)
      expect(json.first['user']['id']).to eq(other_user.id)
    end

    it "blocks comments for private lists" do
      private_list = create(:list, visibility: 'private', user: other_user)
      get "/api/v1/lists/#{private_list.id}/comments"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/lists/:list_id/comments" do
    let(:valid_params) { { comment: { body: 'Great list!' } } }

    it "requires authentication" do
      post "/api/v1/lists/#{list.id}/comments", params: valid_params, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a comment for authenticated users" do
      expect do
        post "/api/v1/lists/#{list.id}/comments", params: valid_params, headers: auth_headers, as: :json
      end.to change(Comment, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['body']).to eq('Great list!')
      expect(json['user_id']).to eq(user.id)
    end

    it "blocks list owner from commenting on own list" do
      owner_token = JsonWebToken.encode(user_id: other_user.id)
      owner_headers = { 'Authorization' => "Bearer #{owner_token}" }

      expect do
        post "/api/v1/lists/#{list.id}/comments", params: valid_params, headers: owner_headers, as: :json
      end.not_to change(Comment, :count)

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to eq('List owners cannot comment on their own lists')
    end

    it "rejects profanity in comment body" do
      expect do
        post "/api/v1/lists/#{list.id}/comments",
             params: { comment: { body: 'This list is shit' } },
             headers: auth_headers,
             as: :json
      end.not_to change(Comment, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      errors = JSON.parse(response.body)['errors']
      expect(errors).to include('Content contains inappropriate language.')
    end

    it "rejects obfuscated slur variants" do
      expect do
        post "/api/v1/lists/#{list.id}/comments",
             params: { comment: { body: 'you are n1gg@' } },
             headers: auth_headers,
             as: :json
      end.not_to change(Comment, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      errors = JSON.parse(response.body)['errors']
      expect(errors).to include('Content contains inappropriate language.')
    end
  end

  describe "DELETE /api/v1/comments/:id" do
    it "allows comment owner to delete comment" do
      owned_comment = create(:comment, user: user, list: list)

      expect do
        delete "/api/v1/comments/#{owned_comment.id}", headers: auth_headers
      end.to change(Comment, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "allows list owner to moderate comment deletion" do
      owner_token = JsonWebToken.encode(user_id: other_user.id)
      owner_headers = { 'Authorization' => "Bearer #{owner_token}" }

      expect do
        delete "/api/v1/comments/#{comment.id}", headers: owner_headers
      end.to change(Comment, :count).by(-1)
    end

    it "forbids non-owner users" do
      third_user = create(:user)
      third_token = JsonWebToken.encode(user_id: third_user.id)
      third_headers = { 'Authorization' => "Bearer #{third_token}" }

      delete "/api/v1/comments/#{comment.id}", headers: third_headers
      expect(response).to have_http_status(:forbidden)
    end
  end
end
