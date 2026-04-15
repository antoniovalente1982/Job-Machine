import fs from 'fs';

const token = "sbp_e6ece6642ca8af8b2cb8e9a0b2f650d93b1f394b";
const ref = "xtgqzixgrlotrkbzahbm";
const sql = "SELECT id, email, first_name, last_name, role FROM profiles;";

fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
}).then(async r => {
  if (!r.ok) {
    console.error("Error", r.status, await r.text());
    process.exit(1);
  }
  console.log("Profiles:", await r.text());
}).catch(console.error);
