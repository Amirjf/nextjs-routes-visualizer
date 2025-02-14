import fs from 'fs'
import path from 'path'
import os from 'os'
import type { RouteInfo } from './types.js'
import { Boundary } from './Boundry.js'

class RouteGenerator {
  private cachePath: string
  private typesPath: string

  constructor() {
    this.cachePath = path.join(os.tmpdir(), 'nextjs-routes-visualizer')
    this.typesPath = path.join(
      process.cwd(),
      'node_modules',
      '@types',
      'nextjs-routes-visualizer',
    )
    fs.mkdirSync(this.cachePath, { recursive: true })
    fs.mkdirSync(this.typesPath, { recursive: true })
  }

  private generateTypeContent(routes: RouteInfo[]): string {
    const extractPaths = (routes: RouteInfo[]): string[] => {
      return routes.reduce((paths: string[], route) => {
        if (route.type === 'page' && route.url) {
          paths.push(`'${route.url}'`)
        }
        if (route.children) {
          paths.push(...extractPaths(route.children))
        }
        return paths
      }, [])
    }

    const paths = extractPaths(routes)
    return `
// This file is auto-generated. DO NOT EDIT
export type AppRoutes = ${paths.join(' | ')}

export const routes = ${JSON.stringify(routes, null, 2)} as const
`
  }

  private formatPathToUrl(routePath: string): string {
    return '/' + routePath.replace(/\/page$/, '')
  }

  private generateTypeDefinitions(routes: RouteInfo[]): string {
    let typeContent = 'export type AppRoutes =\n'
    const extractPaths = (
      routes: RouteInfo[],
      parentPath: string = '',
    ): string[] => {
      return routes.reduce((acc: string[], route) => {
        if (route.type === 'page') {
          const fullPath = path.join(parentPath, route.path)
          const url = this.formatPathToUrl(fullPath)
          console.log(url)
          acc.push(`  | '${url}'`)
        }
        if (route.children) {
          acc.push(...extractPaths(route.children, route.path))
        }
        return acc
      }, [])
    }

    typeContent += extractPaths(routes).join('\n')
    return typeContent
  }
  private processRoutes(
    dirPath: string,
    currentPath: string = '',
  ): RouteInfo[] {
    const entries = fs.readdirSync(dirPath)
    const directoryRoutes: RouteInfo[] = []

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry)
      const relativePath = path.join(currentPath, entry)

      if (fs.statSync(fullPath).isDirectory()) {
        // Determine type first: if a page file exists, mark as 'page'
        const hasPageFile =
          fs.existsSync(path.join(fullPath, 'page.tsx')) ||
          fs.existsSync(path.join(fullPath, 'page.js'))

        // Process children regardless of type
        const children = this.processRoutes(fullPath, relativePath)

        // Set type based on the existence of a page file
        const type = hasPageFile ? 'page' : 'layout'
        const routeInfo: RouteInfo = {
          path: relativePath,
          type,
          children,
        }

        // If it's a page, set the URL immediately
        if (hasPageFile) {
          routeInfo.url = this.formatPathToUrl(relativePath)
        }

        // Only add routes that are pages or have children that eventually resolve to pages
        if (type === 'page' || (children && children.length > 0)) {
          directoryRoutes.push(routeInfo)
        }
      }
    })

    return directoryRoutes
  }

  generateRoutes(routesDirectory: string = './app'): RouteInfo[] {
    const routes = this.processRoutes(routesDirectory)

    const typeContent = this.generateTypeContent(routes)
    const outputPath = path.join(process.cwd(), 'node_modules', '.next-routes')

    fs.mkdirSync(outputPath, { recursive: true })
    fs.writeFileSync(path.join(outputPath, 'routes.ts'), typeContent)
    // Save routes to cache
    const cacheFile = path.join(this.cachePath, 'routes.json')
    fs.writeFileSync(cacheFile, JSON.stringify(routes, null, 2))

    // Generate and save type definitions
    const typeDefinitions = this.generateTypeDefinitions(routes)
    fs.writeFileSync(path.join(this.typesPath, 'routes.d.ts'), typeDefinitions)

    console.log(`Routes generated at ${cacheFile}`)
    console.log(`Types generated at ${this.typesPath}/routes.d.ts`)

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
  // Read routes from cache (generated earlier)
  const routes: RouteInfo[] = generator.readRoutesFromCache()

  console.log(routes)

  // Filter out only the routes that have a URL (i.e. are page routes)
  // const pageRoutes = routes.filter((route) => route.type === 'page')

  // If your structure is nested you can flatten or recursively render them.
  // For simplicity, assume a flat array here.
  const renderRoutes = (routeList: RouteInfo[]) => (
    <ul className="space-y-2">
      {routeList.map((route, index) => (
        <li key={index}>
          <Boundary
            labels={[`./${route.path}`]} // Show the URL as a label
            color="blue" // adjust color as desired
            size="default"
            animateRerendering={false} // disable animation if not needed
          >
            <a
              href={`./${route.path}`}
              className="block p-3 bg-white hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
            >
              {`./${route.path}`}
            </a>
          </Boundary>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Next.js Page Routes</h2>
      {renderRoutes(routes)}
    </div>
  )
}

export default RouteGenerator
