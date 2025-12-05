/// <reference types="vite/client" />

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// declare module 'uuid-js' {
//   const uuid: {
//     create(): any; // 根据实际API调整类型
//   };
//   export default uuid;
// }