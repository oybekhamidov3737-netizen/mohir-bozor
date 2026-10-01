import { useColorScheme } from 'react-native';

const light = {
  dark: false,
  bg: '#F2F3EE', surface: '#FFFFFF', ink: '#141D19', muted: '#5C6862', line: '#DADED4', chip: '#E6E9E0',
  accent: '#1E48D6', accentInk: '#FFFFFF', accentSoft: '#E3E9FF',
  price: '#0C7148', danger: '#B42318', dangerSoft: '#FDECEA',
  gold: '#C99500', goldSoft: '#FFF4CF', goldInk: '#2A1F00',
  cover: ['#DCE6FF', '#FFE7C7', '#D6F2E3', '#F7DCEB', '#E9E1FF', '#FFF1B8'], coverInk: '#141D19',
};
const dark = {
  dark: true,
  bg: '#0E1311', surface: '#171E1B', ink: '#E9EFEA', muted: '#9AA69F', line: '#28322D', chip: '#212A26',
  accent: '#7E9BFF', accentInk: '#0E1311', accentSoft: '#1F2950',
  price: '#5BD49A', danger: '#FF8A7A', dangerSoft: '#3A1D1A',
  gold: '#F2C440', goldSoft: '#3A2F0E', goldInk: '#1A1405',
  cover: ['#24305A', '#4A3518', '#173D2B', '#45213A', '#2F2557', '#433A10'], coverInk: '#F1F4F1',
};

export function useT() {
  return useColorScheme() === 'dark' ? dark : light;
}

export const FONT = {
  display: 'Unbounded_700Bold',
  displayM: 'Unbounded_500Medium',
};
