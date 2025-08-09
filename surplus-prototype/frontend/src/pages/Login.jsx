
import React from 'react';

export default function Login(){
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Surplus Prototype — Demo</h2>
      <p>Use seeded users (see backend/seed.js). Example:</p>
      <ul className="list-disc ml-6">
        <li>canteen@campus / canteen123</li>
        <li>student1@campus / student123</li>
        <li>organizer@campus / organizer123</li>
        <li>ngo@local / ngo123</li>
      </ul>
      <p className="mt-4">Navigate using the top links to demo flows.</p>
    </div>
  )
}
