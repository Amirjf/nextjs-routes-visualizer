import fs from 'fs'
import path from 'path'
import os from 'os'

interface RouteInfo {
  path: string
  type: 'page' | 'layout' | 'not-found' | 'loading' | 'error'
  children?: RouteInfo[]
}

class RouteGenerator {
  private cachePath: string

  constructor() {
    this.cachePath = path.join(os.tmpdir(), 'nextjs-routes-visualizer')
    fs.mkdirSync(this.cachePath, { recursive: true })
  }

  generateRoutes(routesDirectory: string = './app'): RouteInfo[] {
    const traverseDirectory = (
      dirPath: string,
      currentPath: string = '',
    ): RouteInfo[] => {
      const entries = fs.readdirSync(dirPath)
      const directoryRoutes: RouteInfo[] = []

      entries.forEach((entry) => {
        const fullPath = path.join(dirPath, entry)
        const relativePath = path.join(currentPath, entry)

        if (fs.statSync(fullPath).isDirectory()) {
          const routeInfo: RouteInfo = {
            path: relativePath,
            type: 'page',
            children: traverseDirectory(fullPath, relativePath),
          }

          const specialFiles = [
            'page.tsx',
            'page.js',
            'layout.tsx',
            'layout.js',
            'loading.tsx',
            'loading.js',
            'not-found.tsx',
            'not-found.js',
            'error.tsx',
            'error.js',
          ]

          specialFiles.forEach((file) => {
            if (fs.existsSync(path.join(fullPath, file))) {
              const fileType = file.split('.')[0]
              switch (fileType) {
                case 'page':
                  routeInfo.type = 'page'
                  break
                case 'layout':
                  routeInfo.type = 'layout'
                  break
                case 'loading':
                  routeInfo.type = 'loading'
                  break
                case 'not-found':
                  routeInfo.type = 'not-found'
                  break
                case 'error':
                  routeInfo.type = 'error'
                  break
              }
            }
          })

          directoryRoutes.push(routeInfo)
        }
      })

      return directoryRoutes
    }

    const routes = traverseDirectory(routesDirectory)
    this.saveRoutesToCache(routes)
    return routes
  }

  private saveRoutesToCache(routes: RouteInfo[]) {
    const cacheFile = path.join(this.cachePath, 'routes.json')
    fs.writeFileSync(cacheFile, JSON.stringify(routes, null, 2))
  }

  readRoutesFromCache(): RouteInfo[] {
    const cacheFile = path.join(this.cachePath, 'routes.json')
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
    } catch {
      return []
    }
  }
}

export const RouteVisualizer: React.FC = () => {
  const generator = new RouteGenerator()
  const routes = generator.readRoutesFromCache()

  const renderRoutes = (routeList: RouteInfo[]) => (
    <ul>
      {routeList.map((route, index) => (
        <li key={index}>
          <div>
            {route.path} ({route.type})
          </div>
          {route.children && route.children.length > 0 && (
            <ul>{renderRoutes(route.children)}</ul>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <div>
      <h2>Next.js Routes</h2>
      {renderRoutes(routes)}
    </div>
  )
}

export default RouteGenerator
