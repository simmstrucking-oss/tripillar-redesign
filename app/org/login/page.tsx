import { redirect } from 'next/navigation';

// Canonical org login is at /login/organization
// This file kept as a server-side redirect to avoid broken links
export default function OrgLoginLegacy() {
  redirect('/login/organization');
}
