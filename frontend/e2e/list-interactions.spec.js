import { test, expect } from '@playwright/test';

async function mockListApi(page, { authenticated = true, currentUserId = 2, currentUsername = 'tester' } = {}) {
  let likedByUser = false;
  let likesCount = 0;
  let itemLikedByUser = false;
  let itemLikesCount = 0;
  const comments = [
    {
      id: 700,
      body: 'Seed comment',
      user_id: 2,
      list_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: 2, username: 'tester' },
    },
    {
      id: 701,
      body: 'Other user comment',
      user_id: 9,
      list_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: 9, username: 'guest' },
    },
  ];
  const attachments = [
    {
      id: 950,
      kind: 'link',
      title: 'Reference Docs',
      url: 'https://example.com/docs',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-jwt');
      localStorage.setItem('user', JSON.stringify({ id: currentUserId, username: currentUsername }));
    });
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }

  await page.route('**/api/v1/auth/me', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: currentUserId, username: currentUsername, email: 'tester@example.com' },
      }),
    });
  });

  await page.route('**/api/v1/lists/1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        user_id: 1,
        title: 'E2E Test List',
        description: 'Testing list interactions',
        visibility: 'public',
        likes_count: likesCount,
        liked_by_current_user: likedByUser,
        items: [
          {
            id: 100,
            list_id: 1,
            name: 'Test Item',
            category: 'General',
            notes: 'Test note',
            rating: 4,
            likes_count: itemLikesCount,
            liked_by_current_user: itemLikedByUser,
          },
        ],
        comments,
        attachments,
      }),
    });
  });

  await page.route('**/api/v1/lists/1/like', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    if (route.request().method() === 'POST') {
      likedByUser = true;
      likesCount = 1;
    } else if (route.request().method() === 'DELETE') {
      likedByUser = false;
      likesCount = 0;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        list_id: 1,
        likes_count: likesCount,
        liked_by_current_user: likedByUser,
      }),
    });
  });

  await page.route('**/api/v1/items/100/like', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    if (route.request().method() === 'POST') {
      itemLikedByUser = true;
      itemLikesCount = 1;
    } else if (route.request().method() === 'DELETE') {
      itemLikedByUser = false;
      itemLikesCount = 0;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        item_id: 100,
        likes_count: itemLikesCount,
        liked_by_current_user: itemLikedByUser,
      }),
    });
  });

  await page.route('**/api/v1/lists/1/comments', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      comments.unshift({
        id: 900,
        body: body.comment.body,
        user_id: 2,
        list_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: { id: 2, username: 'tester' },
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(comments[0]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(comments),
    });
  });

  await page.route('**/api/v1/comments/*', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    const id = Number(route.request().url().split('/').pop());
    const idx = comments.findIndex((comment) => comment.id === id);
    if (idx >= 0) {
      comments.splice(idx, 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Comment not found' }),
    });
  });

  await page.route('**/api/v1/lists/1/attachments', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    if (route.request().method() === 'POST') {
      attachments.unshift({
        id: 951,
        kind: 'link',
        title: 'API Guide',
        url: 'https://example.com/api-guide',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(attachments[0]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(attachments),
    });
  });
}

test('user can like list/item and comment on list', async ({ page }) => {
  await mockListApi(page, { authenticated: true });
  await page.goto('/lists/1');

  await expect(page.getByRole('heading', { name: 'E2E Test List' })).toBeVisible();
  await page.getByRole('button', { name: /i like it/i }).click();
  await expect(page.getByRole('button', { name: /liked/i })).toContainText('(1)');

  await page.getByTitle('Like this item').click();
  await expect(page.getByTitle('Like this item')).toContainText('(1)');

  await page.getByPlaceholder('Share your thoughts about this list...').fill('Great collection!');
  await page.getByRole('button', { name: 'Post Comment' }).click();
  await expect(page.getByText('Great collection!')).toBeVisible();
});

test('comment owner can delete own comment', async ({ page }) => {
  await mockListApi(page, { authenticated: true });
  await page.goto('/lists/1');

  await expect(page.getByText('Seed comment')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await expect(page.getByText('Seed comment')).toHaveCount(0);
});

test('unauthenticated user sees disabled comment input and blocked actions', async ({ page }) => {
  await mockListApi(page, { authenticated: false });
  await page.goto('/lists/1');

  await expect(page.getByPlaceholder('Log in to leave a comment')).toBeDisabled();
  await expect(page.getByRole('button', { name: /i like it/i })).toBeVisible();
  await page.getByRole('button', { name: /i like it/i }).click();
  await expect(page.getByText('Please log in to use this feature')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
});

test('shows clean moderation warning when comment is rejected with 422', async ({ page }) => {
  await mockListApi(page, { authenticated: true });

  await page.route('**/api/v1/lists/1/comments', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ errors: ['Content contains inappropriate language.'] }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/lists/1');
  await page.getByPlaceholder('Share your thoughts about this list...').fill('n1gg@');
  await page.getByRole('button', { name: 'Post Comment' }).click();

  await expect(
    page.getByText('Content contains inappropriate language. Please keep comments clean and age-friendly.')
  ).toBeVisible();
});

test('list owner can add a link attachment', async ({ page }) => {
  await mockListApi(page, { authenticated: true, currentUserId: 1, currentUsername: 'owner' });

  await page.goto('/lists/1');
  await expect(page.getByRole('heading', { name: 'Attachments', exact: true })).toBeVisible();

  const listAttachmentForm = page.locator('form').filter({ hasText: 'Add list attachment' });
  await listAttachmentForm.getByPlaceholder('https://… (optional link)').fill('https://example.com/api-guide');
  await listAttachmentForm.getByPlaceholder('Optional label').fill('API Guide');
  await listAttachmentForm.getByRole('button', { name: 'Add attachment' }).click();

  await expect(page.getByText('API Guide')).toBeVisible();
});
