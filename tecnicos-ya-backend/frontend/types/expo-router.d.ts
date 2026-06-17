declare module 'expo-router' {
  export function useRouter(): any;
  export function useSegments(): any;
  export const Stack: any;
  export const Tabs: any;
  export const Redirect: any;
  export function useLocalSearchParams<T = any>(): T;
  export const Link: any;
  export const makeRedirect: any;
  export const usePathname: any;
  export const useSearchParams: any;
  export const useSegmentsState: any;
}

declare module 'expo-router/html' {
  export const ScrollViewStyleReset: any;
}
