export interface RouteInfo {
  path: string
  type: 'page' | 'layout'
  url?: string
  children?: RouteInfo[]
}

// Add your generated route types here
export type AppRoutes = string // This will be replaced by generated types
