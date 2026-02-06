# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/items', type: :request do
  path '/api/v1/lists/{list_id}/items' do
    parameter name: 'list_id', in: :path, type: :integer, description: 'List ID'

    get('List all items in a list') do
      tags 'Items'
      produces 'application/json'
      description 'Retrieves all items belonging to a specific list'

      response(200, 'successful') do
        schema type: :array,
          items: { '$ref' => '#/components/schemas/Item' }

        let(:list_id) { create(:list).id }
        let!(:item) { create(:item, list_id: list_id) }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data).to be_an(Array)
        end
      end

      response(404, 'list not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:list_id) { 'invalid' }

        run_test!
      end
    end

    post('Create a new item in a list') do
      tags 'Items'
      consumes 'application/json'
      produces 'application/json'
      description 'Creates a new item in a specific list'

      parameter name: :item, in: :body, schema: {
        type: :object,
        properties: {
          item: {
            type: :object,
            properties: {
              title: { type: :string },
              description: { type: :string }
            },
            required: ['title']
          }
        },
        required: ['item']
      }

      response(201, 'item created') do
        schema '$ref' => '#/components/schemas/Item'

        let(:list_id) { create(:list).id }
        let(:item) do
          {
            item: {
              title: 'New Item',
              description: 'A brand new item'
            }
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['title']).to eq('New Item')
        end
      end

      response(422, 'invalid request') do
        schema '$ref' => '#/components/schemas/Error'

        let(:list_id) { create(:list).id }
        let(:item) { { item: { title: '' } } }

        run_test!
      end

      response(404, 'list not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:list_id) { 'invalid' }
        let(:item) { { item: { title: 'New Item' } } }

        run_test!
      end
    end
  end

  path '/api/v1/items/{id}' do
    parameter name: 'id', in: :path, type: :integer, description: 'Item ID'

    get('Show a specific item') do
      tags 'Items'
      produces 'application/json'
      description 'Retrieves a specific item'

      response(200, 'successful') do
        schema '$ref' => '#/components/schemas/Item'

        let(:id) { create(:item).id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data).to have_key('id')
          expect(data).to have_key('title')
        end
      end

      response(404, 'item not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:id) { 'invalid' }

        run_test!
      end
    end

    patch('Update an item') do
      tags 'Items'
      consumes 'application/json'
      produces 'application/json'
      description 'Updates an existing item'

      parameter name: :item, in: :body, schema: {
        type: :object,
        properties: {
          item: {
            type: :object,
            properties: {
              title: { type: :string },
              description: { type: :string }
            }
          }
        },
        required: ['item']
      }

      response(200, 'item updated') do
        schema '$ref' => '#/components/schemas/Item'

        let(:id) { create(:item).id }
        let(:item) { { item: { title: 'Updated Item Title' } } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['title']).to eq('Updated Item Title')
        end
      end

      response(404, 'item not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:id) { 'invalid' }
        let(:item) { { item: { title: 'Updated Title' } } }

        run_test!
      end
    end

    delete('Delete an item') do
      tags 'Items'
      produces 'application/json'
      description 'Deletes a specific item'

      response(204, 'item deleted') do
        let(:id) { create(:item).id }

        run_test!
      end

      response(404, 'item not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:id) { 'invalid' }

        run_test!
      end
    end
  end
end
