import { redirect } from 'next/navigation';

export default function HubRoot() {
  redirect('/facilitators/hub/dashboard');
}
