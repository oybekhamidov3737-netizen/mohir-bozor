import { Redirect } from 'expo-router';

// "Joylash" tugmasi bosilganda e'lon formasi ochiladi; bu sahifa ko'rinmaydi.
export default function NewTab() {
  return <Redirect href="/post" />;
}
