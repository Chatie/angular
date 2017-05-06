/* SystemJS module definition */
declare var module: NodeModule
interface NodeModule {
  id: string
}
declare module '*/package.json' {
  export const version: string
  // export default version
}
