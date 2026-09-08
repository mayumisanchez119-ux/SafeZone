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
  }
};
