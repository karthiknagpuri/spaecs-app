-- Function to increment creator earnings
CREATE OR REPLACE FUNCTION increment_creator_earnings(
  creator_username TEXT,
  amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE creator_profiles
  SET
    total_earnings = COALESCE(total_earnings, 0) + amount,
    updated_at = now()
  WHERE username = creator_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get creator stats
CREATE OR REPLACE FUNCTION get_creator_stats(creator_username TEXT)
RETURNS TABLE(
  total_supporters INT,
  monthly_supporters INT,
  total_earnings DECIMAL,
  this_month_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM payments WHERE creator_id = creator_username AND status = 'completed')::INT as total_supporters,
    (SELECT COUNT(*) FROM supporters s JOIN creator_profiles cp ON s.creator_id = cp.id WHERE cp.username = creator_username AND s.status = 'active')::INT as monthly_supporters,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE creator_id = creator_username AND status = 'completed') as total_earnings,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE creator_id = creator_username AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)) as this_month_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supporting a creator
CREATE OR REPLACE FUNCTION is_supporting_creator(
  checking_user_id UUID,
  creator_username TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM supporters s
    JOIN creator_profiles cp ON s.creator_id = cp.id
    WHERE s.user_id = checking_user_id
    AND cp.username = creator_username
    AND s.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;