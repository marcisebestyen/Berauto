import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wigmyhhsaqvscmmshpdp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZ215aGhzYXF2c2NtbXNocGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzE5NzUsImV4cCI6MjA3NjU0Nzk3NX0.bj8pS8LSHHQBDsr6R_QodW3isUEy1GhXLJxFCbL42Hk';

export const supabase = createClient(supabaseUrl, supabaseKey);