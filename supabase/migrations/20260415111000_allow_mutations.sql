-- Drop existing read-only policies
DROP POLICY IF EXISTS "Allow public read clients" ON clients;
DROP POLICY IF EXISTS "Allow public read structures" ON structures;
DROP POLICY IF EXISTS "Allow public read jobs" ON job_positions;
DROP POLICY IF EXISTS "Allow public insert candidates" ON candidates;
DROP POLICY IF EXISTS "Allow public read candidates" ON candidates;

-- Create ALL permissions for the basic MVP (Security is handled at Next.js Route level)
CREATE POLICY "Allow full access clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access structures" ON structures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access jobs" ON job_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access candidates" ON candidates FOR ALL USING (true) WITH CHECK (true);
