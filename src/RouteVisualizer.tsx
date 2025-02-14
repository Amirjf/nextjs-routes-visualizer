// RouteVisualizer.tsx
import React from 'react'
import type { RouteInfo, AppRoutes } from './types.js'

interface RouteVisualizerProps {
  routes: RouteInfo[]
}

// activity
// link to

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ routes }) => {
  console.log(routes)
  const renderRoutes = (routeList: RouteInfo[]) => (
    <ul className="space-y-2">
      {routeList.map((route, index) => (
        <li key={index} className="relative">
          {route.type === 'layout' ? (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">{route.path}</div>
              {route.children && (
                <div className="pl-4 border-l-2 border-blue-200">
                  {renderRoutes(route.children)}
                </div>
              )}
            </div>
          ) : (
            <a
              href={route.url}
              className="block p-3 bg-white hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
            >
              <span className="text-blue-600 hover:text-blue-800">
                {route.url}
              </span>
            </a>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Next.js Routes</h2>
      {renderRoutes(routes)}
    </div>
  )
}
