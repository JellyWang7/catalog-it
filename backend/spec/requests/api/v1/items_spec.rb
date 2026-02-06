require 'rails_helper'

RSpec.describe "Api::V1::Items", type: :request do
  let(:user) { create(:user) }
  let(:token) { JsonWebToken.encode(user_id: user.id) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:list) { create(:list, user: user, visibility: 'public') }
  let!(:items) { create_list(:item, 3, list: list) }

  describe "GET /api/v1/lists/:list_id/items" do
    before { get "/api/v1/lists/#{list.id}/items" }

    it "returns HTTP success" do
      expect(response).to have_http_status(:success)
    end

    it "returns JSON content type" do
      expect(response.content_type).to include('application/json')
    end

    it "returns all items for the list" do
      json_response = JSON.parse(response.body)
      expect(json_response.size).to eq(3)
    end
  end

  describe "GET /api/v1/items/:id" do
    let(:item) { items.first }

    context "when the item exists" do
      before { get "/api/v1/items/#{item.id}" }

      it "returns HTTP success" do
        expect(response).to have_http_status(:success)
      end

      it "returns the correct item" do
        json_response = JSON.parse(response.body)
        expect(json_response['id']).to eq(item.id)
        expect(json_response['name']).to eq(item.name)
        expect(json_response['list_id']).to eq(list.id)
      end
    end

    context "when the item does not exist" do
      before { get "/api/v1/items/99999" }

      it "returns not found status" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/lists/:list_id/items" do
    let(:valid_attributes) do
      {
        item: {
          name: 'Test Item',
          category: 'test',
          notes: 'Test notes',
          rating: 4
        }
      }
    end

    let(:invalid_attributes) do
      {
        item: {
          name: '',
          rating: 10
        }
      }
    end

    context "with valid parameters" do
      it "creates a new Item" do
        expect {
          post "/api/v1/lists/#{list.id}/items", params: valid_attributes, headers: auth_headers, as: :json
        }.to change(Item, :count).by(1)
      end

      it "returns HTTP created status" do
        post "/api/v1/lists/#{list.id}/items", params: valid_attributes, headers: auth_headers, as: :json
        expect(response).to have_http_status(:created)
      end

      it "returns the created item" do
        post "/api/v1/lists/#{list.id}/items", params: valid_attributes, headers: auth_headers, as: :json
        json_response = JSON.parse(response.body)
        expect(json_response['name']).to eq('Test Item')
        expect(json_response['list_id']).to eq(list.id)
      end

      it "allows nil rating" do
        post "/api/v1/lists/#{list.id}/items", params: { item: { name: 'Unrated Item', rating: nil } }, headers: auth_headers, as: :json
        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        expect(json_response['rating']).to be_nil
      end
    end

    context "with invalid parameters" do
      it "does not create a new Item" do
        expect {
          post "/api/v1/lists/#{list.id}/items", params: invalid_attributes, headers: auth_headers, as: :json
        }.not_to change(Item, :count)
      end

      it "returns unprocessable entity status" do
        post "/api/v1/lists/#{list.id}/items", params: invalid_attributes, headers: auth_headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "PATCH /api/v1/items/:id" do
    let(:item) { items.first }
    let(:new_attributes) do
      {
        item: {
          name: 'Updated Item Name',
          rating: 5
        }
      }
    end

    context "with valid parameters" do
      before { patch "/api/v1/items/#{item.id}", params: new_attributes, headers: auth_headers, as: :json }

      it "returns HTTP success" do
        expect(response).to have_http_status(:success)
      end

      it "updates the item" do
        item.reload
        expect(item.name).to eq('Updated Item Name')
        expect(item.rating).to eq(5)
      end
    end

    context "with invalid parameters" do
      let(:invalid_attributes) { { item: { name: '', rating: 10 } } }

      before { patch "/api/v1/items/#{item.id}", params: invalid_attributes, headers: auth_headers, as: :json }

      it "returns unprocessable entity status" do
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "does not update the item" do
        item.reload
        expect(item.name).not_to eq('')
      end
    end
  end

  describe "DELETE /api/v1/items/:id" do
    let!(:item) { items.first }

    it "destroys the requested item" do
      expect {
        delete "/api/v1/items/#{item.id}", headers: auth_headers
      }.to change(Item, :count).by(-1)
    end

    it "returns no content status" do
      delete "/api/v1/items/#{item.id}", headers: auth_headers
      expect(response).to have_http_status(:no_content)
    end
  end
end
