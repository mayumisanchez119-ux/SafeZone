/* Shared Supabase project for Safe Zone. The browser key is intentionally
 * public; RLS policies in Supabase determine what it may access. */
const SafeZoneCloud = {
  url: 'https://rdrahdwmigktdrgkndky.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcmFoZHdtaWdrdGRyZ2tuZGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDM5MDIsImV4cCI6MjEwMzAxOTkwMn0.-Ct1QioJ5Kw6xVUfVWLeYDlmtMXFv9or7MDmNU6zwyM',

  async fetchContent() {
    const response = await fetch(
      `${SafeZoneCloud.url}/rest/v1/safezone_content?select=content_key,payload`,
      {
        headers: {
          apikey: SafeZoneCloud.key,
          Authorization: `Bearer ${SafeZoneCloud.key}`
        }
      }
    );

    if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
    const rows = await response.json();
    return Object.fromEntries(rows.map(row => [row.content_key, row.payload]));
  },

  async fetchTeacherSchedules() {
    const response = await fetch(
      `${SafeZoneCloud.url}/rest/v1/safezone_teacher_schedules?select=*&order=class_date.asc,start_time.asc`,
      { headers: { apikey: SafeZoneCloud.key, Authorization: `Bearer ${SafeZoneCloud.key}` } }
    );
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
    return response.json();
  },

  async signInTeacher(password) {
    const response = await fetch(`${SafeZoneCloud.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SafeZoneCloud.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'profesores@safezone.club', password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'No fue posible iniciar sesión.');
    return data;
  },

  async createTeacherSchedule(schedule, accessToken) {
    const response = await fetch(`${SafeZoneCloud.url}/rest/v1/safezone_teacher_schedules`, {
      method: 'POST',
      headers: {
        apikey: SafeZoneCloud.key,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(schedule)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Supabase respondió ${response.status}`);
    return data[0];
  }
};
