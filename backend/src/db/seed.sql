-- Create default user (password: password123)
INSERT INTO users (email, name, password_hash)
VALUES ('user@example.com', 'Demo User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17hxW')
ON CONFLICT (email) DO NOTHING;

-- Get user ID and create board, then create columns
DO $$
DECLARE
  user_id UUID;
  board_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM users WHERE email = 'user@example.com' LIMIT 1;

  -- Create default board
  INSERT INTO boards (user_id, name)
  VALUES (user_id, 'My Kanban Board')
  RETURNING id INTO board_id;

  -- Create default columns
  INSERT INTO columns (board_id, name, position) VALUES
    (board_id, 'Backlog', 0),
    (board_id, 'To Do', 1),
    (board_id, 'In Progress', 2),
    (board_id, 'Done', 3);
END $$;
